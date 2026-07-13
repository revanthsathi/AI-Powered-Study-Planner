import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app import models, auth

def seed_data():
    db = SessionLocal()
    
    # Re-create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Re-created database tables.")
    
    # 1. Create Demo User
    hashed_pwd = auth.get_password_hash("password123")
    user = models.User(
        email="demo@example.com",
        full_name="Alex Mercer",
        hashed_password=hashed_pwd,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Created Demo User: {user.email}")
    
    # 2. Create Profile
    profile = models.Profile(
        user_id=user.id,
        college="Stanford University",
        branch="Computer Science",
        semester=6,
        target_goal="Placement",
        preferred_study_time="Night",
        daily_available_hours=4.0,
        weak_subjects=["Mathematics", "Database Systems"],
        strong_subjects=["Computer Networks", "Algorithms"]
    )
    db.add(profile)
    
    # 3. Create Subjects
    subjects_data = [
        {"name": "Mathematics", "difficulty": "Hard", "days": 45},
        {"name": "Database Systems", "difficulty": "Hard", "days": 60},
        {"name": "Computer Networks", "difficulty": "Medium", "days": 90},
        {"name": "Algorithms", "difficulty": "Easy", "days": 120}
    ]
    for sub in subjects_data:
        new_sub = models.Subject(
            user_id=user.id,
            name=sub["name"],
            difficulty=sub["difficulty"],
            target_completion_date=datetime.date.today() + datetime.timedelta(days=sub["days"])
        )
        db.add(new_sub)
        
    # 4. Create historical Progress Logs (Last 7 Days)
    today = datetime.date.today()
    for i in range(7, 0, -1):
        log_date = today - datetime.timedelta(days=i)
        hours = 2.5 + (i % 3) * 0.5  # varying hours
        prod_score = 65 + (i * 4) % 30
        new_log = models.ProgressLog(
            user_id=user.id,
            date=log_date,
            hours_studied=hours,
            productivity_score=prod_score,
            focus_streak=8 - i
        )
        db.add(new_log)
        
    # Create empty log for today
    today_log = models.ProgressLog(
        user_id=user.id,
        date=today,
        hours_studied=0.0,
        productivity_score=75,
        focus_streak=7
    )
    db.add(today_log)
        
    # 5. Create Daily Tasks (completed, pending, and missed)
    # Missed tasks (pending tasks with past dates) for Rescheduling demo
    yesterday = today - datetime.timedelta(days=1)
    two_days_ago = today - datetime.timedelta(days=2)
    
    missed_task1 = models.DailyTask(
        user_id=user.id,
        subject="Database Systems",
        title="Study Normalization (1NF, 2NF)",
        date=two_days_ago,
        start_time="14:00",
        duration=1.5,
        status="pending"
    )
    missed_task2 = models.DailyTask(
        user_id=user.id,
        subject="Mathematics",
        title="Practice Vector Calculus Problems",
        date=yesterday,
        start_time="10:00",
        duration=2.0,
        status="pending"
    )
    db.add_all([missed_task1, missed_task2])
    
    # Completed tasks in the past
    completed_task1 = models.DailyTask(
        user_id=user.id,
        subject="Algorithms",
        title="Understand Dijkstra's Algorithm",
        date=two_days_ago,
        start_time="09:00",
        duration=1.5,
        status="completed",
        completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
    )
    completed_task2 = models.DailyTask(
        user_id=user.id,
        subject="Computer Networks",
        title="Learn TCP/IP 3-Way Handshake",
        date=yesterday,
        start_time="16:00",
        duration=1.0,
        status="completed",
        completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
    )
    db.add_all([completed_task1, completed_task2])
    
    # Today's tasks (pending)
    today_task1 = models.DailyTask(
        user_id=user.id,
        subject="Mathematics",
        title="Double Integrals & Polar Coordinates",
        date=today,
        start_time="10:00",
        duration=2.0,
        status="pending"
    )
    today_task2 = models.DailyTask(
        user_id=user.id,
        subject="Database Systems",
        title="SQL Subqueries & Join Tuning",
        date=today,
        start_time="15:00",
        duration=1.5,
        status="pending"
    )
    db.add_all([today_task1, today_task2])
    
    # Future tasks
    for i in range(1, 4):
        future_date = today + datetime.timedelta(days=i)
        future_task = models.DailyTask(
            user_id=user.id,
            subject="Algorithms" if i%2==0 else "Computer Networks",
            title=f"Study Advanced Session {i}",
            date=future_date,
            start_time="11:00",
            duration=1.5,
            status="pending"
        )
        db.add(future_task)
        
    # 6. Create Study Notes
    note = models.Note(
        user_id=user.id,
        topic="Database Normalization",
        content="""# Database Normalization Guide
Normalization is the database design technique for organizing schemas to avoid data redundancy and dependency anomalies.

## Normal Forms
1. **First Normal Form (1NF)**: Atomic values, no repeating groups.
2. **Second Normal Form (2NF)**: Meets 1NF, and eliminates partial dependencies (no non-prime attribute depends on a subset of a candidate key).
3. **Third Normal Form (3NF)**: Meets 2NF, and eliminates transitive dependencies.
4. **Boyce-Codd Normal Form (BCNF)**: For every dependency X -> Y, X must be a superkey.""",
        bullet_summaries=[
            "Normalization reduces database redundancy and avoids update anomalies.",
            "1NF enforces atomic attributes in tables.",
            "2NF eliminates partial dependencies on primary key subsets.",
            "3NF ensures no non-key attribute transitively depends on the primary key."
        ],
        flashcards=[
            {"question": "What is partial dependency?", "answer": "A condition where a non-prime attribute is dependent on only a part of a composite candidate key."},
            {"question": "What form resolves transitive dependencies?", "answer": "Third Normal Form (3NF)."}
        ],
        key_formulas=[
            {"name": "Functional Dependency Rule", "formula": "X -> Y", "description": "X uniquely determines Y in all database states."}
        ],
        revision_sheet="### Cheat Sheet\n- **1NF**: Atomic inputs only.\n- **2NF**: Fully functional dependencies on composite keys.\n- **3NF**: No transitive chains."
    )
    db.add(note)
    
    # 7. Create a Quiz
    quiz = models.Quiz(
        user_id=user.id,
        title="SQL and Relational Algebra Diagnostics",
        topic="Database Systems",
        difficulty="Medium",
        questions=[
            {
                "question": "Which SQL command is used to delete a table schema and all its rows?",
                "options": ["DELETE", "TRUNCATE", "DROP TABLE", "REMOVE"],
                "correct_answer": "DROP TABLE",
                "explanation": "DROP TABLE deletes the entire table definition, schemas, and structural data. DELETE only deletes rows."
            },
            {
                "question": "Which normal form requires the deletion of transitive dependencies?",
                "options": ["1NF", "2NF", "3NF", "BCNF"],
                "correct_answer": "3NF",
                "explanation": "3NF requires a table to be in 2NF and have no transitive dependencies."
            }
        ]
    )
    db.add(quiz)
    
    # 8. Create a Notification
    notif = models.Notification(
        user_id=user.id,
        message="Welcome to your AI-powered study planner! Use the sidebar to set up study sessions, generate flashcards, and run quizzes.",
        read=False,
        scheduled_at=datetime.datetime.utcnow(),
        type="alert"
    )
    db.add(notif)
    
    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
