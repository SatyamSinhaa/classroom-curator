from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Teacher, Class, LessonPlan
import re

router = APIRouter(prefix="/teachers", tags=["teachers"])

class TeacherProfileUpdate(BaseModel):
    user_id: str
    name: Optional[str] = None
    subjects: Optional[List[str]] = None
    classes: Optional[List[str]] = None
    board: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[str] = None  # Keep as string from frontend
    qualifications: Optional[List[str]] = None

@router.get("/")
def read_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers

@router.post("/")
def create_teacher(name: str, db: Session = Depends(get_db)):
    teacher = Teacher(name=name)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@router.get("/profile/{user_id}")
def get_teacher_profile(user_id: str, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    return teacher

@router.post("/profile")
def create_or_update_teacher_profile(
    profile_data: TeacherProfileUpdate,
    db: Session = Depends(get_db)
):
    # Helper to sync profile classes to Class table
    def sync_profile_classes(db: Session, teacher: Teacher, class_names: List[str]):
        if class_names is None:
            return
        
        # Parse incoming names into a list of (grade, subject)
        new_class_data = []
        for name in class_names:
            # Pattern to match "Grade 5 Science" or "5 Science"
            # It looks for "Grade " (optional) followed by digits at the start.
            match = re.match(r'^(?:Grade\s*)?(\d+)\s*(.*)$', name, re.IGNORECASE)
            if match:
                grade = int(match.group(1))
                subject = match.group(2).strip()
                if not subject:
                    subject = "General"
                new_class_data.append((grade, subject))
            else:
                # Fallback: find first number as grade
                grade_match = re.search(r'\d+', name)
                if grade_match:
                    grade = int(grade_match.group())
                    subject = re.sub(r'\d+', '', name).replace("Grade", "").replace("class", "").strip()
                    if not subject:
                        subject = "General"
                    new_class_data.append((grade, subject))
        
        # Convert to set for easy comparison
        new_keys = set(new_class_data)
        
        # Get existing classes
        existing_classes = db.query(Class).filter(Class.teacher_id == teacher.id).all()
        
        # 1. Identify and remove stale classes
        for cls in existing_classes:
            if (cls.grade, cls.subject) not in new_keys:
                # Set class_id to NULL in associated lesson plans to avoid orphans
                db.query(LessonPlan).filter(LessonPlan.class_id == cls.id).update({"class_id": None})
                db.delete(cls)
        
        # Flush deletions before adding/checking existing to avoid conflicts
        db.flush()
        
        # Refresh existing keys after deletion
        existing_remaining = db.query(Class).filter(Class.teacher_id == teacher.id).all()
        existing_keys = {(c.grade, c.subject) for c in existing_remaining}
        
        # 2. Add new classes
        for grade, subject in new_keys:
            if (grade, subject) not in existing_keys:
                new_class = Class(
                    teacher_id=teacher.id,
                    grade=grade,
                    subject=subject
                )
                db.add(new_class)

    # Clean up the data
    def clean_list(data):
        if data is None:
            return None
        # Filter out empty strings and None values
        return [item for item in data if item and str(item).strip()]

    # Convert experience_years to int if provided
    exp_years = None
    if profile_data.experience_years:
        try:
            exp_years = int(profile_data.experience_years)
        except (ValueError, TypeError):
            exp_years = None

    # Check if teacher profile already exists
    teacher = db.query(Teacher).filter(Teacher.user_id == profile_data.user_id).first()

    if teacher:
        # Update existing profile - only update provided fields
        if profile_data.name is not None:
            teacher.name = profile_data.name
        if profile_data.subjects is not None:
            teacher.subjects = clean_list(profile_data.subjects)
        if profile_data.classes is not None:
            teacher.classes = clean_list(profile_data.classes)
            sync_profile_classes(db, teacher, teacher.classes)
        if profile_data.board is not None:
            teacher.board = profile_data.board
        if profile_data.bio is not None:
            teacher.bio = profile_data.bio
        if exp_years is not None:
            teacher.experience_years = exp_years
        if profile_data.qualifications is not None:
            teacher.qualifications = clean_list(profile_data.qualifications)
    else:
        # Create new profile with provided data
        teacher = Teacher(
            user_id=profile_data.user_id,
            name=profile_data.name or "Unknown",
            subjects=clean_list(profile_data.subjects),
            classes=clean_list(profile_data.classes),
            board=profile_data.board,
            bio=profile_data.bio,
            experience_years=exp_years,
            qualifications=clean_list(profile_data.qualifications)
        )
        db.add(teacher)
        db.flush() # Ensure ID is generated
        if profile_data.classes:
            sync_profile_classes(db, teacher, clean_list(profile_data.classes))

    db.commit()
    db.refresh(teacher)
    return teacher
