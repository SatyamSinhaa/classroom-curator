import sys
import os
import json
sys.path.append(os.getcwd())

from database import SessionLocal
from app.models import LessonPlan

# Ensure we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__)))

db = SessionLocal()

try:
    # Get all lesson plans
    lesson_plans = db.query(LessonPlan).all()
    
    with open("debug_content.txt", "w") as f:
        f.write(f"Total lesson plans: {len(lesson_plans)}\n")
        f.write(f"{'ID':<5} {'Title':<30} {'Source Type':<15} {'Content Keys'}\n")
        f.write("-" * 80 + "\n")
        
        for lp in lesson_plans:
            title = lp.title[:28] + ".." if len(lp.title) > 28 else lp.title
            content = lp.content
            
            # Check for chapterId in content
            chapter_id = "N/A"
            if isinstance(content, dict):
                chapter_id = content.get('chapterId', 'Missing')
            elif isinstance(content, str):
                try:
                    c_dict = json.loads(content)
                    chapter_id = c_dict.get('chapterId', 'Missing')
                except:
                    chapter_id = "JSON Error"
                    
            f.write(f"{lp.id:<5} {title:<30} {lp.source_type:<15} chapterId={chapter_id}\n")
            
    print("Done writing to debug_content.txt")
        
finally:
    db.close()
