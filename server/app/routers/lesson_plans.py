from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from ..database import get_db
from ..models import LessonPlan, Teacher
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from services import pdf_extractor, youtube_service, llm_service, vector_service
import json

# Import auth dependency
from ..auth import get_current_teacher

router = APIRouter(prefix="/lesson-plans", tags=["lesson-plans"])

@router.get("/topics")
def get_teacher_topics(class_id: Optional[int] = None, current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """
    Get all unique topics from the teacher's lesson plans, optionally filtered by class_id.
    """
    try:
        # Build query
        query = db.query(LessonPlan.content).filter(
            LessonPlan.user_id == current_teacher.id
        )
        
        if class_id:
            query = query.filter(LessonPlan.class_id == class_id)
            
        lesson_plans = query.order_by(LessonPlan.created_at.desc()).all()
        
        topics_map = {}
        for lp in lesson_plans:
            # content is already a dict because of sqlalchemy JSON type, or str if legacy
            content = lp[0]
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except:
                    continue
            
            if isinstance(content, dict):
                # Try to find topic in various places
                topic = content.get("topic") or content.get("title")
                if topic and topic not in topics_map:
                    topics_map[topic] = {
                        "topic": topic,
                        "subject": content.get("subject", ""),
                        "grade": content.get("grade", "")
                    }
                    
        # Return list of dicts sorted by topic name
        return {"topics": sorted(list(topics_map.values()), key=lambda x: x["topic"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch topics: {str(e)}")

class LessonPlanRequest(BaseModel):
    mode: str  # "topic" | "youtube"
    topic: Optional[str] = None
    youtubeUrl: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    classDurationMins: int
    existingPlan: Optional[Dict[str, Any]] = None
    refinementPrompt: Optional[str] = None
    lessonPlanId: Optional[int] = None
    classId: Optional[int] = None

@router.post("/generate")
def generate_lesson_plan(request: LessonPlanRequest, current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """
    Generate lesson plan from topic or YouTube URL.
    """
    try:
        # Extract text based on mode
        if request.mode == "youtube":
            if not request.youtubeUrl:
                raise HTTPException(status_code=400, detail="YouTube URL required for youtube mode")
            text = youtube_service.get_transcript(request.youtubeUrl)
            source_type = "youtube"
            source_url = request.youtubeUrl
        elif request.mode == "topic":
            if not request.topic:
                raise HTTPException(status_code=400, detail="Topic text required for topic mode")
            text = request.topic
            source_type = "topic"
            source_url = None
        # Tweak / Refine mode
        elif request.mode == "tweak":
            if not request.refinementPrompt:
                raise HTTPException(status_code=400, detail="refinementPrompt required for tweak mode")
            
            matches = []
            if request.lessonPlanId:
                try:
                    # RAG: Retrieve targeted context sections from Pinecone
                    print(f"DEBUG: Querying Pinecone for refinement: '{request.refinementPrompt}' (ID: {request.lessonPlanId})")
                    matches = vector_service.query_lesson_plan(request.lessonPlanId, request.refinementPrompt)
                    print(f"DEBUG: Found {len(matches)} matches from Pinecone.")
                    for i, m in enumerate(matches):
                        print(f"  Match {i+1}: Score={m['score']:.4f}, Path={m.get('path')}")
                except Exception as e:
                    print(f"Vector search failed: {str(e)}")
            
            lesson_plan_data = None
            if matches and request.existingPlan:
                try:
                    print(f"DEBUG: Attempting Atomic Refinement with {len(matches)} matches.")
                    # Atomic Refinement: Generate only the updated parts
                    patch_data = llm_service.generate_lesson_plan_patch(
                        matches=matches,
                        refinement_prompt=request.refinementPrompt,
                        grade=request.grade or request.existingPlan.get("grade", 5),
                        subject=request.subject or request.existingPlan.get("subject", "General"),
                        class_duration_mins=request.classDurationMins
                    )
                    print(f"DEBUG: Patch data received: {patch_data}")
                    # Merge patches into the existing plan
                    lesson_plan_data = llm_service.apply_patches(request.existingPlan, patch_data)
                    print("DEBUG: Atomic refinement successful.")
                except Exception as e:
                    print(f"Atomic refinement failed, falling back to full generation: {str(e)}")
            
            if not lesson_plan_data:
                print("DEBUG: Falling back to full Plan Generation strategy.")
                # Fallback to full plan if no vector matches, no existing plan provided, or atomic failed
                text = json.dumps(request.existingPlan) if request.existingPlan else ""
                lesson_plan_data = llm_service.generate_lesson_plan(
                    text=text,
                    grade=request.grade or (request.existingPlan.get("grade") if request.existingPlan else 5),
                    subject=request.subject or (request.existingPlan.get("subject") if request.existingPlan else "General"),
                    class_duration_mins=request.classDurationMins,
                    refinement_prompt=request.refinementPrompt,
                    context=None
                )
            source_type = "tweak"
            source_url = None
        else:
            raise HTTPException(status_code=400, detail="Invalid mode. Use 'topic', 'youtube', or 'tweak'")

        # Original generation mode (topic/youtube)
        if request.mode != "tweak":
            # Generate lesson plan using LLM
            lesson_plan_data = llm_service.generate_lesson_plan(
                text=text,
                grade=request.grade or 5,
                subject=request.subject or "General",
                class_duration_mins=request.classDurationMins
            )

        # Add source attribution if not present
        if "sourceAttribution" not in lesson_plan_data:
            lesson_plan_data["sourceAttribution"] = {
                "type": source_type,
                "url": source_url,
                "coverageNotes": f"Generated from {source_type} source"
            }

        # Save to database with authenticated teacher ID
        lesson_plan = LessonPlan(
            user_id=current_teacher.id,  # Use authenticated teacher ID
            title=lesson_plan_data.get("title", "Untitled Lesson Plan"),
            content=lesson_plan_data,
            source_type=source_type,
            source_url=source_url,
            class_id=request.classId
        )

        db.add(lesson_plan)
        db.commit()
        db.refresh(lesson_plan)

        # Vector Storage (Background-like or inline for now)
        try:
            vector_service.upsert_lesson_plan(lesson_plan.id, lesson_plan_data)
        except Exception as e:
            print(f"Failed to upsert to vector DB: {str(e)}")
            # Don't fail the whole request if vector storage fails

        # Return lesson plan with database ID
        response_data = lesson_plan_data.copy()
        response_data["id"] = lesson_plan.id

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson plan: {str(e)}")

@router.post("/generate-from-pdf")
def generate_lesson_plan_from_pdf(
    file: UploadFile = File(...),
    classDurationMins: int = Form(...),
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Generate lesson plan from uploaded PDF file.
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Read file content
        pdf_bytes = file.file.read()

        # Extract text from PDF
        text = pdf_extractor.extract_text(pdf_bytes)

        # Generate lesson plan using LLM with default values for PDF mode
        lesson_plan_data = llm_service.generate_lesson_plan(
            text=text,
            grade=5,  # Default grade for PDF mode
            subject="General",  # Default subject for PDF mode
            class_duration_mins=classDurationMins
        )

        # Add source attribution
        lesson_plan_data["sourceAttribution"] = {
            "type": "pdf",
            "url": file.filename,
            "coverageNotes": "Generated from uploaded PDF"
        }

        # Save to database with authenticated teacher ID
        lesson_plan = LessonPlan(
            user_id=current_teacher.id,  # Use authenticated teacher ID
            title=lesson_plan_data.get("title", "Untitled Lesson Plan"),
            content=lesson_plan_data,
            source_type="pdf",
            source_url=file.filename
        )

        db.add(lesson_plan)
        db.commit()
        db.refresh(lesson_plan)
        
        print(f"DEBUG: Lesson plan created (PDF). New record ID: {lesson_plan.id}")

        # Vector Storage
        try:
            vector_service.upsert_lesson_plan(lesson_plan.id, lesson_plan_data)
        except Exception as e:
            print(f"Failed to upsert to vector DB (PDF): {str(e)}")

        # Return lesson plan with database ID
        response_data = lesson_plan_data.copy()
        response_data["id"] = lesson_plan.id

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson plan: {str(e)}")

@router.get("/{lesson_plan_id}")
def get_lesson_plan(lesson_plan_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a saved lesson plan by ID.
    """
    lesson_plan = db.query(LessonPlan).filter(LessonPlan.id == lesson_plan_id).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")

    # Return lesson plan content with ID
    response_data = lesson_plan.content.copy()
    response_data["id"] = lesson_plan.id

    return response_data

@router.get("/history/{source_type}")
def get_lesson_plan_history(source_type: str, current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db), limit: int = 10):
    """
    Get lesson plan history for a specific source type (topic, pdf, youtube).
    Returns the most recent lesson plans filtered by source_type.
    """
    if source_type not in ["topic", "pdf", "youtube"]:
        raise HTTPException(status_code=400, detail="Invalid source type. Must be 'topic', 'pdf', or 'youtube'")

    try:
        # Use raw SQL to avoid model column issues
        from sqlalchemy import text

        query = text("""
            SELECT id, title, content, source_url, source_type, created_at
            FROM lesson_plans
            WHERE source_type = :source_type AND user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        result = db.execute(query, {"source_type": source_type, "user_id": current_teacher.id, "limit": limit})

        rows = result.fetchall()
    except Exception as e:
        print(f"Database query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Return simplified history data
    history = []
    for row in rows:
        try:
            content_raw = row[2]  # content column (JSON string)

            # Parse JSON string to dict
            import json
            if isinstance(content_raw, str):
                try:
                    content = json.loads(content_raw)
                except json.JSONDecodeError:
                    continue
            else:
                content = content_raw

            # Ensure content is a dict
            if isinstance(content, dict):
                history_item = {
                    "id": row[0],  # id
                    "title": content.get("title", "Untitled"),
                    "subject": content.get("subject", "Unknown"),
                    "grade": content.get("grade", "Unknown"),
                    "created_at": row[5].isoformat() if row[5] else None,  # created_at
                    "source_url": row[3],  # source_url
                    "source_type": row[4]  # source_type from database
                }
                history.append(history_item)
        except Exception:
            continue

    return {"history": history, "source_type": source_type}
