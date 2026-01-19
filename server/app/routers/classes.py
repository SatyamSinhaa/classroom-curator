from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Class, Teacher, LessonPlan
from ..auth import get_current_teacher

router = APIRouter(prefix="/classes", tags=["classes"])

class ClassBase(BaseModel):
    grade: int
    subject: Optional[str] = "General"

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    teacher_id: int
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[ClassResponse])
def get_classes(current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """Get all classes for the authenticated teacher."""
    return db.query(Class).filter(Class.teacher_id == current_teacher.id).all()

@router.post("/", response_model=ClassResponse)
def create_class(class_data: ClassCreate, current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """Create a new class for the authenticated teacher."""
    new_class = Class(
        teacher_id=current_teacher.id,
        grade=class_data.grade,
        subject=class_data.subject
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

@router.delete("/{class_id}")
def delete_class(class_id: int, current_teacher: Teacher = Depends(get_current_teacher), db: Session = Depends(get_db)):
    """Delete a class. This will cascade delete lesson plans if configured, or fail if not."""
    # Check ownership
    class_obj = db.query(Class).filter(Class.id == class_id, Class.teacher_id == current_teacher.id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(class_obj)
    db.commit()
    return {"detail": "Class deleted"}
