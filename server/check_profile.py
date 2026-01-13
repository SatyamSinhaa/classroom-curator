#!/usr/bin/env python3

"""
Script to check what's in the teachers table.
"""

from app.database import SessionLocal, engine
from app.models import Teacher

def main():
    print("Checking teachers table...")

    # Create session
    db = SessionLocal()

    try:
        # Get all teachers
        teachers = db.query(Teacher).all()

        print(f"Found {len(teachers)} teacher(s) in database:")

        for teacher in teachers:
            print(f"\nTeacher ID: {teacher.id}")
            print(f"User ID: {teacher.user_id}")
            print(f"Name: {teacher.name}")
            print(f"Board: {teacher.board}")
            print(f"Subjects: {teacher.subjects}")
            print(f"Classes: {teacher.classes}")
            print(f"Experience: {teacher.experience_years}")
            print(f"Qualifications: {teacher.qualifications}")
            print(f"Bio: {teacher.bio}")

        # Check specifically for the user ID mentioned
        specific_user = db.query(Teacher).filter(Teacher.user_id == "08b55430-0846-4b7b-ad05-d001637acbef").first()

        if specific_user:
            print(f"\n✅ Found profile for user 08b55430-0846-4b7b-ad05-d001637acbef:")
            print(f"Name: {specific_user.name}")
            print(f"Board: {specific_user.board}")
        else:
            print(f"\n❌ No profile found for user 08b55430-0846-4b7b-ad05-d001637acbef")

    finally:
        db.close()

if __name__ == "__main__":
    main()