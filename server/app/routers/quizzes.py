from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, Dict, Union, List
from ..database import get_db
from ..models import Quiz, QuestionType, DifficultyLevel
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from services.quiz_service import QuizGenerator
from services.pdf_service import QuizPDFGenerator
from ..auth import get_current_teacher
from datetime import datetime

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

class QuizGenerateRequest(BaseModel):
    topic: str
    subject: str
    grade: int
    question_types: Dict[str, int]  # e.g. {"mcq": 5, "true_false": 3}
    difficulty: DifficultyLevel
    lesson_plan_id: Optional[int] = None
    context: Optional[str] = ""

class QuizSaveRequest(BaseModel):
    topic: str
    subject: str
    grade: int
    question_types: Dict[str, int]
    difficulty: DifficultyLevel
    lesson_plan_id: Optional[int] = None
    context: Optional[str] = ""
    questions_data: dict
    answer_key: Union[list, dict, None] = None

quiz_generator = QuizGenerator()
pdf_generator = QuizPDFGenerator()

@router.post("/generate")
def generate_quiz(request: QuizGenerateRequest, current_teacher = Depends(get_current_teacher)):
    """
    Generate quiz questions using LLM (no database save yet).
    """
    try:
        # Calculate total number of questions
        total_questions = sum(request.question_types.values())
        
        # Generate quiz using service
        quiz_data = quiz_generator.generate_quiz(
            topic=request.topic,
            subject=request.subject,
            grade=request.grade,
            num_questions=total_questions,
            question_types=request.question_types,
            difficulty=request.difficulty.value,
            context=request.context
        )

        return {
            "quiz_id": None,  # No DB save yet
            "quiz_title": quiz_data.get("quiz_title", f"{request.topic} Quiz"),
            "questions_data": quiz_data,
            "answer_key": quiz_data.get("answer_key", [])
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.post("/")
def save_quiz(request: QuizSaveRequest, current_teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """
    Save generated quiz to database.
    """
    print(f"Received quiz save request: {request.dict()}")
    try:
        # Create quiz record
        quiz = Quiz(
            user_id=current_teacher.id,
            title=request.questions_data.get("quiz_title", f"{request.topic} Quiz"),
            topic=request.topic,
            subject=request.subject,
            grade=request.grade,
            num_questions=sum(request.question_types.values()),
            question_type=QuestionType.MIXED, # Always use MIXED for new structure
            difficulty=request.difficulty,
            questions_data=request.questions_data,
            answer_key=request.answer_key,
            generated_at=datetime.utcnow(),
            source_lesson_plan_id=request.lesson_plan_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        return {
            "id": quiz.id,
            "title": quiz.title,
            "created_at": quiz.created_at.isoformat()
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save quiz: {str(e)}")

@router.get("/{quiz_id}/export-pdf")
def export_quiz_pdf(quiz_id: int, db: Session = Depends(get_db)):
    """
    Generate and return PDF for a saved quiz.
    """
    try:
        # Fetch quiz from database
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Generate PDF
        pdf_bytes = pdf_generator.generate_pdf(quiz.questions_data)

        # Return PDF as response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=quiz-{quiz_id}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """
    Get full quiz details by ID.
    """
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        return {
            "id": quiz.id,
            "title": quiz.title,
            "topic": quiz.topic,
            "subject": quiz.subject,
            "grade": quiz.grade,
            "num_questions": quiz.num_questions,
            "question_type": quiz.question_type.value,
            "difficulty": quiz.difficulty.value,
            "questions_data": quiz.questions_data,
            "answer_key": quiz.answer_key,
            "generated_at": quiz.generated_at.isoformat() if quiz.generated_at else None,
            "created_at": quiz.created_at.isoformat() if quiz.created_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve quiz: {str(e)}")