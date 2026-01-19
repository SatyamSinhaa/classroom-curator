from app.database import engine
from sqlalchemy import text
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate():
    print("Dropping 'name' column from 'classes' (MySQL)...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE classes DROP COLUMN name"))
            conn.commit()
            print("Column dropped successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
