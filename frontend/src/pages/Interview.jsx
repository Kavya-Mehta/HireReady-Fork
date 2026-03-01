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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex-1 flex flex-col bg-transparent">
      {/* Top Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-5 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-white tracking-wide">
          {started
            ? `${sessionConfig.track} — ${sessionConfig.interviewType} (${sessionConfig.difficulty})`
            : "Configure your interview and click Start"}
        </h1>
        {completed && (
          <span className="text-sm text-green-400 font-semibold animate-fade-in inline-block mt-1">
            ✅ Interview Complete!
          </span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Panel (Only shown when not started) */}
        {!started && (
          <div className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-sm p-6 flex flex-col gap-6 overflow-y-auto shrink-0 animate-fade-in relative z-10">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Settings</h2>
            
            <div className="space-y-5">
              <div className="group">
                <label className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-300 transition-colors">
                  Career Track
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full bg-black/30 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 transition-all font-medium appearance-none cursor-pointer"
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-300 transition-colors">
                  Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-black/30 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 transition-all font-medium appearance-none cursor-pointer"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-300 transition-colors">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-black/30 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 transition-all font-medium appearance-none cursor-pointer"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d} className="bg-slate-800 text-white">{d}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 block group-focus-within:text-indigo-300 transition-colors flex justify-between">
                  <span>Questions</span>
                  <span className="text-indigo-400 font-bold">{numQuestions}</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full mt-1 accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-indigo-200/50 mt-1 font-medium">
                  <span>3</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 ease-out transform active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Preparing..." : "🚀 Start Interview"}
            </button>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {!started && (
              <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center max-w-sm shadow-2xl">
                  <div className="w-24 h-24 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    <img src="/logo.png" alt="Ready" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to practice?</h2>
                  <p className="text-indigo-200/70 text-sm">
                    Configure your settings on the left and click Start Interview when you're ready to begin.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className={`max-w-[85%] md:max-w-2xl px-6 py-4 rounded-3xl text-[15px] leading-relaxed whitespace-pre-wrap shadow-md ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm border border-indigo-400/20"
                      : "bg-white/10 backdrop-blur-md text-slate-100 rounded-bl-sm border border-white/10"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && started && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl rounded-bl-sm border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>

          {/* Input Area */}
          {started && !completed && (
            <div className="p-6 bg-black/20 backdrop-blur-lg border-t border-white/10 shrink-0">
              <div className="max-w-4xl mx-auto flex gap-3 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your answer here... (Press Enter to send)"
                  className="flex-1 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 placeholder-indigo-200/40 text-[15px] resize-none overflow-hidden min-h-[56px] max-h-32 transition-all"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/30 disabled:border disabled:border-white/5 text-white px-8 rounded-2xl transition-all font-bold shadow-lg shadow-indigo-500/25 disabled:shadow-none flex items-center justify-center shrink-0"
                >
                  Send
                </button>
              </div>
              <div className="max-w-4xl mx-auto mt-4 text-center">
                 <button
                  onClick={handleReset}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30"
                >
                  End Interview Early
                </button>
              </div>
            </div>
          )}

          {/* Post-Interview Actions */}
          {completed && (
            <div className="p-6 bg-black/20 backdrop-blur-lg border-t border-white/10 shrink-0">
               <div className="max-w-4xl mx-auto flex justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]"
                >
                  🔄 Start New Interview
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold border border-white/20 px-8 py-3.5 rounded-xl transition-all"
                >
                  📚 View History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
