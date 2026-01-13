from sqlalchemy import Column, Integer, String, JSON, DateTime, Enum, ForeignKey, Float
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from database import Base

class QuestionType(str, PyEnum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    ESSAY = "essay"

class DifficultyLevel(str, PyEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)  # FK to teachers table
    title = Column(String)  # "Gravity Quiz - Hard MCQ"
    topic = Column(String)  # "Gravity" or lesson plan ID
    subject = Column(String)  # "Physics"
    grade = Column(Integer)

    num_questions = Column(Integer)
    question_type = Column(Enum(QuestionType))
    difficulty = Column(Enum(DifficultyLevel))

    questions_data = Column(JSON)  # Array of question objects (see schema below)
    answer_key = Column(JSON)  # Array of answers

    generated_at = Column(DateTime)
    source_lesson_plan_id = Column(Integer, nullable=True)  # Link to 2.3.1

    created_at = Column(DateTime)
    updated_at = Column(DateTime)

class QuizResponse(Base):
    """Track student submissions (optional, for future grading feature)"""
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    student_id = Column(Integer)
    answers = Column(JSON)  # Student's answers
    submitted_at = Column(DateTime)
    score = Column(Float, nullable=True)