from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import YearPlan, Unit, Term
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from services.scheduler import calculate_schedule, get_indian_holidays

router = APIRouter(prefix="/year-plans", tags=["year-plans"])

class UnitRequest(BaseModel):
    title: str
    estimated_hours: float
    color: str = "#3174ad"

class CalculateRequest(BaseModel):
    title: str
    start_date: str
    end_date: str
    class_days: List[str]
    daily_minutes: int
    holidays: Optional[List[str]] = None
    auto_fetch_holidays: bool = True
    units: List[UnitRequest]

class YearPlanRequest(BaseModel):
    title: str
    start_date: str
    end_date: str
    class_days: List[str]
    daily_minutes: int
    holidays: Optional[List[str]] = None
    units: List[UnitRequest]

@router.post("/calculate")
def calculate_year_plan_preview(request: CalculateRequest):
    """
    Calculate year plan schedule without saving to database.
    Returns preview of scheduled units.
    """
    try:
        # Get holidays
        holidays_list = request.holidays or []
        if request.auto_fetch_holidays:
            # Extract year from start_date
            year = int(request.start_date.split('-')[0])
            indian_holidays = get_indian_holidays(year)
            holidays_list.extend(indian_holidays)

        # Calculate schedule
        scheduled_units = calculate_schedule(
            start_date=request.start_date,
            end_date=request.end_date,
            daily_minutes=request.daily_minutes,
            class_days=request.class_days,
            holidays_list=holidays_list,
            units=[unit.dict() for unit in request.units]
        )

        # Calculate stats
        total_school_days = sum(len(unit['dates']) for unit in scheduled_units if unit['status'] == 'scheduled')
        total_instructional_hours = total_school_days * request.daily_minutes / 60
        total_planned_hours = sum(unit.estimated_hours for unit in request.units)
        unused_hours = total_instructional_hours - total_planned_hours

        return {
            "title": request.title,
            "scheduled_units": scheduled_units,
            "stats": {
                "total_school_days": total_school_days,
                "total_instructional_hours": total_instructional_hours,
                "total_planned_hours": total_planned_hours,
                "unused_hours": max(0, unused_hours)  # Don't show negative
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate schedule: {str(e)}")

@router.post("/")
def create_year_plan(request: YearPlanRequest, db: Session = Depends(get_db)):
    """
    Create and save a complete year plan with units.
    """
    try:
        # First calculate the schedule
        calculate_request = CalculateRequest(**request.dict())
        preview = calculate_year_plan_preview(calculate_request)

        # Save YearPlan
        year_plan = YearPlan(
            user_id=None,  # TODO: Add authentication
            title=request.title,
            start_date=request.start_date,
            end_date=request.end_date,
            class_days=request.class_days,
            daily_minutes=request.daily_minutes,
            non_teaching_dates=request.holidays
        )
        db.add(year_plan)
        db.commit()
        db.refresh(year_plan)

        # Save Units
        for i, (unit_req, scheduled_unit) in enumerate(zip(request.units, preview["scheduled_units"])):
            unit = Unit(
                year_plan_id=year_plan.id,
                title=unit_req.title,
                estimated_hours=unit_req.estimated_hours,
                order_index=i,
                color=unit_req.color,
                calculated_start_date=scheduled_unit.get("calculated_start_date"),
                calculated_end_date=scheduled_unit.get("calculated_end_date")
            )
            db.add(unit)

        db.commit()

        return {
            "id": year_plan.id,
            "message": "Year plan created successfully",
            **preview
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create year plan: {str(e)}")

@router.get("/{year_plan_id}")
def get_year_plan(year_plan_id: int, db: Session = Depends(get_db)):
    """
    Get a year plan with all its units.
    """
    year_plan = db.query(YearPlan).filter(YearPlan.id == year_plan_id).first()
    if not year_plan:
        raise HTTPException(status_code=404, detail="Year plan not found")

    units = db.query(Unit).filter(Unit.year_plan_id == year_plan_id).order_by(Unit.order_index).all()

    return {
        "id": year_plan.id,
        "title": year_plan.title,
        "start_date": year_plan.start_date.isoformat(),
        "end_date": year_plan.end_date.isoformat(),
        "class_days": year_plan.class_days,
        "daily_minutes": year_plan.daily_minutes,
        "holidays": year_plan.non_teaching_dates,
        "units": [
            {
                "id": unit.id,
                "title": unit.title,
                "estimated_hours": unit.estimated_hours,
                "order_index": unit.order_index,
                "color": unit.color,
                "calculated_start_date": unit.calculated_start_date.isoformat() if unit.calculated_start_date else None,
                "calculated_end_date": unit.calculated_end_date.isoformat() if unit.calculated_end_date else None,
            }
            for unit in units
        ]
    }