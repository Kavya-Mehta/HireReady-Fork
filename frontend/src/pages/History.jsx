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
        const [sessRes, statRes] = await Promise.all([getSessions(), getStats()]);
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
      } catch (err) { console.error(err); }
    }
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString() : "";
  const statusStyle = (s) => ({
    completed: "bg-emerald-50 border-emerald-200 text-emerald-700",
    in_progress: "bg-amber-50 border-amber-200 text-amber-700",
  }[s] || "bg-red-50 border-red-200 text-red-600");
  const statusIcon = (s) => s === "completed" ? "✅" : s === "in_progress" ? "⏸️" : "❌";

  return (
    <div className="bg-[#fdf8f3] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Page Header */}
        <div className="mb-12">
          <p className="text-[#c2a882] text-xs font-bold uppercase tracking-widest mb-3">Your Progress</p>
          <h1 className="text-5xl lg:text-6xl text-[#1a1007] leading-tight mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Interview<br /><em className="not-italic text-[#c84b2f]">History.</em>
          </h1>
          <p className="text-[#8a7060] text-base">Review your past sessions and see how far you've come.</p>
        </div>

        {/* Stats Row */}
        {!loading && (stats.total_sessions > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Total Sessions", value: stats.total_sessions || 0, accent: "" },
              { label: "Completed", value: stats.completed_sessions || 0, accent: "text-emerald-600" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-white border border-[#e8ddd3] rounded-2xl p-5 shadow-sm">
                <div className={`text-3xl font-black ${accent || "text-[#1a1007]"}`}>{value}</div>
                <div className="text-xs text-[#8a7060] font-semibold uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex gap-1.5">
              {[0, 150, 300].map((d) => <span key={d} className="w-2.5 h-2.5 bg-[#c2a882] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div className="bg-white border border-[#e8ddd3] rounded-2xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-5">📭</div>
            <h2 className="text-2xl font-bold text-[#1a1007] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>No interviews yet.</h2>
            <p className="text-[#8a7060]">Head over to the Interview tab to start your first session.</p>
          </div>
        )}

        {/* Session list */}
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div key={session.session_id}
              className="bg-white border border-[#e8ddd3] rounded-2xl overflow-hidden shadow-sm hover:border-[#d4c5b5] transition-all animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <button
                onClick={() => handleExpand(session.session_id)}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-[#fdf8f3] transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{statusIcon(session.status)}</span>
                  <div>
                    <div className="text-sm font-bold text-[#1a1007] group-hover:text-[#c84b2f] transition-colors">
                      {session.interview_type}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#8a7060]">
                      <span className="bg-[#f0e8e0] text-[#6b584a] px-2 py-0.5 rounded-full border border-[#e0d5c8] font-medium">{session.difficulty}</span>
                      <span>·</span>
                      <span>{formatDate(session.started_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusStyle(session.status)}`}>
                    {session.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-[#c2b5a6] text-sm">{expandedId === session.session_id ? "▲" : "▼"}</span>
                </div>
              </button>

              {expandedId === session.session_id && (
                <div className="border-t border-[#f0e8e0] px-6 py-6 bg-[#fdf8f3]">
                  {/* Mini stats */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Questions", val: session.num_questions },
                      { label: "Difficulty", val: session.difficulty.split(" ")[0] },
                      { label: "Status", val: session.status.replace("_", " ") },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-white rounded-xl p-3 text-center border border-[#e8ddd3]">
                        <div className="text-sm font-black text-[#1a1007] capitalize">{val}</div>
                        <div className="text-[10px] text-[#8a7060] uppercase tracking-wider mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chat history */}
                  {sessionDetails[session.session_id] && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#c2a882] uppercase tracking-widest pb-2 border-b border-[#e8ddd3]">Chat History</div>
                      {sessionDetails[session.session_id].messages
                        .filter((m) => m.role !== "system")
                        .map((msg, j) => (
                          <div key={j} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                              msg.role === "user"
                                ? "bg-[#1a1007] text-[#fdf8f3] rounded-tr-sm"
                                : "bg-white text-[#1a1007] border border-[#e8ddd3] rounded-tl-sm"
                            }`}>
                              {msg.content}
                              <div className="opacity-40 mt-1.5 font-medium text-[10px]">{formatDate(msg.timestamp)}</div>
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
