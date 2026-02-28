import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSessions, getSessionDetails, getStats } from "../api";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, statRes] = await Promise.all([
          getSessions(),
          getStats(),
        ]);
        setSessions(sessRes.data.sessions);
        setStats(statRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExpand = async (id) => {
    if (expandedId === id) return setExpandedId(null);
    setExpandedId(id);
    if (!sessionDetails[id]) {
      try {
        const res = await getSessionDetails(id);
        setSessionDetails((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString();
  };

  const trackLabel = (track) => (track?.includes("Software") ? "SDE" : "DS");

  const statusColor = (status) => {
    if (status === "completed") return "text-green-400";
    if (status === "in_progress") return "text-yellow-400";
    return "text-red-400";
  };

  const statusIcon = (status) => {
    if (status === "completed") return "✅";
    if (status === "in_progress") return "⏸️";
    return "❌";
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col p-5 gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold text-white">HireReady</span>
        </div>

        {/* Nav Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            📝 Interview
          </button>
          <button className="bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg">
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

        {/* Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Your Stats
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">
                {stats.total_sessions || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total</div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.completed_sessions || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Completed</div>
            </div>
          </div>

          {stats.by_track && Object.keys(stats.by_track).length > 0 && (
            <div className="bg-slate-700 rounded-xl p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase">
                By Track
              </div>
              {Object.entries(stats.by_track).map(([t, count]) => (
                <div key={t} className="flex justify-between text-sm">
                  <span className="text-slate-300">{trackLabel(t)}</span>
                  <span className="text-indigo-400 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}

          {stats.by_difficulty &&
            Object.keys(stats.by_difficulty).length > 0 && (
              <div className="bg-slate-700 rounded-xl p-3 space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  By Difficulty
                </div>
                {Object.entries(stats.by_difficulty).map(([d, count]) => (
                  <div key={d} className="flex justify-between text-sm">
                    <span className="text-slate-300">{d.split(" ")[0]}</span>
                    <span className="text-indigo-400 font-semibold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-700">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <h1 className="text-lg font-bold text-white">📚 Interview History</h1>
          <p className="text-sm text-slate-400">
            Times shown in your local timezone
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading && (
            <div className="text-center text-slate-400 mt-20">Loading...</div>
          )}
          {!loading && sessions.length === 0 && (
            <div className="text-center mt-20">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-400">
                No interviews yet. Start your first one!
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-lg transition-all"
              >
                Start Interview
              </button>
            </div>
          )}

          {sessions.map((session) => (
            <div
              key={session.session_id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => handleExpand(session.session_id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-750 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span>{statusIcon(session.status)}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {trackLabel(session.track)} — {session.interview_type} (
                      {session.difficulty})
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatDate(session.started_at)}
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 text-lg">
                  {expandedId === session.session_id ? "▲" : "▼"}
                </span>
              </button>

              {expandedId === session.session_id && (
                <div className="border-t border-slate-700 px-5 py-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-700 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">
                        {session.num_questions}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-semibold">
                        Questions
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3 text-center">
                      <div
                        className={`text-lg font-bold ${statusColor(session.status)}`}
                      >
                        {session.status}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-semibold">
                        Status
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">
                        {trackLabel(session.track)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-semibold">
                        Track
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">
                        {session.difficulty.split(" ")[0]}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-semibold">
                        Difficulty
                      </div>
                    </div>
                  </div>

                  {session.resume_filename && (
                    <div className="mb-4 text-sm text-slate-300">
                      Resume: <span className="text-indigo-300">{session.resume_filename}</span>
                    </div>
                  )}

                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => navigate(`/?sessionId=${session.session_id}`)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                    >
                      Continue Chat
                    </button>
                  </div>

                  {sessionDetails[session.session_id] && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="text-xs font-semibold text-slate-400 uppercase">
                        Chat History
                      </div>
                      {sessionDetails[session.session_id].messages
                        .filter((m) => m.role !== "system")
                        .map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-lg px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                                msg.role === "user"
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-700 text-slate-100"
                              }`}
                            >
                              {msg.content}
                              <div className="text-xs opacity-50 mt-1">
                                {formatDate(msg.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
