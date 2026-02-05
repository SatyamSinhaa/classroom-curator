from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Import planning models
from models.planning import YearPlan, Term, Unit
# Import quiz models
from models.quiz import Quiz, QuizResponse, QuestionType, DifficultyLevel
# Import chapter index models
from models.chapter_index import ChapterIndex, Chapter, SubTopic, TeachingProgress

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to teachers
    teachers = relationship("Teacher", back_populates="school")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), unique=True, nullable=True)  # Link to Supabase auth user
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)  # Link to school
    name = Column(String(100), nullable=False)
    subjects = Column(JSON, nullable=True)  # List of subjects taught
    classes = Column(JSON, nullable=True)  # Legacy: List of class levels/grades
    board = Column(String(50), nullable=True)  # Education board (CBSE, ICSE, etc.)
    bio = Column(Text, nullable=True)  # Teacher biography
    experience_years = Column(Integer, nullable=True)  # Years of teaching experience
    qualifications = Column(JSON, nullable=True)  # Educational qualifications

    # Relationships
    school = relationship("School", back_populates="teachers")
    class_list = relationship("Class", back_populates="teacher", cascade="all, delete-orphan")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    grade = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=True) # e.g. "Science"
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="class_list")
    lesson_plans = relationship("LessonPlan", back_populates="class_")

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)  # FK to teachers table
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True) # New FK to classes table
    title = Column(String(255))
    # subject removed, now in Class
    content = Column(JSON)  # Store full lesson plan JSON
    source_type = Column(String(50))  # "topic" | "pdf" | "youtube"
    source_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    class_ = relationship("Class", back_populates="lesson_plans")
