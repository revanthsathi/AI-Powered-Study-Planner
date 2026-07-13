import datetime
from typing import List
from sqlalchemy.orm import Session
from app import models

def populate_study_plan_tasks(db: Session, user_id: int, start_date: datetime.date, plan_data: dict):
    """
    Takes the weekly timetable structure from AI and populates the daily_tasks table.
    We map days (Monday, Tuesday, etc.) relative to the start_date.
    """
    days_mapping = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6
    }
    
    # Clean up existing future tasks to prevent duplicates
    db.query(models.DailyTask).filter(
        models.DailyTask.user_id == user_id,
        models.DailyTask.date >= start_date,
        models.DailyTask.status == "pending"
    ).delete()
    
    weekly_timetable = plan_data.get("weekly_timetable", [])
    
    # We populate tasks for 2 weeks (repeating the weekly schedule template)
    created_tasks = []
    for week_offset in range(2):
        for day_plan in weekly_timetable:
            day_name = day_plan.get("day", "").lower()
            if day_name not in days_mapping:
                continue
            
            day_offset = days_mapping[day_name] + (week_offset * 7)
            task_date = start_date + datetime.timedelta(days=day_offset)
            
            for task_info in day_plan.get("tasks", []):
                new_task = models.DailyTask(
                    user_id=user_id,
                    subject=task_info.get("subject", "General"),
                    title=task_info.get("title", "Study Session"),
                    date=task_date,
                    start_time=task_info.get("start_time", "09:00"),
                    duration=task_info.get("duration", 1.0),
                    status="pending"
                )
                db.add(new_task)
                created_tasks.append(new_task)
                
    db.commit()
    return len(created_tasks)


def reschedule_missed_tasks(db: Session, user_id: int) -> int:
    """
    Finds all tasks where status is 'pending' and the date is before today,
    marks them as 'missed', and schedules them to future dates (starting today).
    
    Rules:
    - Target days: Starting from today onwards.
    - Check daily hours: Do not exceed the user's `daily_available_hours` limit.
    - Priority: Put weak subjects first.
    """
    today = datetime.date.today()
    
    # Get user profile to check daily available hours and weak subjects
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    max_daily_hours = profile.daily_available_hours if profile else 4.0
    weak_subjects = profile.weak_subjects if (profile and profile.weak_subjects) else []
    
    # 1. Fetch all pending tasks before today
    missed_tasks = db.query(models.DailyTask).filter(
        models.DailyTask.user_id == user_id,
        models.DailyTask.date < today,
        models.DailyTask.status == "pending"
    ).all()
    
    if not missed_tasks:
        return 0
        
    # Mark them as missed in database first
    for task in missed_tasks:
        task.status = "missed"
    db.commit()
    
    # We will create new copies of these missed tasks in future slots
    # Sort missed tasks so that weak subjects are scheduled first
    def get_priority(task):
        # Return 0 for weak subjects (highest priority), 1 for others
        return 0 if task.subject in weak_subjects else 1
        
    sorted_missed = sorted(missed_tasks, key=get_priority)
    
    rescheduled_count = 0
    current_target_date = today
    
    # Keep track of hours allocated for future dates to respect daily bounds
    # Load existing pending tasks scheduled for future dates
    future_tasks = db.query(models.DailyTask).filter(
        models.DailyTask.user_id == user_id,
        models.DailyTask.date >= today,
        models.DailyTask.status == "pending"
    ).all()
    
    daily_allocated = {}
    for task in future_tasks:
        daily_allocated[task.date] = daily_allocated.get(task.date, 0.0) + task.duration
        
    for task in sorted_missed:
        allocated = False
        attempts = 0
        # Try to find a date in the next 30 days that has capacity
        while not allocated and attempts < 30:
            date_load = daily_allocated.get(current_target_date, 0.0)
            if date_load + task.duration <= max_daily_hours:
                # We can schedule it here!
                new_task = models.DailyTask(
                    user_id=user_id,
                    subject=task.subject,
                    title=f"[Rescheduled] {task.title}",
                    date=current_target_date,
                    start_time="11:00", # default slot for rescheduled tasks
                    duration=task.duration,
                    status="pending"
                )
                db.add(new_task)
                daily_allocated[current_target_date] = date_load + task.duration
                allocated = True
                rescheduled_count += 1
            else:
                # Increment date
                current_target_date += datetime.timedelta(days=1)
                attempts += 1
                
    db.commit()
    
    # Send a notification to the user
    new_notif = models.Notification(
        user_id=user_id,
        message=f"Smart Rescheduler: {rescheduled_count} missed tasks have been automatically redistributed to your future study slots.",
        read=False,
        scheduled_at=datetime.datetime.utcnow(),
        type="alert"
    )
    db.add(new_notif)
    db.commit()
    
    return rescheduled_count
