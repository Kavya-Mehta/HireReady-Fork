import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

// Auto-attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  API.post("/auth/login", { username, password });

export const signup = (username, password) =>
  API.post("/auth/signup", { username, password });

// ─── Interview ─────────────────────────────────────────────────────────────────
export const startInterview = (
  track,
  interview_type,
  difficulty,
  num_questions,
  resume_text,
  resume_filename,
) =>
  API.post("/interview/start", {
    track,
    interview_type,
    difficulty,
    num_questions,
    resume_text,
    resume_filename,
  });

export const startInterviewWithResume = (
  track,
  interview_type,
  difficulty,
  num_questions,
  file,
) => {
  const formData = new FormData();
  formData.append("track", track);
  formData.append("interview_type", interview_type);
  formData.append("difficulty", difficulty);
  formData.append("num_questions", String(num_questions));
  formData.append("file", file);
  return API.post("/interview/start-with-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const sendMessage = (
  session_id,
  messages,
  track,
  interview_type,
  difficulty,
  num_questions,
) =>
  API.post("/interview/chat", {
    session_id,
    messages,
    track,
    interview_type,
    difficulty,
    num_questions,
  });

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/resume/parse", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateSessionStatus = (session_id, status) =>
  API.patch(`/interview/session/${session_id}/status`, { status });

// ─── Profile ───────────────────────────────────────────────────────────────────
export const getProfile = () => API.get("/profile");

export const updateUsername = (new_username) =>
  API.put("/profile/username", { new_username });

export const updatePassword = (current_password, new_password) =>
  API.put("/profile/password", { current_password, new_password });

export const deleteAccount = () => API.delete("/profile");

// ─── History ───────────────────────────────────────────────────────────────────
export const getSessions = () => API.get("/history/sessions");

export const getSessionDetails = (session_id) =>
  API.get(`/history/session/${session_id}`);

export const getStats = () => API.get("/history/stats");
