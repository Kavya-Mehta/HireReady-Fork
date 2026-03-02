from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from openai import OpenAI
from database import InterviewDatabase
from dotenv import load_dotenv
import os
import jwt
import datetime

load_dotenv()

app = FastAPI(title="HireReady API")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
db = InterviewDatabase()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "hireready-secret-key-2026")

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ───────────────────────────────────────────────────────────
class AuthRequest(BaseModel):
    username: str
    password: str

class StartSessionRequest(BaseModel):
    interview_type: str
    difficulty: str
    num_questions: int
    resume_text: str = ""
    job_description: str = ""

class ChatRequest(BaseModel):
    session_id: int
    messages: list
    interview_type: str
    difficulty: str
    num_questions: int
    resume_text: str = ""
    job_description: str = ""

class UpdateStatusRequest(BaseModel):
    status: str

class UpdateUsernameRequest(BaseModel):
    new_username: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ResumeUploadRequest(BaseModel):
    filename: str
    content: str

# ─── JWT Helpers ───────────────────────────────────────────────────────────────
def create_token(user_id: int, username: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Auth Routes ───────────────────────────────────────────────────────────────
@app.post("/auth/signup")
def signup(req: AuthRequest):
    user_id, success, message = db.create_user(req.username, req.password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    token = create_token(user_id, req.username)
    return {"token": token, "user_id": user_id, "username": req.username}

@app.post("/auth/login")
def login(req: AuthRequest):
    user_id, success, message = db.authenticate_user(req.username, req.password)
    if not success:
        raise HTTPException(status_code=401, detail=message)
    token = create_token(user_id, req.username)
    return {"token": token, "user_id": user_id, "username": req.username}

# ─── Interview Routes ──────────────────────────────────────────────────────────
@app.post("/interview/start")
def start_interview(req: StartSessionRequest, user=Depends(verify_token)):
    system_prompt = build_system_prompt(
        req.interview_type, req.difficulty, req.num_questions, req.resume_text, req.job_description
    )
    messages = [{"role": "system", "content": system_prompt}]
    response = client.chat.completions.create(model="gpt-4o", messages=messages)
    ai_msg = response.choices[0].message.content
    session_id = db.create_session(
        user["user_id"], req.interview_type, req.difficulty, req.num_questions
    )
    db.save_message(session_id, "assistant", ai_msg)
    return {
        "session_id": session_id,
        "message": ai_msg,
        "messages": messages + [{"role": "assistant", "content": ai_msg}]
    }

@app.post("/interview/chat")
def chat(req: ChatRequest, user=Depends(verify_token)):
    response = client.chat.completions.create(model="gpt-4o", messages=req.messages)
    ai_reply = response.choices[0].message.content
    db.save_message(req.session_id, "assistant", ai_reply)
    is_complete = "thank you" in ai_reply.lower() and "overall" in ai_reply.lower()
    if is_complete:
        db.update_session_status(req.session_id, "completed")
    return {"message": ai_reply, "completed": is_complete}

@app.post("/interview/message")
def save_user_message(session_id: int, content: str, user=Depends(verify_token)):
    db.save_message(session_id, "user", content)
    return {"success": True}

@app.patch("/interview/session/{session_id}/status")
def update_status(session_id: int, req: UpdateStatusRequest, user=Depends(verify_token)):
    db.update_session_status(session_id, req.status)
    return {"success": True}

# ─── History Routes ────────────────────────────────────────────────────────────
@app.get("/history/sessions")
def get_sessions(user=Depends(verify_token)):
    sessions = db.get_user_sessions(user["user_id"], limit=20)
    for s in sessions:
        for k, v in s.items():
            if hasattr(v, 'isoformat'):
                s[k] = v.isoformat()
    return {"sessions": sessions}

@app.get("/history/session/{session_id}")
def get_session_details(session_id: int, user=Depends(verify_token)):
    details = db.get_session_details(session_id)
    if not details:
        raise HTTPException(status_code=404, detail="Session not found")
    for k, v in details.items():
        if hasattr(v, 'isoformat'):
            details[k] = v.isoformat()
    for msg in details.get('messages', []):
        for k, v in msg.items():
            if hasattr(v, 'isoformat'):
                msg[k] = v.isoformat()
    return details

@app.get("/history/stats")
def get_stats(user=Depends(verify_token)):
    return db.get_user_stats(user["user_id"])

# ─── Profile Routes ────────────────────────────────────────────────────────────
@app.get("/profile")
def get_profile(user=Depends(verify_token)):
    profile = db.get_user_profile(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    if profile.get("created_at") and hasattr(profile["created_at"], "isoformat"):
        profile["created_at"] = profile["created_at"].isoformat()
    return profile

@app.put("/profile/username")
def update_username(req: UpdateUsernameRequest, user=Depends(verify_token)):
    success, message = db.update_username(user["user_id"], req.new_username)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    new_token = create_token(user["user_id"], req.new_username)
    return {"message": message, "token": new_token, "username": req.new_username}

@app.put("/profile/password")
def update_password(req: UpdatePasswordRequest, user=Depends(verify_token)):
    success, message = db.update_password(user["user_id"], req.current_password, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@app.delete("/profile")
def delete_account(user=Depends(verify_token)):
    success, message = db.delete_user(user["user_id"])
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return {"message": message}

# ─── Resume Routes ─────────────────────────────────────────────────────────────

@app.get("/profile/resumes")
def get_resumes(user=Depends(verify_token)):
    resumes = db.get_user_resumes(user["user_id"])
    for r in resumes:
        if hasattr(r['uploaded_at'], 'isoformat'):
            r['uploaded_at'] = r['uploaded_at'].isoformat()
    return {"resumes": resumes}

@app.post("/profile/resumes")
def upload_resume(req: ResumeUploadRequest, user=Depends(verify_token)):
    resume_id, success, message = db.upload_resume(user["user_id"], req.filename, req.content)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message, "resume_id": resume_id}

@app.get("/profile/resumes/{resume_id}")
def get_resume(resume_id: int, user=Depends(verify_token)):
    resume = db.get_resume(user["user_id"], resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if hasattr(resume['uploaded_at'], 'isoformat'):
        resume['uploaded_at'] = resume['uploaded_at'].isoformat()
    return resume

@app.delete("/profile/resumes/{resume_id}")
def delete_resume(resume_id: int, user=Depends(verify_token)):
    success, message = db.delete_resume(user["user_id"], resume_id)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

# ─── System Prompt ─────────────────────────────────────────────────────────────
def build_system_prompt(interview_type, difficulty, num_questions, resume_text="", job_description=""):
    base_prompt = f"""You are an expert technical interviewer conducting a {difficulty} {interview_type} interview. Your job is to:
1. Ask one question at a time.
2. Wait for the candidate's response before proceeding.
3. After each answer, provide brief, constructive feedback (2-3 sentences).
4. Then ask the next question.
5. After {num_questions} questions, provide a final overall evaluation with strengths and areas for improvement.

Interview type guidance:
- Technical: Focus on coding problems, system design, algorithms, and domain knowledge.
- Behavioral: Use the STAR method (Situation, Task, Action, Result) for responses.
- Mixed: Alternate between technical and behavioral questions.

Start by greeting the candidate and asking the first question. Be professional, encouraging, and constructive."""

    if resume_text or job_description:
        base_prompt += "\n\nAdditional Context:\n"
        if resume_text:
            base_prompt += f"--- Candidate's Resume ---\n{resume_text}\n\n"
        if job_description:
            base_prompt += f"--- Job Description ---\n{job_description}\n\n"
        base_prompt += "Ensure your questions are tailored to the candidate's experience in their resume and the specific requirements mentioned in the job description."

    return base_prompt