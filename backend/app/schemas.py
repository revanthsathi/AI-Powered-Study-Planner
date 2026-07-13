from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# --- AUTH & USER ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- PROFILE ---
class ProfileBase(BaseModel):
    college: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    target_goal: Optional[str] = None
    preferred_study_time: Optional[str] = None
    daily_available_hours: float = 4.0
    weak_subjects: List[str] = []
    strong_subjects: List[str] = []

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# --- ONBOARDING ---
class SubjectInput(BaseModel):
    name: str
    difficulty: str  # "Easy", "Medium", "Hard"

class OnboardingRequest(BaseModel):
    profile: ProfileCreate
    subjects: List[SubjectInput]


# --- SUBJECT ---
class SubjectBase(BaseModel):
    name: str
    difficulty: str
    target_completion_date: Optional[date] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# --- STUDY PLAN ---
class StudyPlanBase(BaseModel):
    start_date: date
    end_date: date
    difficulty: Optional[str] = None
    daily_hours: float
    plan_metadata: Optional[Dict[str, Any]] = None

class StudyPlanCreate(StudyPlanBase):
    pass

class StudyPlanResponse(StudyPlanBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# --- DAILY TASK ---
class DailyTaskBase(BaseModel):
    subject: str
    title: str
    date: date
    start_time: Optional[str] = None
    duration: float = 1.0
    status: str = "pending"

class DailyTaskCreate(DailyTaskBase):
    pass

class DailyTaskUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[str] = None

class DailyTaskResponse(DailyTaskBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- QUIZ ---
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizBase(BaseModel):
    title: str
    topic: str
    difficulty: str

class QuizCreate(QuizBase):
    questions: List[QuizQuestion]

class QuizResponse(QuizBase):
    id: int
    user_id: int
    questions: List[QuizQuestion]

    class Config:
        from_attributes = True

class QuizResultCreate(BaseModel):
    score: int
    total_questions: int
    time_taken: Optional[int] = None
    weak_topics: List[str] = []

class QuizResultResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    total_questions: int
    time_taken: Optional[int] = None
    weak_topics: List[str] = []
    taken_at: datetime

    class Config:
        from_attributes = True


# --- NOTE ---
class FlashcardSchema(BaseModel):
    question: str
    answer: str

class FormulaSchema(BaseModel):
    name: str
    formula: str
    description: str

class NoteBase(BaseModel):
    topic: str
    content: str
    bullet_summaries: Optional[List[str]] = []
    flashcards: Optional[List[FlashcardSchema]] = []
    key_formulas: Optional[List[FormulaSchema]] = []
    revision_sheet: Optional[str] = None

class NoteCreate(BaseModel):
    topic: str
    text_content: Optional[str] = None
    file_content: Optional[str] = None # Base64 encoded or simple raw string representation

class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- CHAT ---
class ChatHistoryBase(BaseModel):
    role: str
    message: str

class ChatHistoryCreate(BaseModel):
    message: str
    image: Optional[str] = None

class ChatHistoryResponse(ChatHistoryBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# --- PROGRESS LOG ---
class ProgressLogBase(BaseModel):
    date: date
    hours_studied: float
    productivity_score: int
    focus_streak: int

class ProgressLogCreate(ProgressLogBase):
    pass

class ProgressLogResponse(ProgressLogBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# --- NOTIFICATION ---
class NotificationResponse(BaseModel):
    id: int
    message: str
    read: bool
    scheduled_at: datetime
    type: str

    class Config:
        from_attributes = True
