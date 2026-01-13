from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Float, ForeignKey, Date
from datetime import datetime
from database import Base

class YearPlan(Base):
    __tablename__ = "year_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), nullable=True)  # Link to Supabase auth user
    title = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    class_days = Column(JSON, nullable=False)  # List of weekdays e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"]
    daily_minutes = Column(Integer, nullable=False)  # Minutes per class day
    non_teaching_dates = Column(JSON, nullable=True)  # List of specific holiday dates

class Term(Base):
    __tablename__ = "terms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year_plan_id = Column(Integer, ForeignKey("year_plans.id"), nullable=False)
    title = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year_plan_id = Column(Integer, ForeignKey("year_plans.id"), nullable=True)
    term_id = Column(Integer, ForeignKey("terms.id"), nullable=True)
    title = Column(String(255), nullable=False)
    estimated_hours = Column(Float, nullable=False)
    order_index = Column(Integer, nullable=False)
    color = Column(String(7), nullable=False)  # Hex color code
    calculated_start_date = Column(Date, nullable=True)
    calculated_end_date = Column(Date, nullable=True)