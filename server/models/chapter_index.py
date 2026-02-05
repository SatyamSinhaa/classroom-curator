from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class ChapterIndex(Base):
    """Stores the master chapter index for a subject/grade/board combination"""
    __tablename__ = "chapter_indexes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subject = Column(String(100), nullable=False)
    grade = Column(Integer, nullable=False)
    board = Column(String(50), nullable=False)  # CBSE, ICSE, State Board, etc.
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapters = relationship("Chapter", back_populates="index", cascade="all, delete-orphan")
    
    # Unique constraint: one index per subject/grade/board
    __table_args__ = (UniqueConstraint('subject', 'grade', 'board', name='_subject_grade_board_uc'),)


class Chapter(Base):
    """Individual chapters within a chapter index"""
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    index_id = Column(Integer, ForeignKey("chapter_indexes.id"), nullable=False)
    chapter_number = Column(Integer, nullable=False)
    chapter_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    index = relationship("ChapterIndex", back_populates="chapters")
    subtopics = relationship("SubTopic", back_populates="chapter", cascade="all, delete-orphan")
    teaching_records = relationship("TeachingProgress", back_populates="chapter")


class SubTopic(Base):
    """Subtopics within each chapter"""
    __tablename__ = "subtopics"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    subtopic_number = Column(Integer, nullable=False)
    subtopic_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    chapter = relationship("Chapter", back_populates="subtopics")


class TeachingProgress(Base):
    """Tracks what each teacher has taught"""
    __tablename__ = "teaching_progress"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)  # Which section
    subtopic_ids = Column(JSON, nullable=False)  # List of subtopic IDs taught
    lesson_plan_id = Column(Integer, ForeignKey("lesson_plans.id"), nullable=True)
    taught_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher")
    chapter = relationship("Chapter", back_populates="teaching_records")
    class_ = relationship("Class")
    lesson_plan = relationship("LessonPlan")
