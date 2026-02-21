import streamlit as st
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ─── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(page_title="AI Interview Simulator", page_icon="🤖", layout="centered")
st.title("🤖 AI-Powered Tech Interview Simulator")
st.caption("Practice SDE or Data Science interviews with AI-generated questions and feedback.")

# ─── Session State Init ────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
if "interview_started" not in st.session_state:
    st.session_state.interview_started = False
if "question_count" not in st.session_state:
    st.session_state.question_count = 0

# ─── Sidebar Config ────────────────────────────────────────────────────────────
with st.sidebar:
    st.header("⚙️ Interview Settings")
    track = st.selectbox("Career Track", ["Software Development Engineer (SDE)", "Data Science"])
    interview_type = st.selectbox("Interview Type", ["Technical", "Behavioral", "Mixed"])
    difficulty = st.selectbox("Difficulty", ["Entry Level", "Mid Level", "Senior Level"])
    num_questions = st.slider("Number of Questions", min_value=3, max_value=10, value=5)
    start_btn = st.button("🚀 Start Interview", use_container_width=True)
    if st.button("🔄 Reset", use_container_width=True):
        st.session_state.messages = []
        st.session_state.interview_started = False
        st.session_state.question_count = 0
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
if start_btn and not st.session_state.interview_started:
    st.session_state.interview_started = True
    st.session_state.question_count = 0
    system_prompt = build_system_prompt(track, interview_type, difficulty, num_questions)
    st.session_state.messages = [{"role": "system", "content": system_prompt}]

    with st.spinner("Starting your interview..."):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=st.session_state.messages
        )
        ai_msg = response.choices[0].message.content
        st.session_state.messages.append({"role": "assistant", "content": ai_msg})
        st.session_state.question_count += 1

# ─── Chat Display ──────────────────────────────────────────────────────────────
for msg in st.session_state.messages:
    if msg["role"] == "system":
        continue
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ─── User Input ────────────────────────────────────────────────────────────────
if st.session_state.interview_started:
    user_input = st.chat_input("Type your answer here...")
    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})
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
                st.markdown(ai_reply)
                st.session_state.question_count += 1
else:
    st.info("👈 Configure your interview settings in the sidebar and click **Start Interview** to begin.")