import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.config import settings

# Global imports for GenAI SDK types
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Configure logging
logger = logging.getLogger("app.ai")
logging.basicConfig(level=logging.INFO)

# Try importing the new GenAI SDK
HAS_GEMINI_SDK = False
client = None

def init_gemini_client():
    global HAS_GEMINI_SDK, client
    try:
        from google import genai
        from google.genai import types
        
        # Load from .env file dynamically to bypass process caching
        import os
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path, override=True)
            
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key and api_key != "your_gemini_api_key_here" and api_key != "":
            client = genai.Client(api_key=api_key)
            HAS_GEMINI_SDK = True
            return client
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini SDK ({e}). Using mock fallback mode.")
    
    HAS_GEMINI_SDK = False
    client = None
    return None

# Initial check
init_gemini_client()


# --- PYDANTIC SCHEMAS FOR STRUCTURED AI OUTPUTS ---

class AIScheduleTask(BaseModel):
    subject: str
    title: str
    start_time: str
    duration: float
    reason: str

class AIDayPlan(BaseModel):
    day: str
    tasks: List[AIScheduleTask]
    notes: str

class AIStudyPlanOutput(BaseModel):
    overall_strategy: str
    weekly_timetable: List[AIDayPlan]
    weekly_goals: List[str]
    revision_slots: List[str]
    break_recommendations: str

class AIFlashcard(BaseModel):
    question: str
    answer: str

class AIFormula(BaseModel):
    name: str
    formula: str
    description: str

class AINotesOutput(BaseModel):
    content: str
    bullet_summaries: List[str]
    flashcards: List[AIFlashcard]
    key_formulas: List[AIFormula]
    revision_sheet: str

class AIQuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class AIQuizOutput(BaseModel):
    title: str
    questions: List[AIQuizQuestion]


# --- MOCK FALLBACK DATA ---

MOCK_STUDY_PLANS = {
    "default": {
        "overall_strategy": "This is a custom-tailored study plan focused on strengthening weak areas and maintaining regular revisions. Daily tasks are spaced with active recall slots.",
        "weekly_timetable": [
            {
                "day": "Monday",
                "tasks": [
                    {"subject": "Mathematics", "title": "Calculus Foundations & Limits", "start_time": "09:00", "duration": 2.0, "reason": "Weak subject. Needs fresh morning energy."},
                    {"subject": "Computer Science", "title": "Database Normalization & SQL Exercises", "start_time": "14:00", "duration": 1.5, "reason": "Core branch requirement."}
                ],
                "notes": "Focus on practice problems rather than just reading notes."
            },
            {
                "day": "Tuesday",
                "tasks": [
                    {"subject": "Physics", "title": "Electromagnetism: Gauss's Law", "start_time": "10:00", "duration": 2.0, "reason": "Medium difficulty subject."},
                    {"subject": "Revision", "title": "Active Recall: Monday's SQL & Calculus", "start_time": "16:00", "duration": 1.0, "reason": "Spaced repetition slot."}
                ],
                "notes": "Do 3 Gauss's Law derivations without looking."
            },
            {
                "day": "Wednesday",
                "tasks": [
                    {"subject": "Mathematics", "title": "Integration Techniques & Substitution", "start_time": "09:00", "duration": 2.0, "reason": "Weak subject priority."},
                    {"subject": "Computer Science", "title": "Data Structures: Trees and Traversals", "start_time": "14:00", "duration": 1.5, "reason": "Essential coding interview preparation."}
                ],
                "notes": "Take a 10-minute break after every 50 minutes of study."
            },
            {
                "day": "Thursday",
                "tasks": [
                    {"subject": "Physics", "title": "Circuit Analysis & Kirchhoff's Laws", "start_time": "10:00", "duration": 2.0, "reason": "High-weightage topic."},
                    {"subject": "Revision", "title": "Review Trees and Integration", "start_time": "16:00", "duration": 1.0, "reason": "Mid-week retention check."}
                ],
                "notes": "Draw the circuit diagrams cleanly."
            },
            {
                "day": "Friday",
                "tasks": [
                    {"subject": "Mathematics", "title": "Differential Equations: First Order", "start_time": "09:00", "duration": 2.0, "reason": "Weak subject final weekly push."},
                    {"subject": "Computer Science", "title": "Algorithmic Complexity & Big O notation", "start_time": "14:00", "duration": 1.5, "reason": "Critical placements pre-requisite."}
                ],
                "notes": "Solve at least 5 differential equations problems."
            },
            {
                "day": "Saturday",
                "tasks": [
                    {"subject": "Weekly Test", "title": "Mini Quiz: Math & CS", "start_time": "10:00", "duration": 1.5, "reason": "Self-assessment to check progress."},
                    {"subject": "Weak Area Review", "title": "Recap Calculus and SQL errors", "start_time": "14:00", "duration": 1.5, "reason": "Adaptive feedback reinforcement."}
                ],
                "notes": "Identify any topics you scored low on for next week."
            },
            {
                "day": "Sunday",
                "tasks": [
                    {"subject": "Buffer & Planning", "title": "Review unresolved questions & plan next week", "start_time": "11:00", "duration": 1.0, "reason": "Light prep and scheduling buffer."}
                ],
                "notes": "Rest and recharge for the upcoming week."
            }
        ],
        "weekly_goals": [
            "Master Integration by Substitution",
            "Understand BST traversals",
            "Analyze basic RLC circuits"
        ],
        "revision_slots": [
            "Tuesday 16:00 - 17:00 (Recall Calculus/SQL)",
            "Thursday 16:00 - 17:00 (Recall Trees/Integration)",
            "Saturday 14:00 - 15:30 (Adaptive review)"
        ],
        "break_recommendations": "Use a 50-10 Pomodoro structure. Take a longer 30-minute break after 3 consecutive sessions. Do not study during scheduled break slots."
    }
}

MOCK_NOTES = {
    "default": {
        "content": "# Academic Success Note\nThis study guide covers the core concepts of the requested topic. It outlines definitions, formulas, and visual outlines to enhance retention.",
        "bullet_summaries": [
            "Core Concept: The foundation lies in understanding basic definitions and underlying proofs.",
            "Methodology: Break complex problems into sequential sub-tasks.",
            "Active Recall: Test yourself with flashcards rather than re-reading.",
            "Spaced Repetition: Re-evaluate key concepts after 1, 3, and 7 days."
        ],
        "flashcards": [
            {"question": "What is the primary formula/definition in this topic?", "answer": "It is defined by the relation of input variables to output outcomes."},
            {"question": "How do we identify a weak area?", "answer": "Through consistent diagnostic quizzes and tracking question completion times."}
        ],
        "key_formulas": [
            {"name": "General Relation", "formula": "F(x) = dx / dt", "description": "Measures the rate of change of comprehension over time."}
        ],
        "revision_sheet": "## Quick Revision Cheat Sheet\n- **Step 1**: Review definitions.\n- **Step 2**: Solve the core equations.\n- **Step 3**: Take the sample quiz.\n- **Step 4**: Complete spaced revision."
    }
}

MOCK_QUIZZES = {
    "default": {
        "title": "Topic Diagnostic Quiz",
        "questions": [
            {
                "question": "Which of the following describes the most effective way to improve learning retention?",
                "options": [
                    "Re-reading notes 3 times",
                    "Highlighting terms in textbook",
                    "Active recall and testing",
                    "Passive audio listening"
                ],
                "correct_answer": "Active recall and testing",
                "explanation": "Active recall forces the brain to retrieve information from memory, strengthening neural connections far more than passive review."
            },
            {
                "question": "What is the primary purpose of spaced repetition?",
                "options": [
                    "To cram before exams",
                    "To beat the forgetting curve",
                    "To study 12 hours a day",
                    "To skip homework assignments"
                ],
                "correct_answer": "To beat the forgetting curve",
                "explanation": "By reviewing information at increasing intervals, spaced repetition resets the forgetting curve, transferring knowledge into long-term memory."
            },
            {
                "question": "When scheduling tasks, which subjects should receive the highest priority?",
                "options": [
                    "Strongest subjects",
                    "Easiest subjects",
                    "Weakest subjects and upcoming exams",
                    "Elective optional courses"
                ],
                "correct_answer": "Weakest subjects and upcoming exams",
                "explanation": "Focusing on weak subjects first maximizes grade improvements and minimizes anxiety before final examinations."
            }
        ]
    }
}


# --- SERVICES IMPLEMENTATION ---

def generate_study_plan(
    subjects: List[Dict[str, Any]],
    target_goal: str,
    daily_hours: float,
    weak_subjects: List[str],
    strong_subjects: List[str]
) -> Dict[str, Any]:
    """
    Generates a structured weekly study plan with tasks, revisions, and breaks.
    """
    init_gemini_client()
    if not HAS_GEMINI_SDK:
        return MOCK_STUDY_PLANS["default"]

    subjects_str = ", ".join([f"{s['name']} ({s['difficulty']})" for s in subjects])
    weak_str = ", ".join(weak_subjects)
    strong_str = ", ".join(strong_subjects)

    prompt = f"""
    Build a weekly academic study plan for a student.
    - College Subjects: {subjects_str}
    - Weak Subjects: {weak_str}
    - Strong Subjects: {strong_str}
    - Daily available study hours: {daily_hours} hours
    - Target Goal: {target_goal}

    Structure requirements:
    1. Focus more on weak subjects, scheduling them in early slots.
    2. Add spaced revision slots for all subjects.
    3. Include break recommendations and weekly goals.
    4. Start times must be realistic. Daily hours must not exceed {daily_hours} hours.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIStudyPlanOutput,
                temperature=0.2
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API error in generate_study_plan: {e}. Falling back.")
        return MOCK_STUDY_PLANS["default"]


def generate_notes(topic: str, source_text: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates structured summaries, bullet points, flashcards, formulas, and revision guides.
    """
    init_gemini_client()
    if not HAS_GEMINI_SDK:
        return MOCK_NOTES["default"]

    source_prompt = f"Topic: {topic}\n"
    if source_text:
        source_prompt += f"Based on this content:\n{source_text}"

    prompt = f"""
    You are an expert AI academic tutor. Generate complete, premium-quality study notes for the following:
    {source_prompt}

    You must output a JSON structure containing:
    1. markdown content (rich notes)
    2. 4 bullet summaries
    3. 3-4 flashcards (question & answer)
    4. any key formulas (or core laws/principles if formulas do not apply)
    5. a concise one-page revision sheet
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AINotesOutput,
                temperature=0.3
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API error in generate_notes: {e}. Falling back.")
        return MOCK_NOTES["default"]


def get_mock_quiz_for_topic(topic: str, difficulty: str, num_questions: int) -> Dict[str, Any]:
    topic_lower = topic.lower()
    
    # Mathematics mock
    if "math" in topic_lower or "calculus" in topic_lower or "algebra" in topic_lower:
        questions = [
            {
                "question": "What is the limit of (sin x) / x as x approaches 0?",
                "options": ["0", "1", "Infinity", "Undefined"],
                "correct_answer": "1",
                "explanation": "Using L'Hopital's rule or basic trigonometric limits, the limit of sin(x)/x as x approaches 0 is exactly 1."
            },
            {
                "question": "What is the derivative of e^(2x) with respect to x?",
                "options": ["e^(2x)", "2e^(2x)", "0.5e^(2x)", "2xe^(2x-1)"],
                "correct_answer": "2e^(2x)",
                "explanation": "Applying the Chain Rule, d/dx[e^(u)] = e^(u) * du/dx. Here u = 2x, so the derivative is e^(2x) * 2."
            },
            {
                "question": "Which of the following describes the area under a curve f(x) from a to b?",
                "options": ["The derivative of f(x)", "The definite integral of f(x) from a to b", "The slope of the tangent line", "The limit of f(x)"],
                "correct_answer": "The definite integral of f(x) from a to b",
                "explanation": "Definite integration computes the signed area between the x-axis and the curve f(x) within the boundary limits."
            }
        ]
    # Computer Networks mock
    elif "network" in topic_lower or "tcp" in topic_lower or "ip" in topic_lower or "dns" in topic_lower:
        questions = [
            {
                "question": "Which layer of the OSI model is responsible for reliable end-to-end data delivery?",
                "options": ["Physical Layer", "Network Layer", "Transport Layer", "Application Layer"],
                "correct_answer": "Transport Layer",
                "explanation": "The Transport Layer (Layer 4) handles flow control, error checking, and packet retransmission (e.g. TCP) to guarantee reliable delivery."
            },
            {
                "question": "What is the primary difference between TCP and UDP?",
                "options": [
                    "TCP is connectionless, UDP is connection-oriented",
                    "TCP is reliable and guarantees packet order, UDP does not",
                    "UDP uses IP addresses, TCP does not",
                    "TCP is faster than UDP"
                ],
                "correct_answer": "TCP is reliable and guarantees packet order, UDP does not",
                "explanation": "TCP establishes a connection and uses checksums and sequence numbers for reliability. UDP simply fires packets without validation."
            },
            {
                "question": "What port does HTTP traffic typically use by default?",
                "options": ["21", "22", "80", "443"],
                "correct_answer": "80",
                "explanation": "Port 80 is the default port assigned for unencrypted HTTP traffic. Port 443 is used for encrypted HTTPS."
            }
        ]
    # Algorithms & DSA mock
    elif "algorithm" in topic_lower or "dsa" in topic_lower or "structure" in topic_lower or "sort" in topic_lower:
        questions = [
            {
                "question": "What is the worst-case time complexity of Quick Sort?",
                "options": ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"],
                "correct_answer": "O(n^2)",
                "explanation": "Quick Sort takes O(n^2) in the worst case when the pivot chosen is consistently the smallest or largest element (already sorted arrays)."
            },
            {
                "question": "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
                "options": ["Queue", "Stack", "Binary Search Tree", "Linked List"],
                "correct_answer": "Stack",
                "explanation": "A Stack uses LIFO order (last element added is the first one retrieved), whereas a Queue uses First-In, First-Out (FIFO)."
            },
            {
                "question": "What is the average time complexity of searching in a Balanced Binary Search Tree?",
                "options": ["O(n)", "O(1)", "O(log n)", "O(n log n)"],
                "correct_answer": "O(log n)",
                "explanation": "A balanced BST divides the search space in half at each step, resulting in a logarithmic average search time."
            }
        ]
    # Database / SQL mock
    elif "database" in topic_lower or "dbms" in topic_lower or "sql" in topic_lower or "query" in topic_lower:
        questions = [
            {
                "question": "Which SQL statement is used to remove all rows from a table without deleting the schema?",
                "options": ["DELETE FROM", "TRUNCATE", "DROP TABLE", "REMOVE"],
                "correct_answer": "TRUNCATE",
                "explanation": "TRUNCATE removes all rows quickly without logging individual row deletes, but preserves the table structure. DROP deletes structure too."
            },
            {
                "question": "What does the 'A' in ACID transaction properties stand for?",
                "options": ["Availability", "Atomicity", "Association", "Authorization"],
                "correct_answer": "Atomicity",
                "explanation": "Atomicity ensures that all transactions in a batch succeed or fail as a single indivisible unit ('all-or-nothing')."
            },
            {
                "question": "Which normal form requires resolving partial dependencies on composite keys?",
                "options": ["1NF", "2NF", "3NF", "BCNF"],
                "correct_answer": "2NF",
                "explanation": "2NF requires the table to be in 1NF and eliminates partial dependencies, meaning every non-prime attribute must depend on the whole primary key."
            }
        ]
    # Operating Systems mock
    elif "operating system" in topic_lower or "os" == topic_lower or "kernel" in topic_lower or "linux" in topic_lower:
        questions = [
            {
                "question": "Which of the following is NOT one of the Coffman conditions required for a deadlock to occur?",
                "options": ["Mutual Exclusion", "Hold and Wait", "Preemption allowed", "Circular Wait"],
                "correct_answer": "Preemption allowed",
                "explanation": "No preemption is required for deadlock. If preemption (forcibly taking resources away) is allowed, deadlocks can be resolved/prevented."
            },
            {
                "question": "What is the primary role of the CPU Virtual Memory management unit (MMU)?",
                "options": [
                    "To allocate CPU cache space",
                    "To translate virtual addresses to physical addresses",
                    "To schedule process execution queues",
                    "To increase hard drive storage capacity"
                ],
                "correct_answer": "To translate virtual addresses to physical addresses",
                "explanation": "The MMU hardware maps virtual memory addresses used by software processes to physical memory addresses on the RAM."
            },
            {
                "question": "Which scheduling algorithm is subject to the Convoy Effect?",
                "options": ["Round Robin", "Shortest Job First (SJF)", "First-Come, First-Served (FCFS)", "Priority Scheduling"],
                "correct_answer": "First-Come, First-Served (FCFS)",
                "explanation": "In FCFS, if a very long, CPU-bound process enters first, all subsequent short processes are blocked behind it (a convoy)."
            }
        ]
    # Physics mock
    elif "physics" in topic_lower or "mechanics" in topic_lower or "electromagnetism" in topic_lower:
        questions = [
            {
                "question": "Which law states that the induced electromotive force in any closed circuit is equal to the negative rate of change of the magnetic flux through the circuit?",
                "options": ["Ampere's Law", "Gauss's Law", "Faraday's Law of Induction", "Ohm's Law"],
                "correct_answer": "Faraday's Law of Induction",
                "explanation": "Faraday's law describes electromagnetic induction: EMF = -d(Phi)/dt, indicating how magnetic fields induce electrical current."
            },
            {
                "question": "What is the work done on an object when it moves in a circular path at a constant speed?",
                "options": ["Positive", "Negative", "Zero", "Dependent on the mass"],
                "correct_answer": "Zero",
                "explanation": "In uniform circular motion, the centripetal force is always perpendicular to the displacement vector. Since Work = F * d * cos(90), the work done is zero."
            },
            {
                "question": "According to Kepler's Third Law, the square of the orbital period of a planet is directly proportional to what?",
                "options": ["The mass of the planet", "The cube of the semi-major axis of its orbit", "The velocity of the planet", "The surface area of the sun"],
                "correct_answer": "The cube of the semi-major axis of its orbit",
                "explanation": "Kepler's third law states T^2 is proportional to a^3, relating orbital time periods to orbital distances."
            }
        ]
    # Chemistry mock
    elif "chemistry" in topic_lower or "organic" in topic_lower or "atom" in topic_lower or "bond" in topic_lower:
        questions = [
            {
                "question": "What is the hybridization of the carbon atom in a molecule of Methane (CH4)?",
                "options": ["sp", "sp2", "sp3", "dsp2"],
                "correct_answer": "sp3",
                "explanation": "Methane carbon forms four single covalent sigma bonds with hydrogen atoms in a tetrahedral geometry, which requires sp3 hybridization."
            },
            {
                "question": "Which of the following bonds is formed by the lateral or side-on overlap of p-atomic orbitals?",
                "options": ["Sigma bond", "Pi bond", "Ionic bond", "Hydrogen bond"],
                "correct_answer": "Pi bond",
                "explanation": "Sigma bonds are formed by head-on overlap. Pi bonds are formed by lateral overlap of parallel p-orbitals above and below the bonding axis."
            },
            {
                "question": "Which element has the highest electronegativity value on the Pauling scale?",
                "options": ["Oxygen", "Chlorine", "Fluorine", "Helium"],
                "correct_answer": "Fluorine",
                "explanation": "Fluorine is the most electronegative element on the periodic table (value of 4.0), attracting shared electrons strongly."
            }
        ]
    # Software Engineering mock
    elif "software" in topic_lower or "design pattern" in topic_lower or "oop" in topic_lower or "code" in topic_lower:
        questions = [
            {
                "question": "Which design pattern ensures that a class has only one instance and provides a global point of access to it?",
                "options": ["Factory Pattern", "Singleton Pattern", "Observer Pattern", "Strategy Pattern"],
                "correct_answer": "Singleton Pattern",
                "explanation": "The Singleton pattern restricts the instantiation of a class to one single object instance, which is globally accessible."
            },
            {
                "question": "In SOLID design principles, what does the 'L' stand for?",
                "options": ["Layered architecture", "Liskov Substitution Principle", "Logical separation", "Loose coupling"],
                "correct_answer": "Liskov Substitution Principle",
                "explanation": "Liskov Substitution states that objects of a sub-class should be replaceable with objects of its subclasses without affecting the correctness of the program."
            },
            {
                "question": "What is the main advantage of using inheritance in Object-Oriented Programming?",
                "options": ["Code reusability", "Data encapsulation", "Dynamic memory allocation", "Faster execution speed"],
                "correct_answer": "Code reusability",
                "explanation": "Inheritance allows subclasses to inherit fields and methods from base classes, preventing code duplication and encouraging reuse."
            }
        ]
    # Java mock
    elif "java" in topic_lower:
        questions = [
            {
                "question": "Which of the following is NOT a primitive data type in Java?",
                "options": ["int", "double", "boolean", "String"],
                "correct_answer": "String",
                "explanation": "In Java, 'String' is a reference data type (a class), not a primitive data type. Primitives include byte, short, int, long, float, double, char, and boolean."
            },
            {
                "question": "Which keyword is used to inherit a class in Java?",
                "options": ["implements", "extends", "inherits", "import"],
                "correct_answer": "extends",
                "explanation": "The 'extends' keyword is used to establish inheritance between classes in Java. The 'implements' keyword is used to implement interfaces."
            },
            {
                "question": "What is the size of the 'int' data type in Java?",
                "options": ["8 bits", "16 bits", "32 bits", "64 bits"],
                "correct_answer": "32 bits",
                "explanation": "In Java, the 'int' data type is a signed 32-bit (4 bytes) two's complement integer."
            }
        ]
    # Dynamic custom fallback for any custom topic!
    else:
        capitalized_topic = topic.capitalize()
        questions = [
            {
                "question": f"Which of the following represents a core fundamental principle when studying {capitalized_topic}?",
                "options": [
                    f"Analyzing the basic definitions and components of {capitalized_topic}",
                    f"Assuming all problems in {capitalized_topic} require complex formulas",
                    f"Avoiding the core introductory theories of {capitalized_topic}",
                    "Treating the subject as purely theoretical without application"
                ],
                "correct_answer": f"Analyzing the basic definitions and components of {capitalized_topic}",
                "explanation": f"Establishing a firm grasp of the definitions and building blocks of {capitalized_topic} is critical before attempting advanced analysis."
            },
            {
                "question": f"When solving practice problems in {capitalized_topic}, which step is considered the most effective first phase?",
                "options": [
                    "Start coding or calculating without writing down values",
                    f"Deconstruct the problem statement and identify known boundaries relative to {capitalized_topic}",
                    "Search online for a direct solution template",
                    "Skip directly to the final multiple choice options"
                ],
                "correct_answer": f"Deconstruct the problem statement and identify known boundaries relative to {capitalized_topic}",
                "explanation": f"Deconstructing the question and isolating active inputs relative to {capitalized_topic} limits errors and guides your resolution path."
            },
            {
                "question": f"Why is active recall and testing preferred over passive reading when studying {capitalized_topic}?",
                "options": [
                    "It makes studying take twice as long",
                    "It bypasses the need to review core materials",
                    "It triggers memory retrieval pathways, increasing long-term retention",
                    "It is only helpful for basic multiple-choice exam layouts"
                ],
                "correct_answer": "It triggers memory retrieval pathways, increasing long-term retention",
                "explanation": "Active self-testing trains the brain to retrieve information from memory, creating stronger neural connections than passive reviews."
            }
        ]

    # Slice questions based on requested size
    selected_questions = questions[:min(len(questions), num_questions)]
    return {
        "title": f"{topic} Diagnostic Quiz",
        "questions": selected_questions
    }


def generate_quiz(topic: str, difficulty: str, num_questions: int = 3) -> Dict[str, Any]:
    """
    Generates an MCQ quiz on a topic with options and explanations.
    """
    init_gemini_client()
    if not HAS_GEMINI_SDK:
        return get_mock_quiz_for_topic(topic, difficulty, num_questions)

    prompt = f"""
    Create an academic multiple-choice quiz.
    - Topic: {topic}
    - Difficulty: {difficulty}
    - Number of questions: {num_questions}

    Ensure:
    1. Questions have exactly 4 choices.
    2. Only 1 option is correct.
    3. Provide a clear explanation of why the correct option is right and others are wrong.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIQuizOutput,
                temperature=0.4
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API error in generate_quiz: {e}. Falling back.")
        return get_mock_quiz_for_topic(topic, difficulty, num_questions)


def get_chat_response(messages: List[Dict[str, str]], user_message: str, image_base64: Optional[str] = None) -> str:
    """
    Simulates a tutoring/coaching chat session (supporting text and screenshots).
    """
    init_gemini_client()
    if not HAS_GEMINI_SDK:
        # Check if an image is provided in Mock Mode
        if image_base64:
            return f"I see the screenshot/image you uploaded! Let's analyze it relative to your question: '{user_message}':\n\n1. **Visual Breakdown**: The screenshot presents the core layout, equation, or diagram clearly.\n2. **Underlying Concepts**: This maps directly to the active recall boundaries we discussed.\n3. **Tutoring Guidance**: To resolve this, evaluate the inputs, apply the formula, and verify constraints.\n\nDoes this help clarify the diagram in the screenshot?"

        # Simple mock bot responses
        user_message_lower = user_message.lower()
        if "explain" in user_message_lower:
            return f"To explain '{user_message}', let's break it down into core principles. First, identify the inputs. Second, trace the relationship. Third, evaluate with a sample. Does this clear up the basic structure?"
        elif "code" in user_message_lower or "program" in user_message_lower:
            return "Here is a standard code structure to solve that:\n```python\n# Academic Helper Function\ndef solve_problem(data):\n    # Process data\n    result = [x * 2 for x in data]\n    return result\n\nprint(solve_problem([1, 2, 3]))\n```\nTry executing this code and check the bounds."
        elif "interview" in user_message_lower or "question" in user_message_lower:
            return "Here is a common technical interview question:\n**Question**: Describe the difference between Bubble Sort and Quick Sort in terms of average time complexity and memory.\n\n*Hint*: Bubble sort takes \\(O(n^2)\\) and uses \\(O(1)\\) auxiliary memory, whereas Quick Sort takes \\(O(n \\log n)\\) on average."
        else:
            return "I am your personal AI Study Assistant. I can help explain tough academic topics, generate coding practice questions, review summaries, or quiz you on formulas. What would you like to focus on today?"

    # Package messages for API
    contents = []
    # Add history
    for msg in messages:
        contents.append(msg["message"])

    # If image uploaded, parse and add as a part (Multimodal input)
    if image_base64:
        try:
            import base64
            raw_b64 = image_base64
            mime_type = "image/png"
            if "," in raw_b64:
                header, raw_b64 = raw_b64.split(",", 1)
                if "image/" in header:
                    mime_type = header.split(";")[0].replace("data:", "")
            
            image_bytes = base64.b64decode(raw_b64)
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            contents.append(part)
        except Exception as img_err:
            logger.error(f"Failed to process uploaded chat image: {img_err}")

    # Add the text message
    contents.append(user_message)

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="You are an AI-powered academic tutor and productivity coach. Provide clear explanations, coding snippets in markdown, and formulas in LaTeX. Keep responses structured and highly educational."
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error in get_chat_response: {e}. Falling back.")
        return f"Gemini API error in get_chat_response: {str(e)}"


def generate_daily_motivation(streak: int, name: str) -> str:
    """
    Generates a personalized study motivation quote based on the user's current streak.
    """
    init_gemini_client()
    if not HAS_GEMINI_SDK:
        if streak == 0:
            return f"Welcome back, {name}! Today is a fresh opportunity to start a brand new study streak and master your goals. Let's tackle one task at a time."
        elif streak < 3:
            return f"Great job, {name}! You're on a {streak}-day streak. Consistency is the secret ingredient of success. Keep the fire burning!"
        else:
            return f"Sensational, {name}! A {streak}-day study streak! You are building deep, productive habits. Stay focused and conquer today's syllabus!"

    prompt = f"Create a short, energetic, motivational study quote (1-2 sentences) for a student named {name} who has a study streak of {streak} days."
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.8
            )
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error in generate_daily_motivation: {e}. Falling back.")
        return f"Hey {name}, your {streak}-day streak is proof of your dedication. Keep pushing forward!"
