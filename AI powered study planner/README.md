# AI-Powered Academic Success Platform (AI Study Planner)

A production-ready full-stack academic success and productivity web application. It integrates a sleek, responsive React + Tailwind CSS v4 dashboard with a FastAPI (Python) backend, SQLAlchemy database logs, and Google's Gemini AI API to construct custom study schedules, summarize learning slides, build recall flashcards, generate diagnostics quizzes, and tutor students.

---

## Features

1. **AI Study Plan Generator**: Leverages the Gemini API (falling back to custom mock roadmaps when API credentials are omitted) to map week-long calendars based on target exams, course lists, daily time budgets, and weak subjects.
2. **Smart Adaptive Rescheduling**: A dedicated custom algorithm that automatically scans for past-due unfinished study sessions, redistributes them to future capacity blocks without violating the user's daily study hours cap, and highlights weak subjects.
3. **Tutoring Chat Assistant**: An interactive chat interface complete with a stateful chat pane and a split-screen notes/coding editor scratchpad.
4. **AI Notes Compiler**: Paste lecture notes or upload slides to generate summary cheat sheets, formula lists, and interactive recall flashcards.
5. **AI Quiz Generator**: Generates MCQs dynamically on any topic. Scores below 70% automatically update the student's profile to mark the topic as "weak", adapting future calendar schedules.
6. **Productivity Metrics & Streaks**: Beautiful charts (Recharts) charting study consistency, streak milestones, and task completion percentage by subject.

---

## Directory Structure

```
ai-study-planner/
├── backend/
│   ├── app/
│   │   ├── auth.py          # JWT & passwords hashing
│   │   ├── config.py        # Settings loader
│   │   ├── database.py      # SQLAlchemy connection setup
│   │   ├── models.py        # SQLAlchemy schema models (11 tables)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── ai.py            # Google Gemini AI services wrapper
│   │   ├── scheduler.py     # Rescheduling & database population algorithms
│   │   ├── seed.py          # Demo database seeder script
│   │   └── main.py          # FastAPI server entrypoint and routers
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # UI widgets
│   │   ├── context/         # AuthContext with Axios interceptor
│   │   ├── pages/           # Landing, Login, Onboarding, Planner, Chat, Notes, Quiz, Analytics
│   │   ├── App.jsx          # Route coordinator & navigation shell
│   │   ├── index.css        # Tailwind v4 configuration
│   │   └── main.jsx
│   ├── vite.config.js       # Vite proxy & Tailwind config
│   └── package.json
└── README.md
```

---

## Installation & Setup

### 1. Backend Setup

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables:
   ```bash
   copy .env.example .env
   ```
5. *(Optional)* Add your Gemini API key inside `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
   *Note: If no API key is specified, the application will automatically enter **Mock Fallback Mode**, allowing you to test all pages and AI functions offline with realistic pre-configured study responses.*

6. **Seed the database** (Creates a fully populated account to test charts and planners instantly):
   ```bash
   python app/seed.py
   ```
7. Launch the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup

The frontend is compiled using React, Vite, and Tailwind CSS v4. Since the platform utilizes a portable Node installation, execute commands inside the root workspace using the provided path wrapper:

1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   # Run using the portable runner script:
   powershell -ExecutionPolicy Bypass -File ../../setup_node.ps1
   # (Installs Node to AppData. Skip if you already have Node.js 20+ installed globally)
   
   # Run installation:
   powershell -ExecutionPolicy Bypass -File ../../run_node.ps1 npm install
   ```
3. Launch the React development server:
   ```bash
   powershell -ExecutionPolicy Bypass -File ../../run_node.ps1 npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quick Testing Guide

1. Open the website at [http://localhost:3000](http://localhost:3000).
2. Click **Get Started Free**.
3. Log in with the pre-seeded credentials:
   - **Email**: `demo@example.com`
   - **Password**: `password123`
4. Explore the pages:
   - **Dashboard**: View charts, streak progress, and today's goals. Toggle checkboxes to see the completion rings update in real-time.
   - **Daily Planner**: Test the Pomodoro study/break clocks. Click **Smart Reschedule** to observe the rescheduling algorithm redistribute missed tasks from past dates.
   - **AI Tutor Chat**: Chat with the bot and note how code blocks auto-export to the scratchpad editor on the right.
   - **Notes Compiler**: Paste text or topics to generate summaries, formulas, and flip flashcards. Click **Export Markdown** to download files locally.
   - **AI Quiz**: Select a topic and take the test. Scoring below 70% will trigger an adaptive warning and mark the topic as weak.
5. Toggle between **Light Mode** and **Dark Mode** via the button in the bottom-left sidebar.
