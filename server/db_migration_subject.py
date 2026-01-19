from app.database import engine, Base, SessionLocal
from app.models import LessonPlan
from sqlalchemy import text, inspect
import sys
import os
import json

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate():
    print("Starting Subject Migration...")
    inspector = inspect(engine)
    
    # 1. Add subject column to lesson_plans if not exists
    columns = [col['name'] for col in inspector.get_columns('lesson_plans')]
    if 'subject' not in columns:
        print("Adding subject column to lesson_plans...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE lesson_plans ADD COLUMN subject VARCHAR(100)"))
            conn.commit()
        print("Column subject added.")
    else:
        print("Column subject already exists.")

    # 2. Backfill subject from content JSON
    print("Backfilling subject data...")
    db = SessionLocal()
    try:
        lesson_plans = db.query(LessonPlan).all()
        count = 0
        for lp in lesson_plans:
            if lp.content:
                try:
                    content = lp.content
                    if isinstance(content, str):
                        content = json.loads(content)
                    
                    if isinstance(content, dict):
                        subj = content.get("subject")
                        if subj and not lp.subject:
                            lp.subject = subj
                            count += 1
                except Exception as e:
                    print(f"Error processing LP {lp.id}: {e}")
        
        db.commit()
        print(f"Backfilled subject for {count} lesson plans.")
    except Exception as e:
        print(f"Backfill failed: {e}")
    finally:
        db.close()

    # Note: We are NOT dropping column from classes table to avoid SQLite complexity.
    # It will just be ignored by the application code.

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
