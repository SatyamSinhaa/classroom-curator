#!/usr/bin/env python3

"""
Script to drop and recreate the teachers table with the new schema.
Run this once to update the database schema.
"""

from app.database import engine, Base
from app.models import Teacher

def main():
    print("Dropping teachers table...")
    # Drop the table if it exists
    Teacher.__table__.drop(engine, checkfirst=True)
    print("✅ Table dropped successfully")

    print("Recreating teachers table with new schema...")
    # Recreate all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Table recreated with new schema")

    print("\nNew table schema includes:")
    print("- id (primary key)")
    print("- user_id (links to Supabase auth)")
    print("- name (teacher name)")
    print("- subjects (JSON array of subjects taught)")
    print("- classes (JSON array of classes taught)")
    print("- board (education board: CBSE, ICSE, etc.)")
    print("- bio (teacher biography)")
    print("- experience_years (years of experience)")
    print("- qualifications (JSON array of qualifications)")

if __name__ == "__main__":
    main()