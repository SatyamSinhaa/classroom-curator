from database import SessionLocal
from app.models import LessonPlan

db = SessionLocal()

try:
    # Get all lesson plans
    lesson_plans = db.query(LessonPlan).all()
    
    print(f"Total lesson plans in database: {len(lesson_plans)}")
    
    if lesson_plans:
        print("\nLesson Plans:")
        for lp in lesson_plans[:5]:  # Show first 5
            print(f"  ID: {lp.id}, User ID: {lp.user_id}, Title: {lp.title}")
            if lp.content:
                topic = lp.content.get('topic') or lp.content.get('title')
                print(f"    Topic/Title: {topic}")
    else:
        print("\nNo lesson plans found in database!")
        print("You need to create some lesson plans first before topics can be fetched.")
        
finally:
    db.close()
