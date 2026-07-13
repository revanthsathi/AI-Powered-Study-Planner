import datetime
import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
import base64

from app.database import engine, Base, get_db
from app.config import settings
from app import models, schemas, auth, ai, scheduler

# Create tables
Base.metadata.create_all(bind=engine)

logger = logging.getLogger("app.main")
app = FastAPI(title="AI-Powered Study Planner API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize empty profile
    profile = models.Profile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# --- ONBOARDING / PROFILE ---

@app.post("/api/profile/setup", status_code=status.HTTP_200_OK)
def setup_profile(
    data: schemas.OnboardingRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)
    
    # Update profile fields
    profile.college = data.profile.college
    profile.branch = data.profile.branch
    profile.semester = data.profile.semester
    profile.target_goal = data.profile.target_goal
    profile.preferred_study_time = data.profile.preferred_study_time
    profile.daily_available_hours = data.profile.daily_available_hours
    profile.weak_subjects = data.profile.weak_subjects
    profile.strong_subjects = data.profile.strong_subjects
    
    # Clear and insert subjects
    db.query(models.Subject).filter(models.Subject.user_id == current_user.id).delete()
    for sub in data.subjects:
        # Default target completion: 3 months from now
        target_date = datetime.date.today() + datetime.timedelta(days=90)
        new_sub = models.Subject(
            user_id=current_user.id,
            name=sub.name,
            difficulty=sub.difficulty,
            target_completion_date=target_date
        )
        db.add(new_sub)
        
    # Create an initial progress log entry
    today = datetime.date.today()
    log = db.query(models.ProgressLog).filter(
        models.ProgressLog.user_id == current_user.id,
        models.ProgressLog.date == today
    ).first()
    if not log:
        new_log = models.ProgressLog(
            user_id=current_user.id,
            date=today,
            hours_studied=0.0,
            productivity_score=0,
            focus_streak=0
        )
        db.add(new_log)

    db.commit()
    return {"message": "Profile and subjects onboarded successfully"}

@app.get("/api/profile", response_model=schemas.ProfileResponse)
def get_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.get("/api/profile/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()


# --- STUDY PLAN & DAILY TASKS ---

@app.post("/api/planner/generate", status_code=status.HTTP_200_OK)
def generate_plan(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    
    if not subjects:
        raise HTTPException(status_code=400, detail="Please set up subjects before generating a study plan")
        
    subjects_list = [{"name": s.name, "difficulty": s.difficulty} for s in subjects]
    
    # Generate study plan using AI service
    raw_plan = ai.generate_study_plan(
        subjects=subjects_list,
        target_goal=profile.target_goal or "General",
        daily_hours=profile.daily_available_hours,
        weak_subjects=profile.weak_subjects or [],
        strong_subjects=profile.strong_subjects or []
    )
    
    # Save the study plan meta
    start_date = datetime.date.today()
    end_date = start_date + datetime.timedelta(days=14) # Default 2 weeks plan
    
    db_plan = models.StudyPlan(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        difficulty="Mixed",
        daily_hours=profile.daily_available_hours,
        plan_metadata=raw_plan
    )
    db.add(db_plan)
    db.commit()
    
    # Populate the daily_tasks table
    tasks_count = scheduler.populate_study_plan_tasks(db, current_user.id, start_date, raw_plan)
    
    return {
        "message": f"Successfully generated study plan with {tasks_count} tasks for the next 2 weeks.",
        "plan": raw_plan
    }

@app.get("/api/planner/tasks", response_model=List[schemas.DailyTaskResponse])
def get_tasks(
    start: Optional[datetime.date] = None,
    end: Optional[datetime.date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.DailyTask).filter(models.DailyTask.user_id == current_user.id)
    if start:
        query = query.filter(models.DailyTask.date >= start)
    if end:
        query = query.filter(models.DailyTask.date <= end)
    return query.order_by(models.DailyTask.date.asc(), models.DailyTask.start_time.asc()).all()

@app.put("/api/planner/tasks/{task_id}", response_model=schemas.DailyTaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.DailyTaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.DailyTask).filter(
        models.DailyTask.id == task_id,
        models.DailyTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    old_status = task.status
    
    if task_update.status is not None:
        task.status = task_update.status
        if task_update.status == "completed" and old_status != "completed":
            task.completed_at = datetime.datetime.utcnow()
            
            # Log progress
            today = datetime.date.today()
            log = db.query(models.ProgressLog).filter(
                models.ProgressLog.user_id == current_user.id,
                models.ProgressLog.date == today
            ).first()
            if not log:
                log = models.ProgressLog(
                    user_id=current_user.id,
                    date=today,
                    hours_studied=0.0,
                    productivity_score=70,  # Base productivity score
                    focus_streak=1
                )
                db.add(log)
            
            log.hours_studied += task.duration
            log.productivity_score = min(100, log.productivity_score + 5)
            db.commit()
            
        elif task_update.status != "completed" and old_status == "completed":
            task.completed_at = None
            # Deduct hours from progress log
            today = datetime.date.today()
            log = db.query(models.ProgressLog).filter(
                models.ProgressLog.user_id == current_user.id,
                models.ProgressLog.date == today
            ).first()
            if log:
                log.hours_studied = max(0.0, log.hours_studied - task.duration)
                log.productivity_score = max(0, log.productivity_score - 5)
                db.commit()
                
    if task_update.date is not None:
        task.date = task_update.date
    if task_update.start_time is not None:
        task.start_time = task_update.start_time
        
    db.commit()
    db.refresh(task)
    return task

@app.post("/api/planner/reschedule", status_code=status.HTTP_200_OK)
def trigger_reschedule(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    rescheduled_count = scheduler.reschedule_missed_tasks(db, current_user.id)
    return {"message": f"Successfully rescheduled {rescheduled_count} missed tasks."}


# --- AI CHAT ASSISTANT ---

@app.post("/api/assistant/chat", response_model=schemas.ChatHistoryResponse)
def chat_with_assistant(
    chat_in: schemas.ChatHistoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch recent chat history (last 10 messages)
    history = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.id
    ).order_by(models.ChatHistory.timestamp.desc()).limit(10).all()
    
    # Reverse to keep chronological order
    formatted_history = []
    for msg in reversed(history):
        formatted_history.append({"role": msg.role, "message": msg.message})
        
    # Get response from AI
    ai_response = ai.get_chat_response(formatted_history, chat_in.message, chat_in.image)
    
    # Save User message
    user_msg = models.ChatHistory(
        user_id=current_user.id,
        role="user",
        message=chat_in.message
    )
    db.add(user_msg)
    
    # Save Assistant message
    assistant_msg = models.ChatHistory(
        user_id=current_user.id,
        role="assistant",
        message=ai_response
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    
    return assistant_msg

@app.get("/api/assistant/test_api")
def test_gemini_api():
    import os
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)
        
    api_key = os.environ.get("GEMINI_API_KEY")
    
    status_info = {
        "env_path": env_path,
        "env_exists": os.path.exists(env_path),
        "api_key_loaded": api_key[:8] + "..." if api_key else None,
        "api_key_length": len(api_key) if api_key else 0,
        "has_gemini_sdk_var": ai.HAS_GEMINI_SDK,
    }
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents="Test connection"
        )
        status_info["connection_test"] = "Success"
        status_info["response_text"] = response.text
    except Exception as e:
        status_info["connection_test"] = "Failed"
        status_info["error"] = str(e)
        
    return status_info

@app.get("/api/assistant/history", response_model=List[schemas.ChatHistoryResponse])
def get_chat_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.id
    ).order_by(models.ChatHistory.timestamp.asc()).all()


# --- AI NOTES GENERATOR ---

@app.post("/api/notes/generate", response_model=schemas.NoteResponse)
def create_ai_notes(
    note_in: schemas.NoteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    raw_text = note_in.text_content
    # If file content uploaded as base64, decode it
    if note_in.file_content:
        try:
            # Decode file (assuming text or simple pdf text payload)
            decoded = base64.b64decode(note_in.file_content).decode("utf-8", errors="ignore")
            raw_text = (raw_text or "") + "\n" + decoded
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 encoding for file attachment")
            
    if not note_in.topic and not raw_text:
        raise HTTPException(status_code=400, detail="Topic or Text Content is required")
        
    # Generate notes using Gemini service
    notes_data = ai.generate_notes(note_in.topic or "Extracted Summary", raw_text)
    
    new_note = models.Note(
        user_id=current_user.id,
        topic=note_in.topic or "AI Generated Study Guide",
        content=notes_data.get("content", ""),
        bullet_summaries=notes_data.get("bullet_summaries", []),
        flashcards=notes_data.get("flashcards", []),
        key_formulas=notes_data.get("key_formulas", []),
        revision_sheet=notes_data.get("revision_sheet", "")
    )
    
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return new_note

@app.get("/api/notes", response_model=List[schemas.NoteResponse])
def list_notes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Note).filter(models.Note.user_id == current_user.id).order_by(models.Note.created_at.desc()).all()

@app.get("/api/notes/{note_id}", response_model=schemas.NoteResponse)
def get_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.get("/api/notes/{note_id}/download", response_class=PlainTextResponse)
def download_note(
    note_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(models.Note).filter(models.Note.id == note_id, models.Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    markdown_output = f"""# Study Notes: {note.topic}
Created: {note.created_at.strftime('%Y-%m-%d')}

## Core Contents
{note.content}

## Key Bullet Points
"""
    for bullet in (note.bullet_summaries or []):
        markdown_output += f"- {bullet}\n"
        
    markdown_output += "\n## Key Formulas / Principles\n"
    for formula in (note.key_formulas or []):
        markdown_output += f"- **{formula.get('name')}**: `{formula.get('formula')}` - {formula.get('description')}\n"
        
    markdown_output += "\n## Flashcards\n"
    for idx, card in enumerate(note.flashcards or []):
        markdown_output += f"### Q{idx+1}: {card.get('question')}\n**Answer**: {card.get('answer')}\n\n"
        
    markdown_output += f"\n## One-Page Revision Summary\n{note.revision_sheet}\n"
    
    headers = {"Content-Disposition": f"attachment; filename={note.topic.replace(' ', '_')}_notes.md"}
    return PlainTextResponse(content=markdown_output, headers=headers)


# --- AI QUIZ ENDPOINTS ---

@app.post("/api/quiz/generate", response_model=schemas.QuizResponse)
def create_quiz(
    topic: str = Query(...),
    difficulty: str = Query("Medium"),
    questions_count: int = Query(3),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    quiz_data = ai.generate_quiz(topic, difficulty, questions_count)
    
    new_quiz = models.Quiz(
        user_id=current_user.id,
        title=quiz_data.get("title", f"{topic} Quiz"),
        topic=topic,
        difficulty=difficulty,
        questions=quiz_data.get("questions", [])
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    return new_quiz

@app.post("/api/quiz/submit/{quiz_id}", response_model=schemas.QuizResultResponse)
def submit_quiz(
    quiz_id: int,
    result_in: schemas.QuizResultCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    new_result = models.QuizResult(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=result_in.score,
        total_questions=result_in.total_questions,
        time_taken=result_in.time_taken,
        weak_topics=result_in.weak_topics
    )
    db.add(new_result)
    
    # Adaptive Trigger: If they score low (e.g. < 70%), notify them and update profile weakness
    percentage = (result_in.score / result_in.total_questions) * 100 if result_in.total_questions > 0 else 100
    if percentage < 70.0:
        profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
        if profile:
            current_weaks = set(profile.weak_subjects or [])
            # Add topic to weak subjects if not already there
            if quiz.topic not in current_weaks:
                current_weaks.add(quiz.topic)
                profile.weak_subjects = list(current_weaks)
                
        # Send warning notification
        new_notif = models.Notification(
            user_id=current_user.id,
            message=f"Adaptive Tutor: You scored {result_in.score}/{result_in.total_questions} on the '{quiz.topic}' quiz. We've added this to your weaknesses and will prioritize it in future study schedules.",
            read=False,
            scheduled_at=datetime.datetime.utcnow(),
            type="streak"
        )
        db.add(new_notif)
        
    db.commit()
    db.refresh(new_result)
    return new_result

@app.get("/api/quiz/results", response_model=List[schemas.QuizResultResponse])
def get_quiz_results(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.QuizResult).filter(
        models.QuizResult.user_id == current_user.id
    ).order_by(models.QuizResult.taken_at.desc()).all()


# --- DASHBOARD & ANALYTICS ---

@app.get("/api/analytics/dashboard")
def get_dashboard_data(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.date.today()
    
    # 1. Welcome Card - Generate AI daily motivation based on streak
    # Calculate streak from progress logs
    logs = db.query(models.ProgressLog).filter(
        models.ProgressLog.user_id == current_user.id
    ).order_by(models.ProgressLog.date.desc()).limit(15).all()
    
    streak = 0
    if logs:
        # Check if the user studied today or yesterday
        last_log = logs[0]
        if last_log.date == today or last_log.date == (today - datetime.timedelta(days=1)):
            # Trace backwards
            current_check = last_log.date
            for log in logs:
                if log.date == current_check and log.hours_studied > 0:
                    streak += 1
                    current_check -= datetime.timedelta(days=1)
                else:
                    break
                    
    motivation = ai.generate_daily_motivation(streak, current_user.full_name)
    
    # 2. Today's study goals (subjects and hours)
    today_tasks = db.query(models.DailyTask).filter(
        models.DailyTask.user_id == current_user.id,
        models.DailyTask.date == today
    ).all()
    
    total_hours_today = sum(t.duration for t in today_tasks)
    completed_hours_today = sum(t.duration for t in today_tasks if t.status == "completed")
    
    # 3. Progress Ring Percentage
    progress_percentage = (completed_hours_today / total_hours_today * 100) if total_hours_today > 0 else 0.0
    
    # 4. Upcoming Exams Countdown Timers
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    exams_countdown = []
    for sub in subjects:
        if sub.target_completion_date:
            days_left = (sub.target_completion_date - today).days
            exams_countdown.append({
                "subject": sub.name,
                "days_left": max(0, days_left)
            })
            
    # 5. Weekly Study Chart (Hours studied)
    weekly_chart = []
    for i in range(6, -1, -1):
        target_date = today - datetime.timedelta(days=i)
        day_log = db.query(models.ProgressLog).filter(
            models.ProgressLog.user_id == current_user.id,
            models.ProgressLog.date == target_date
        ).first()
        weekly_chart.append({
            "day": target_date.strftime("%a"),
            "hours": day_log.hours_studied if day_log else 0.0
        })
        
    # 6. Subject-wise progress (Completed vs Total hours or tasks)
    subject_progress = []
    all_tasks = db.query(models.DailyTask).filter(models.DailyTask.user_id == current_user.id).all()
    
    # Group tasks by subject
    subjects_map = {}
    for task in all_tasks:
        if task.subject not in subjects_map:
            subjects_map[task.subject] = {"total": 0, "completed": 0}
        subjects_map[task.subject]["total"] += 1
        if task.status == "completed":
            subjects_map[task.subject]["completed"] += 1
            
    for name, counts in subjects_map.items():
        percentage = (counts["completed"] / counts["total"] * 100) if counts["total"] > 0 else 0
        subject_progress.append({
            "subject": name,
            "completed": counts["completed"],
            "total": counts["total"],
            "percentage": round(percentage, 1)
        })
        
    # If empty, add template values
    if not subject_progress:
        for sub in subjects:
            subject_progress.append({
                "subject": sub.name,
                "completed": 0,
                "total": 0,
                "percentage": 0.0
            })
            
    # 7. General Stats
    # Productivity Score average of last 7 entries
    last_7_logs = logs[:7]
    avg_prod_score = int(sum(l.productivity_score for l in last_7_logs) / len(last_7_logs)) if last_7_logs else 0
    
    return {
        "motivation": motivation,
        "streak": streak,
        "today_goals": [
            {"subject": t.subject, "title": t.title, "duration": t.duration, "status": t.status, "id": t.id}
            for t in today_tasks
        ],
        "progress_percentage": round(progress_percentage, 1),
        "upcoming_exams": exams_countdown[:4],
        "weekly_study_chart": weekly_chart,
        "subject_progress": subject_progress,
        "productivity_score": avg_prod_score
    }


# --- NOTIFICATIONS ENDPOINTS ---

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.scheduled_at.desc()).limit(15).all()

@app.put("/api/notifications/read/{notif_id}", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notif_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.read = True
    db.commit()
    return {"message": "Notification marked as read"}
