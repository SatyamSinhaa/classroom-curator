from datetime import datetime, timedelta
import holidays
from typing import List, Dict, Any

def get_indian_holidays(year: int) -> List[str]:
    """
    Get Indian public holidays for a given year.
    """
    in_holidays = holidays.India(years=year)
    return [date.strftime('%Y-%m-%d') for date in in_holidays.keys()]

def is_valid_school_day(date: datetime, class_days: List[str], holidays_list: List[str]) -> bool:
    """
    Check if a date is a valid school day (weekday in class_days and not a holiday).
    """
    # Check if it's a weekday in class_days
    weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    day_name = weekday_names[date.weekday()]

    if day_name not in class_days:
        return False

    # Check if it's a holiday
    date_str = date.strftime('%Y-%m-%d')
    if date_str in holidays_list:
        return False

    return True

def calculate_schedule(
    start_date: str,
    end_date: str,
    daily_minutes: int,
    class_days: List[str],
    holidays_list: List[str],
    units: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calculate the schedule for units based on available school days.

    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        daily_minutes: Minutes available per school day
        class_days: List of weekdays for classes (e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"])
        holidays_list: List of holiday dates in YYYY-MM-DD format
        units: List of units with 'title', 'estimated_hours', 'color'

    Returns:
        List of units with calculated start_date, end_date, and status
    """
    current_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d')

    scheduled_units = []

    for unit in units:
        unit_title = unit['title']
        estimated_hours = unit['estimated_hours']
        color = unit.get('color', '#3174ad')

        minutes_needed = estimated_hours * 60
        unit_dates = []
        unit_start_date = None

        while minutes_needed > 0 and current_date <= end_dt:
            if is_valid_school_day(current_date, class_days, holidays_list):
                minutes_needed -= daily_minutes
                unit_dates.append(current_date.strftime('%Y-%m-%d'))

                if unit_start_date is None:
                    unit_start_date = current_date.strftime('%Y-%m-%d')

            current_date += timedelta(days=1)

        # Determine if unit fits or overspills
        if minutes_needed > 0:
            status = "overspill"
            calculated_end_date = None
        else:
            status = "scheduled"
            calculated_end_date = unit_dates[-1] if unit_dates else None

        scheduled_unit = {
            "title": unit_title,
            "estimated_hours": estimated_hours,
            "color": color,
            "calculated_start_date": unit_start_date,
            "calculated_end_date": calculated_end_date,
            "status": status,
            "dates": unit_dates
        }

        scheduled_units.append(scheduled_unit)

    return scheduled_units