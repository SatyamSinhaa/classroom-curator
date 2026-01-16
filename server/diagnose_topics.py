import requests
import json

# Test the topics endpoint with a mock teacher
url = "http://localhost:8000/lesson-plans/topics"

print("Testing /lesson-plans/topics endpoint...")
print("=" * 50)

# Test without auth (should fail with 401)
print("\n1. Testing WITHOUT authentication:")
try:
    response = requests.get(url)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {str(e)}")

# Check if there are any lesson plans in the database at all
print("\n2. Checking database for lesson plans:")
try:
    from database import SessionLocal
    from app.models import LessonPlan
    
    db = SessionLocal()
    
    # Get total count
    total_count = db.query(LessonPlan).count()
    print(f"   Total lesson plans in database: {total_count}")
    
    if total_count > 0:
        # Get first few
        plans = db.query(LessonPlan).limit(5).all()
        print(f"\n   Sample lesson plans:")
        for plan in plans:
            topic = None
            if plan.content:
                if isinstance(plan.content, dict):
                    topic = plan.content.get('topic') or plan.content.get('title')
                elif isinstance(plan.content, str):
                    try:
                        content_dict = json.loads(plan.content)
                        topic = content_dict.get('topic') or content_dict.get('title')
                    except:
                        pass
            print(f"     - ID: {plan.id}, User: {plan.user_id}, Topic: {topic}")
    else:
        print("\n   ⚠️  NO LESSON PLANS FOUND!")
        print("   You need to create lesson plans first in the Lesson Planner page.")
    
    db.close()
    
except Exception as e:
    print(f"   Error checking database: {str(e)}")

print("\n" + "=" * 50)
print("\nNOTE: The endpoint requires authentication.")
print("The frontend should be sending an Authorization header with a Bearer token.")
print("Check the browser console for any 401 errors.")
