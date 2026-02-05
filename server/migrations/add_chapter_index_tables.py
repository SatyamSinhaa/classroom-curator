"""
Database migration script to add chapter index tables.
This should be run from the server directory.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import ChapterIndex, Chapter, SubTopic, TeachingProgress

def run_migration():
    """Create chapter index tables"""
    print("Creating chapter index tables...")
    
    # Create only the new tables
    ChapterIndex.__table__.create(bind=engine, checkfirst=True)
    Chapter.__table__.create(bind=engine, checkfirst=True)
    SubTopic.__table__.create(bind=engine, checkfirst=True)
    TeachingProgress.__table__.create(bind=engine, checkfirst=True)
    
    print("✓ Chapter index tables created successfully!")

if __name__ == "__main__":
    run_migration()
