from app.database import engine
from sqlalchemy import text
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate():
    print("Adding 'subject' column to 'classes' (MySQL)...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE classes ADD COLUMN subject VARCHAR(100)"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
