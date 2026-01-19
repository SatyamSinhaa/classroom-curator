from app.database import engine, Base
from sqlalchemy import text, inspect
import sys
import os

# Add parent dir to path to import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import models to register them
from app.models import Class, LessonPlan, Teacher

def migrate():
    print("Starting migration...")
    inspector = inspect(engine)
    
    # 1. Create 'classes' table if not exists (create_all handles this safely)
    print("Creating tables if missing...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Add class_id to lesson_plans
    columns = [col['name'] for col in inspector.get_columns('lesson_plans')]
    if 'class_id' not in columns:
        print("Adding class_id column to lesson_plans...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE lesson_plans ADD COLUMN class_id INTEGER REFERENCES classes(id)"))
            conn.commit()
        print("Column class_id added.")
    else:
        print("Column class_id already exists in lesson_plans.")

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
