from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import School, Teacher

router = APIRouter(prefix="/schools", tags=["schools"])

class SchoolCreate(BaseModel):
    name: str
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

@router.get("/")
def get_all_schools(db: Session = Depends(get_db)):
    """Get all schools - no authentication required"""
    schools = db.query(School).all()
    return schools

@router.get("/{school_id}")
def get_school(school_id: int, db: Session = Depends(get_db)):
    """Get a specific school by ID"""
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.post("/")
def create_school(school_data: SchoolCreate, db: Session = Depends(get_db)):
    """Create a new school - no authentication required for testing"""
    school = School(
        name=school_data.name,
        address=school_data.address,
        contact_email=school_data.contact_email,
        contact_phone=school_data.contact_phone
    )
    db.add(school)
    db.commit()
    db.refresh(school)
    return school

@router.put("/{school_id}")
def update_school(school_id: int, school_data: SchoolUpdate, db: Session = Depends(get_db)):
    """Update a school - no authentication required for testing"""
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Update only provided fields
    if school_data.name is not None:
        school.name = school_data.name
    if school_data.address is not None:
        school.address = school_data.address
    if school_data.contact_email is not None:
        school.contact_email = school_data.contact_email
    if school_data.contact_phone is not None:
        school.contact_phone = school_data.contact_phone
    
    db.commit()
    db.refresh(school)
    return school

@router.delete("/{school_id}")
def delete_school(school_id: int, db: Session = Depends(get_db)):
    """Delete a school - no authentication required for testing"""
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Check if school has teachers
    teacher_count = db.query(Teacher).filter(Teacher.school_id == school_id).count()
    if teacher_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete school with {teacher_count} associated teachers. Remove teachers first."
        )
    
    db.delete(school)
    db.commit()
    return {"message": "School deleted successfully"}

@router.get("/{school_id}/teachers")
def get_school_teachers(school_id: int, db: Session = Depends(get_db)):
    """Get all teachers in a specific school"""
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    teachers = db.query(Teacher).filter(Teacher.school_id == school_id).all()
    return teachers
