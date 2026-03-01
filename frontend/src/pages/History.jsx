import { useState, useEffect } from "react";
import { getSessions, getSessionDetails, getStats } from "../api";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState({});
  const [loading, setLoading] = useState(true);

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
    <div className="flex-1 flex flex-col bg-transparent relative z-10 w-full overflow-hidden">
      {/* Top Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-5 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-white tracking-wide">📚 Interview History</h1>
        <p className="text-sm text-indigo-200/70 mt-1">
          Review your past sessions and track your progress
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main Content (History List) */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          {loading && (
             <div className="flex items-center justify-center h-40">
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
          )}
          
          {!loading && sessions.length === 0 && (
            <div className="flex items-center justify-center h-full animate-fade-in">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl text-center max-w-sm">
                <div className="text-6xl mb-6">📭</div>
                <h2 className="text-xl font-bold text-white mb-2">No interviews yet!</h2>
                <p className="text-indigo-200/70 text-sm">
                  Head over to the Interview tab to start your first session and see your history here.
                </p>
              </div>
            </div>
          )}

          {sessions.map((session) => (
            <div
              key={session.session_id}
              className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg animate-slide-up hover:border-indigo-500/30 transition-colors"
            >
              <button
                onClick={() => handleExpand(session.session_id)}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl drop-shadow-md">{statusIcon(session.status)}</span>
                  <div>
                    <div className="text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {trackLabel(session.track)} — {session.interview_type}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-indigo-200/60 mt-1 font-medium">
                       <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          {session.difficulty}
                       </span>
                       <span>•</span>
                      {formatDate(session.started_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5 ${statusColor(session.status)}`}>
                    {session.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-indigo-200/50 text-xl group-hover:text-indigo-300 transition-colors">
                    {expandedId === session.session_id ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {expandedId === session.session_id && (
                <div className="border-t border-white/10 px-6 py-5 bg-black/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-black text-white">{session.num_questions}</div>
                      <div className="text-xs text-indigo-200/60 mt-1 font-bold uppercase tracking-wider">Questions</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                      <div className={`text-lg font-black mt-1 ${statusColor(session.status)}`}>{session.status.split("_").join("\n").toUpperCase()}</div>
                      <div className="text-xs text-indigo-200/60 mt-1 font-bold uppercase tracking-wider">Status</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                      <div className="text-sm font-bold text-white">{trackLabel(session.track)}</div>
                      <div className="text-xs text-indigo-200/60 mt-1 font-bold uppercase tracking-wider">Track</div>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center flex flex-col justify-center">
                      <div className="text-sm font-bold text-white">{session.difficulty}</div>
                      <div className="text-xs text-indigo-200/60 mt-1 font-bold uppercase tracking-wider">Difficulty</div>
                    </div>
                  </div>

                  {sessionDetails[session.session_id] && (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest sticky top-0 bg-slate-900/80 backdrop-blur-sm py-2 z-10">
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
                              className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap shadow-md ${
                                msg.role === "user"
                                  ? "bg-indigo-600/80 text-white rounded-br-sm border border-indigo-400/20"
                                  : "bg-white/10 backdrop-blur-md text-slate-100 rounded-bl-sm border border-white/10"
                              }`}
                            >
                              {msg.content}
                              <div className="text-[10px] opacity-50 mt-2 font-medium text-right">
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

        {/* Stats Sidebar (Right side) */}
        <div className="w-full md:w-80 bg-black/20 backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col gap-6 shrink-0 z-10">
          <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Performance Stats</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-2xl p-4 text-center border border-indigo-500/30 shadow-lg">
              <div className="text-3xl font-black text-white drop-shadow-md">
                {stats.total_sessions || 0}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-200/80 mt-1">Total</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-900/80 to-teal-900/80 rounded-2xl p-4 text-center border border-emerald-500/30 shadow-lg">
              <div className="text-3xl font-black text-emerald-400 drop-shadow-md">
                {stats.completed_sessions || 0}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-200/80 mt-1">Completed</div>
            </div>
          </div>

          {stats.by_track && Object.keys(stats.by_track).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold text-indigo-200/60 uppercase tracking-widest border-b border-white/10 pb-2">
                By Track
              </div>
              {Object.entries(stats.by_track).map(([t, count]) => (
                <div key={t} className="flex justify-between items-center text-sm font-medium pt-1">
                  <span className="text-slate-200">{trackLabel(t)}</span>
                  <span className="bg-white/10 text-white px-2.5 py-0.5 rounded-lg border border-white/10 font-bold">{count}</span>
                </div>
              ))}
            </div>
          )}

          {stats.by_difficulty && Object.keys(stats.by_difficulty).length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                 <div className="text-xs font-bold text-indigo-200/60 uppercase tracking-widest border-b border-white/10 pb-2">
                  By Difficulty
                </div>
                {Object.entries(stats.by_difficulty).map(([d, count]) => (
                  <div key={d} className="flex justify-between items-center text-sm font-medium pt-1">
                    <span className="text-slate-200">{d.split(" ")[0]}</span>
                    <span className="bg-white/10 text-white px-2.5 py-0.5 rounded-lg border border-white/10 font-bold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
