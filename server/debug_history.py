import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
from app.models import LessonPlan

# Ensure we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__)))

db = SessionLocal()

try:
    # Get all lesson plans
    lesson_plans = db.query(LessonPlan).all()
    
    with open("debug_output.txt", "w") as f:
        f.write(f"Total lesson plans: {len(lesson_plans)}\n")
        f.write(f"{'ID':<5} {'Title':<30} {'Source Type':<15} {'Class ID':<10} {'User ID':<10}\n")
        f.write("-" * 80 + "\n")
        
        for lp in lesson_plans:
            title = lp.title[:28] + ".." if len(lp.title) > 28 else lp.title
            f.write(f"{lp.id:<5} {title:<30} {lp.source_type:<15} {str(lp.class_id):<10} {lp.user_id:<10}\n")
            
    print("Done writing to debug_output.txt")
        
finally:
    db.close()
