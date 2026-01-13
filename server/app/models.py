from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from datetime import datetime
from .database import Base

# Import planning models
from models.planning import YearPlan, Term, Unit
# Import quiz models
from models.quiz import Quiz, QuizResponse, QuestionType, DifficultyLevel

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), unique=True, nullable=True)  # Link to Supabase auth user
    name = Column(String(100), nullable=False)
    subjects = Column(JSON, nullable=True)  # List of subjects taught
    classes = Column(JSON, nullable=True)  # List of class levels/grades
    board = Column(String(50), nullable=True)  # Education board (CBSE, ICSE, etc.)
    bio = Column(Text, nullable=True)  # Teacher biography
    experience_years = Column(Integer, nullable=True)  # Years of teaching experience
    qualifications = Column(JSON, nullable=True)  # Educational qualifications

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)  # FK to teachers table
    title = Column(String(255))
    content = Column(JSON)  # Store full lesson plan JSON
    source_type = Column(String(50))  # "topic" | "pdf" | "youtube"
    source_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
