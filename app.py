import streamlit as st
from openai import OpenAI
from dotenv import load_dotenv
import os
from database import InterviewDatabase
from datetime import datetime, timezone

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
db = InterviewDatabase()

# ─── Helper Functions ──────────────────────────────────────────────────────────
def utc_to_local(utc_dt):
    """Convert UTC datetime to local timezone"""
    if utc_dt is None:
        return None
    if hasattr(utc_dt, 'replace'):
        # If datetime is naive (no timezone), assume it's UTC
        if utc_dt.tzinfo is None:
            utc_dt = utc_dt.replace(tzinfo=timezone.utc)
        # Convert to local timezone
        return utc_dt.astimezone()
    return utc_dt

# ─── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(page_title="AI Interview Simulator", page_icon="🤖", layout="wide")

# ─── User Authentication ───────────────────────────────────────────────────────
if "user_id" not in st.session_state:
    st.session_state.user_id = None
if "username" not in st.session_state:
    st.session_state.username = None

# Login/Signup section
if st.session_state.user_id is None:
    st.title("🤖 AI-Powered Tech Interview Simulator")
    st.subheader("Welcome! Please login or create an account to continue.")
    
    # Create tabs for Login and Signup
    tab1, tab2 = st.tabs(["🔑 Login", "📝 Sign Up"])
    
    with tab1:
        st.markdown("### Login to Your Account")
        with st.form("login_form"):
            login_username = st.text_input("Username", placeholder="Enter your username", key="login_user")
            login_password = st.text_input("Password", type="password", placeholder="Enter your password", key="login_pass")
            submit_login = st.form_submit_button("Login", use_container_width=True)
            
            if submit_login:
                if not login_username or not login_password:
                    st.error("⚠️ Please enter both username and password")
                else:
                    user_id, success, message = db.authenticate_user(login_username, login_password)
                    if success:
                        st.session_state.user_id = user_id
                        st.session_state.username = login_username
                        st.success("✅ " + message)
                        st.rerun()
                    else:
                        st.error("❌ " + message)
    
    with tab2:
        st.markdown("### Create New Account")
        with st.form("signup_form"):
            signup_username = st.text_input("Username", placeholder="Choose a username", key="signup_user")
            signup_password = st.text_input("Password", type="password", placeholder="Choose a password", key="signup_pass")
            signup_password_confirm = st.text_input("Confirm Password", type="password", placeholder="Re-enter your password", key="signup_pass_confirm")
            submit_signup = st.form_submit_button("Create Account", use_container_width=True)
            
            if submit_signup:
                if not signup_username or not signup_password or not signup_password_confirm:
                    st.error("⚠️ Please fill in all fields")
                elif len(signup_password) < 6:
                    st.error("⚠️ Password must be at least 6 characters long")
                elif signup_password != signup_password_confirm:
                    st.error("⚠️ Passwords do not match")
                else:
                    user_id, success, message = db.create_user(signup_username, signup_password)
                    if success:
                        st.session_state.user_id = user_id
                        st.session_state.username = signup_username
                        st.success("✅ " + message)
                        st.rerun()
                    else:
                        st.error("❌ " + message)
    
    st.stop()

# Main app
st.title("🤖 AI-Powered Tech Interview Simulator")
st.caption("Practice SDE or Data Science interviews with AI-generated questions and feedback.")
st.markdown(f"**Logged in as:** {st.session_state.username} | [Logout](#)")

# Logout button
col1, col2, col3 = st.columns([6, 1, 1])
with col3:
    if st.button("🚪 Logout"):
        st.session_state.user_id = None
        st.session_state.username = None
        st.session_state.messages = []
        st.session_state.interview_started = False
        st.session_state.question_count = 0
        st.rerun()

# ─── Session State Init ────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
if "interview_started" not in st.session_state:
    st.session_state.interview_started = False
if "question_count" not in st.session_state:
    st.session_state.question_count = 0
if "current_session_id" not in st.session_state:
    st.session_state.current_session_id = None
if "view_mode" not in st.session_state:
    st.session_state.view_mode = "interview"  # or "history"

# ─── Sidebar Config ────────────────────────────────────────────────────────────
with st.sidebar:
    st.header("⚙️ Interview Settings")
    
    # View mode selector
    view_mode = st.radio("Mode", ["📝 New Interview", "📚 History"], label_visibility="collapsed")
    if view_mode == "📚 History":
        st.session_state.view_mode = "history"
    else:
        st.session_state.view_mode = "interview"
    
    st.divider()
    
    if st.session_state.view_mode == "interview":
        track = st.selectbox("Career Track", ["Software Development Engineer (SDE)", "Data Science"])
        interview_type = st.selectbox("Interview Type", ["Technical", "Behavioral", "Mixed"])
        difficulty = st.selectbox("Difficulty", ["Entry Level", "Mid Level", "Senior Level"])
        num_questions = st.slider("Number of Questions", min_value=3, max_value=10, value=5)
        start_btn = st.button("🚀 Start Interview", use_container_width=True)
        if st.button("🔄 Reset", use_container_width=True):
            # Mark current session as abandoned if it exists
            if st.session_state.current_session_id:
                db.update_session_status(st.session_state.current_session_id, "abandoned")
            st.session_state.messages = []
            st.session_state.interview_started = False
            st.session_state.question_count = 0
            st.session_state.current_session_id = None
            st.rerun()
    else:
        # History view - show statistics
        stats = db.get_user_stats(st.session_state.user_id)
        st.metric("Total Interviews", stats.get('total_sessions', 0))
        st.metric("Completed", stats.get('completed_sessions', 0))
        
        if stats.get('by_track'):
            st.subheader("By Track")
            for track, count in stats['by_track'].items():
                st.text(f"{track}: {count}")
        
        if st.button("↩️ Back to Interview", use_container_width=True):
            st.session_state.view_mode = "interview"
            st.rerun()

# ─── System Prompt Builder ─────────────────────────────────────────────────────
def build_system_prompt(track, interview_type, difficulty, num_questions):
    return f"""You are an expert technical interviewer conducting a {difficulty} {interview_type} interview 
for a {track} role. Your job is to:
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

# ─── Start Interview ───────────────────────────────────────────────────────────
if st.session_state.view_mode == "interview" and start_btn and not st.session_state.interview_started:
    st.session_state.interview_started = True
    st.session_state.question_count = 0
    system_prompt = build_system_prompt(track, interview_type, difficulty, num_questions)
    st.session_state.messages = [{"role": "system", "content": system_prompt}]
    
    # Create database session
    st.session_state.current_session_id = db.create_session(
        st.session_state.user_id, track, interview_type, difficulty, num_questions
    )

    with st.spinner("Starting your interview..."):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=st.session_state.messages
        )
        ai_msg = response.choices[0].message.content
        st.session_state.messages.append({"role": "assistant", "content": ai_msg})
        
        # Save first AI message to database
        db.save_message(st.session_state.current_session_id, "assistant", ai_msg)
        
        st.session_state.question_count += 1

# ─── Chat Display ──────────────────────────────────────────────────────────────
if st.session_state.view_mode == "interview":
    for msg in st.session_state.messages:
        if msg["role"] == "system":
            continue
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# ─── User Input ────────────────────────────────────────────────────────────────
if st.session_state.view_mode == "interview":
    if st.session_state.interview_started:
        user_input = st.chat_input("Type your answer here...")
        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            
            # Save user message to database
            db.save_message(st.session_state.current_session_id, "user", user_input)
            
            with st.chat_message("user"):
                st.markdown(user_input)

            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = client.chat.completions.create(
                        model="gpt-4o",
                        messages=st.session_state.messages
                    )
                    ai_reply = response.choices[0].message.content
                    st.session_state.messages.append({"role": "assistant", "content": ai_reply})
                    
                    # Save AI response to database
                    db.save_message(st.session_state.current_session_id, "assistant", ai_reply)
                    
                    st.markdown(ai_reply)
                    st.session_state.question_count += 1
                    
                    # Check if interview is complete (simple heuristic)
                    if "thank you" in ai_reply.lower() and "overall" in ai_reply.lower():
                        db.update_session_status(st.session_state.current_session_id, "completed")
    else:
        st.info("👈 Configure your interview settings in the sidebar and click **Start Interview** to begin.")

# ─── History View ──────────────────────────────────────────────────────────────
else:  # view_mode == "history"
    st.header("📚 Interview History")
    
    # Display timezone info
    local_tz = datetime.now().astimezone().tzinfo
    st.caption(f"🌍 Times displayed in your local timezone: {local_tz}")
    
    sessions = db.get_user_sessions(st.session_state.user_id, limit=20)
    
    if not sessions:
        st.info("No interview history yet. Start your first interview!")
    else:
        # Display sessions in an organized manner
        for session in sessions:
            session_id = session['session_id']
            status_icon = "✅" if session['status'] == "completed" else "⏸️" if session['status'] == "in_progress" else "❌"
            
            # Convert UTC to local timezone and format for display
            local_time = utc_to_local(session['started_at'])
            started_at_str = local_time.strftime('%Y-%m-%d %H:%M') if hasattr(local_time, 'strftime') else str(session['started_at'])[:16]
            
            with st.expander(
                f"{status_icon} {session['track']} - {session['interview_type']} ({session['difficulty']}) - {started_at_str}"
            ):
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Questions", session['num_questions'])
                with col2:
                    st.metric("Status", session['status'])
                with col3:
                    st.metric("Track", session['track'].split("(")[0].strip()[:15])
                with col4:
                    st.metric("Difficulty", session['difficulty'].split()[0])
                
                # Load and display chat history
                if st.button(f"View Full Chat", key=f"view_{session_id}"):
                    session_details = db.get_session_details(session_id)
                    
                    st.divider()
                    st.subheader("Chat History")
                    
                    for msg in session_details['messages']:
                        if msg['role'] != 'system':
                            with st.chat_message(msg['role']):
                                st.markdown(msg['content'])
                                # Convert timestamp to local timezone
                                local_msg_time = utc_to_local(msg['timestamp'])
                                time_str = local_msg_time.strftime('%Y-%m-%d %I:%M:%S %p') if hasattr(local_msg_time, 'strftime') else str(msg['timestamp'])
                                st.caption(f"_{time_str}_")