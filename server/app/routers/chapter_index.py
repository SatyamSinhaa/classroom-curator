from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..models import Teacher, Class
from models.chapter_index import ChapterIndex, Chapter, SubTopic, TeachingProgress
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from services import llm_service

# Import auth dependency
from ..auth import get_current_teacher

router = APIRouter(prefix="/chapter-index", tags=["chapter-index"])


@router.get("/")
def get_or_generate_chapter_index(
    subject: str,
    grade: int,
    board: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Get existing chapter index from database or generate new one for subject/grade/board.
    If generated, stores permanently in database for all future teachers to use.
    Returns the chapter index with all chapters and subtopics.
    """
    try:
        # Check if index already exists in database
        existing_index = db.query(ChapterIndex).filter(
            ChapterIndex.subject == subject,
            ChapterIndex.grade == grade,
            ChapterIndex.board == board
        ).first()
        
        if existing_index:
            print(f"DEBUG: Found existing chapter index (ID: {existing_index.id}) for {subject} Grade {grade} {board}")
            # Return existing index with chapters and subtopics
            chapters_data = []
            for chapter in existing_index.chapters:
                subtopics_data = [
                    {
                        "id": st.id,
                        "subtopicNumber": st.subtopic_number,
                        "subtopicName": st.subtopic_name,
                        "description": st.description
                    }
                    for st in chapter.subtopics
                ]
                chapters_data.append({
                    "id": chapter.id,
                    "chapterNumber": chapter.chapter_number,
                    "chapterName": chapter.chapter_name,
                    "description": chapter.description,
                    "subtopics": subtopics_data
                })
            
            return {
                "indexId": existing_index.id,
                "subject": existing_index.subject,
                "grade": existing_index.grade,
                "board": existing_index.board,
                "chapters": chapters_data,
                "fromCache": True
            }
        
        # Generate new index using LLM
        print(f"DEBUG: Generating new chapter index for {subject} Grade {grade} {board}")
        index_data = llm_service.generate_chapter_index(subject, grade, board)
        
        # Create new ChapterIndex record
        new_index = ChapterIndex(
            subject=subject,
            grade=grade,
            board=board
        )
        db.add(new_index)
        db.flush()  # Get the ID
        
        # Create Chapter and SubTopic records
        chapters_data = []
        for chapter_info in index_data.get("chapters", []):
            new_chapter = Chapter(
                index_id=new_index.id,
                chapter_number=chapter_info["chapterNumber"],
                chapter_name=chapter_info["chapterName"],
                description=chapter_info.get("description", "")
            )
            db.add(new_chapter)
            db.flush()  # Get the chapter ID
            
            # Create subtopics
            subtopics_data = []
            for subtopic_info in chapter_info.get("subtopics", []):
                new_subtopic = SubTopic(
                    chapter_id=new_chapter.id,
                    subtopic_number=subtopic_info["subtopicNumber"],
                    subtopic_name=subtopic_info["subtopicName"],
                    description=subtopic_info.get("description", "")
                )
                db.add(new_subtopic)
                db.flush()
                
                subtopics_data.append({
                    "id": new_subtopic.id,
                    "subtopicNumber": new_subtopic.subtopic_number,
                    "subtopicName": new_subtopic.subtopic_name,
                    "description": new_subtopic.description
                })
            
            chapters_data.append({
                "id": new_chapter.id,
                "chapterNumber": new_chapter.chapter_number,
                "chapterName": new_chapter.chapter_name,
                "description": new_chapter.description,
                "subtopics": subtopics_data
            })
        
        db.commit()
        
        print(f"DEBUG: Successfully created chapter index (ID: {new_index.id}) with {len(chapters_data)} chapters")
        
        return {
            "indexId": new_index.id,
            "subject": new_index.subject,
            "grade": new_index.grade,
            "board": new_index.board,
            "chapters": chapters_data,
            "fromCache": False
        }
    
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to get/generate chapter index: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get chapter index: {str(e)}")


@router.get("/teaching-progress")
def get_teaching_progress(
    class_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Get teacher's teaching progress for a specific class.
    Returns which chapters/subtopics have been taught.
    """
    try:
        progress_records = db.query(TeachingProgress).filter(
            TeachingProgress.teacher_id == current_teacher.id,
            TeachingProgress.class_id == class_id
        ).all()
        
        # Group by chapter
        progress_by_chapter = {}
        for record in progress_records:
            chapter_id = record.chapter_id
            if chapter_id not in progress_by_chapter:
                progress_by_chapter[chapter_id] = {
                    "chapterId": chapter_id,
                    "subtopicIds": [],
                    "lastTaught": record.taught_at
                }
            
            # Merge subtopic IDs
            progress_by_chapter[chapter_id]["subtopicIds"].extend(record.subtopic_ids)
            
            # Update last taught date if more recent
            if record.taught_at > progress_by_chapter[chapter_id]["lastTaught"]:
                progress_by_chapter[chapter_id]["lastTaught"] = record.taught_at
        
        # Convert to list and format dates
        progress_list = []
        for chapter_id, data in progress_by_chapter.items():
            progress_list.append({
                "chapterId": data["chapterId"],
                "subtopicIds": list(set(data["subtopicIds"])),  # Remove duplicates
                "lastTaught": data["lastTaught"].isoformat() if data["lastTaught"] else None
            })
        
        return {"progress": progress_list}
    
    except Exception as e:
        print(f"ERROR: Failed to get teaching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get teaching progress: {str(e)}")


class TeachingProgressRequest(BaseModel):
    chapterId: int
    subtopicIds: List[int]
    classId: int
    lessonPlanId: Optional[int] = None


@router.post("/teaching-progress")
def record_teaching_progress(
    request: TeachingProgressRequest,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Record that teacher has taught specific subtopics.
    """
    try:
        # Create new teaching progress record
        progress = TeachingProgress(
            teacher_id=current_teacher.id,
            chapter_id=request.chapterId,
            class_id=request.classId,
            subtopic_ids=request.subtopicIds,
            lesson_plan_id=request.lessonPlanId
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
        print(f"DEBUG: Recorded teaching progress for teacher {current_teacher.id}, chapter {request.chapterId}")
        
        return {
            "id": progress.id,
            "message": "Teaching progress recorded successfully"
        }
    
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to record teaching progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record teaching progress: {str(e)}")
