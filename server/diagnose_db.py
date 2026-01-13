from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_db():
    db = SessionLocal()
    try:
        print("--- Teachers ---")
        teachers_result = db.execute(text("SELECT id, user_id, name FROM teachers"))
        teachers = teachers_result.fetchall()
        for t in teachers:
            print(f"ID: {t[0]}, UserID (Supabase): {t[1]}, Name: {t[2]}")
        
        print("\n--- Lesson Plans per Teacher ---")
        lp_result = db.execute(text("SELECT id, user_id, title, source_type, created_at FROM lesson_plans ORDER BY created_at DESC"))
        for lp in lp_result.fetchall():
            print(f"ID: {lp[0]}, Teacher FK ID: {lp[1]}, Title: {lp[2]}, Source: {lp[3]}, Created: {lp[4]}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
