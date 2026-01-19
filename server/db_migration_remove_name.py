from app.database import engine
from sqlalchemy import text
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def migrate():
    print("Starting Migration: Remove Name from Classes...")
    
    with engine.connect() as conn:
        # Disable FKs
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        
        # 1. Rename existing table
        print("Renaming classes to classes_old...")
        try:
            conn.execute(text("ALTER TABLE classes RENAME TO classes_old"))
        except Exception as e:
            print(f"Error renaming table: {e}")
            # Ensure we don't proceed if table missing or already done
            # But maybe it's partially done? Assuming linear progress.
            return

        # 2. Create new table
        # We need to manually define schema matching models.py (id, teacher_id, grade, created_at)
        print("Creating new classes table...")
        # Note: SQLite INTEGER PRIMARY KEY AUTOINCREMENT is slightly different from standard SQL, but simple INTEGER PRIMARY KEY is rowid
        create_sql = """
        CREATE TABLE classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            grade INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(teacher_id) REFERENCES teachers(id)
        );
        """
        conn.execute(text(create_sql))
        
        # 3. Copy data
        print("Copying data...")
        # We assume columns exist in old table
        copy_sql = """
        INSERT INTO classes (id, teacher_id, grade, created_at)
        SELECT id, teacher_id, grade, created_at FROM classes_old;
        """
        conn.execute(text(copy_sql))
        
        # 4. Drop old table
        print("Dropping classes_old...")
        conn.execute(text("DROP TABLE classes_old"))
        
        # Enable FKs
        conn.execute(text("PRAGMA foreign_keys=ON"))
        conn.commit()

    print("Migration complete. 'name' column removed.")

if __name__ == "__main__":
    migrate()
