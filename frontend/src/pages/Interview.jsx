import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview, sendMessage, updateSessionStatus } from "../api";

const TRACKS = ["Software Development Engineer (SDE)", "Data Science"];
const TYPES = ["Technical", "Behavioral", "Mixed"];
const DIFFICULTIES = ["Entry Level", "Mid Level", "Senior Level"];

export default function Interview() {
  const [track, setTrack] = useState(TRACKS[0]);
  const [interviewType, setInterviewType] = useState(TYPES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await startInterview(
        track,
        interviewType,
        difficulty,
        numQuestions,
      );
      setSessionId(res.data.session_id);
      setSessionConfig({ track, interviewType, difficulty, numQuestions });
      setMessages(res.data.messages.filter((m) => m.role !== "system"));
      setStarted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (sessionId) await updateSessionStatus(sessionId, "abandoned");
    setMessages([]);
    setStarted(false);
    setCompleted(false);
    setSessionId(null);
    setSessionConfig(null);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const allMessages = [
        { role: "system", content: buildSystemPrompt() },
        ...updatedMessages,
      ];
      const res = await sendMessage(
        sessionId,
        allMessages,
        sessionConfig.track,
        sessionConfig.interviewType,
        sessionConfig.difficulty,
        sessionConfig.numQuestions,
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.message },
      ]);
      if (res.data.completed) setCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildSystemPrompt = () => {
    if (!sessionConfig) return "";
    return `You are an expert technical interviewer conducting a ${sessionConfig.difficulty} ${sessionConfig.interviewType} interview for a ${sessionConfig.track} role. Ask one question at a time, provide feedback after each answer, and give a final evaluation after ${sessionConfig.numQuestions} questions.`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col p-5 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold text-white">HireReady</span>
        </div>

        {/* Nav Buttons */}
        <div className="flex flex-col gap-2">
          <button className="bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg">
            📝 Interview
          </button>
          <button
            onClick={() => navigate("/history")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            📚 History
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            👤 Profile
          </button>
        </div>

        <hr className="border-slate-700" />

        {/* Settings */}
        <div className="space-y-3 flex-1">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Career Track
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              disabled={started}
              className="w-full mt-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {TRACKS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              disabled={started}
              className="w-full mt-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={started}
              className="w-full mt-1 bg-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Questions: <span className="text-indigo-400">{numQuestions}</span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              disabled={started}
              className="w-full mt-1 accent-indigo-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>3</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!started ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-3 rounded-lg transition-all"
          >
            {loading ? "Starting..." : "🚀 Start Interview"}
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-lg transition-all"
          >
            🔄 Reset
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <button
            onClick={() => navigate("/profile")}
            className="text-sm text-slate-400 hover:text-white transition-all"
          >
            👤 {username}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <h1 className="text-lg font-bold text-white">
            {started
              ? `${sessionConfig.track} — ${sessionConfig.interviewType} (${sessionConfig.difficulty})`
              : "Configure your interview and click Start"}
          </h1>
          {completed && (
            <span className="text-sm text-green-400 font-semibold">
              ✅ Interview Complete!
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!started && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl font-semibold text-slate-400">
                  Ready to practice?
                </p>
                <p className="text-sm mt-2">
                  Configure your settings and click Start Interview
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-700 text-slate-100 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {started && !completed && (
          <div className="border-t border-slate-700 px-6 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                placeholder="Type your answer here..."
                className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-5 py-3 rounded-xl transition-all font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {completed && (
          <div className="border-t border-slate-700 px-6 py-4 flex gap-3">
            <button
              onClick={handleReset}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              🔄 Start New Interview
            </button>
            <button
              onClick={() => navigate("/history")}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              📚 View History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
