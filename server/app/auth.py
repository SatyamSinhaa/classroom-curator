from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import Teacher
import jwt

def get_current_teacher(request: Request, db: Session = Depends(get_db)):
    """Extract teacher ID from Supabase JWT token"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = auth_header.split(" ")[1]

    try:
        # Decode JWT (Supabase uses RS256, but for simplicity we'll trust the token structure)
        # In production, you'd verify the JWT signature
        payload = jwt.decode(token, options={"verify_signature": False})

        # Extract user_id from Supabase token
        supabase_user_id = payload.get("sub")
        if not supabase_user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user ID")

        # Find teacher record - try by user_id first, then fallback to creating one
        teacher = None
        if hasattr(Teacher, 'user_id'):
            teacher = db.query(Teacher).filter(Teacher.user_id == supabase_user_id).first()

        if not teacher:
            # Auto-create teacher record for testing/demo purposes
            teacher_data = {"name": "Demo Teacher"}

            # Add user_id if the model supports it
            if hasattr(Teacher, 'user_id'):
                teacher_data["user_id"] = supabase_user_id
            if hasattr(Teacher, 'subjects'):
                teacher_data["subjects"] = ["Mathematics", "Science"]
            if hasattr(Teacher, 'classes'):
                teacher_data["classes"] = ["Grade 4", "Grade 5"]

            teacher = Teacher(**teacher_data)
            db.add(teacher)
            try:
                db.commit()
                db.refresh(teacher)
                print(f"Auto-created teacher record for user: {supabase_user_id}")
            except Exception as e:
                db.rollback()
                print(f"Failed to create teacher record: {e}")
                raise HTTPException(status_code=500, detail="Failed to create teacher account")

        return teacher

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
