#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

from services.scheduler import calculate_schedule

def test_scheduler_weekend_skipping():
    """
    Test that scheduler correctly skips weekends and holidays.
    Test case: 2 units of 10 hours each, 1 hour/day (60 minutes), starting Monday.
    Should schedule first unit over 10 days (Mon-Fri x 2 weeks), second over next 10 days.
    """
    start_date = "2025-08-04"  # Monday
    end_date = "2025-09-30"    # Far enough out
    daily_minutes = 60  # 1 hour per day
    class_days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    holidays_list = []  # No holidays for this test

    units = [
        {"title": "Unit 1", "estimated_hours": 10.0, "color": "#ff0000"},
        {"title": "Unit 2", "estimated_hours": 10.0, "color": "#00ff00"}
    ]

    result = calculate_schedule(start_date, end_date, daily_minutes, class_days, holidays_list, units)

    # Verify results
    assert len(result) == 2, f"Expected 2 units, got {len(result)}"

    unit1 = result[0]
    unit2 = result[1]

    # Unit 1 should take 10 school days
    assert unit1["status"] == "scheduled", f"Unit 1 status: {unit1['status']}"
    assert unit1["calculated_start_date"] == "2025-08-04", f"Unit 1 start: {unit1['calculated_start_date']}"
    assert unit1["calculated_end_date"] == "2025-08-15", f"Unit 1 end: {unit1['calculated_end_date']}"  # Mon 8/4 to Fri 8/15 = 10 days
    assert len(unit1["dates"]) == 10, f"Unit 1 should have 10 dates, got {len(unit1['dates'])}"

    # Unit 2 should start the next Monday (8/18) and end Friday 8/29
    assert unit2["status"] == "scheduled", f"Unit 2 status: {unit2['status']}"
    assert unit2["calculated_start_date"] == "2025-08-18", f"Unit 2 start: {unit2['calculated_start_date']}"
    assert unit2["calculated_end_date"] == "2025-08-29", f"Unit 2 end: {unit2['calculated_end_date']}"
    assert len(unit2["dates"]) == 10, f"Unit 2 should have 10 dates, got {len(unit2['dates'])}"

    # Verify no weekend dates are included
    all_dates = unit1["dates"] + unit2["dates"]
    for date_str in all_dates:
        from datetime import datetime
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        weekday = dt.weekday()  # 0=Monday, 6=Sunday
        assert weekday < 5, f"Date {date_str} is a weekend (weekday {weekday})"

    print("✅ Scheduler test passed: Correctly schedules units skipping weekends")

def test_scheduler_with_holidays():
    """
    Test scheduler with holidays - should skip those days too.
    """
    start_date = "2025-08-04"  # Monday
    end_date = "2025-09-30"
    daily_minutes = 60
    class_days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    holidays_list = ["2025-08-15"]  # Friday holiday

    units = [
        {"title": "Unit 1", "estimated_hours": 10.0, "color": "#ff0000"}
    ]

    result = calculate_schedule(start_date, end_date, daily_minutes, class_days, holidays_list, units)

    unit1 = result[0]
    # With 8/15 as holiday, should need 11 days total (10 school days + 1 holiday)
    assert unit1["calculated_end_date"] == "2025-08-18", f"Unit 1 end with holiday: {unit1['calculated_end_date']}"
    assert "2025-08-15" not in unit1["dates"], "Holiday date should not be in scheduled dates"

    print("✅ Holiday test passed: Correctly skips holiday dates")

if __name__ == "__main__":
    test_scheduler_weekend_skipping()
    test_scheduler_with_holidays()
    print("🎉 All scheduler tests passed!")