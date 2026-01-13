from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import teachers, lesson_plans, year_plans, quizzes
# Import models to ensure they're registered with Base
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.quiz import Quiz, QuizResponse, QuestionType, DifficultyLevel
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Classroom Curator API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teachers.router)
app.include_router(lesson_plans.router)
app.include_router(year_plans.router)
app.include_router(quizzes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Classroom Curator API"}
