import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../api";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!username || !password) return setError("Please fill in all fields");
    if (tab === "signup") {
      if (password.length < 6) return setError("Password must be at least 6 characters");
      if (password !== confirmPassword) return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      const res = tab === "login" ? await login(username, password) : await signup(username, password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white border border-[#e0d5c8] rounded-xl px-4 py-3 text-sm text-[#1a1007] placeholder-[#c2b5a6] outline-none focus:border-[#1a1007] focus:ring-2 focus:ring-[#1a1007]/10 transition-all font-medium";

  return (
    <div className="min-h-screen bg-[#fdf8f3] flex flex-col lg:flex-row">
      {/* ─── Left Hero Panel ─── */}
      <div className="lg:w-1/2 bg-[#1a1007] flex flex-col justify-between p-12 lg:p-20 min-h-[50vh] lg:min-h-screen relative overflow-hidden">
        {/* subtle texture */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e07b39 0%, transparent 50%)`
        }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="HireReady" className="w-10 h-10 object-contain brightness-200" />
          <span className="text-[#fdf8f3] font-bold text-xl tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>HireReady</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <p className="text-[#c2a882] text-sm font-semibold uppercase tracking-widest mb-4">AI-Powered Interview Coach</p>
          <h1 className="text-5xl lg:text-6xl text-[#fdf8f3] leading-tight mb-8" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Nail your<br />
            <em className="text-[#f5a94f]">next</em><br />
            interview.
          </h1>
          <p className="text-[#8a7060] text-base leading-relaxed max-w-sm">
            Practice with an AI that asks the real questions and gives you honest feedback — so you walk in confident.
          </p>
        </div>

        {/* Bottom tag */}
        <div className="relative text-[#4a3a2a] text-xs font-medium">
          © {new Date().getFullYear()} HireReady
        </div>
      </div>

      {/* ─── Right Form Panel ─── */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-[#1a1007] mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {tab === "login" ? "Welcome back." : "Create your account."}
          </h2>
          <p className="text-[#8a7060] text-sm mb-8">
            {tab === "login" ? "Sign in to continue your practice." : "Start your interview prep journey today."}
          </p>

          {/* Tab Toggle */}
          <div className="flex bg-[#f0e8e0] rounded-xl p-1 mb-7">
            {["login", "signup"].map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? "bg-white text-[#1a1007] shadow-sm" : "text-[#8a7060] hover:text-[#1a1007]"
                }`}
              >
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8a7060] uppercase tracking-widest mb-1.5">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="your_username" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8a7060] uppercase tracking-widest mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="••••••••" className={inputClass} />
            </div>
            {tab === "signup" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-[#8a7060] uppercase tracking-widest mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="••••••••" className={inputClass} />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#1a1007] hover:bg-[#2e1e10] disabled:opacity-50 text-[#fdf8f3] font-bold py-3.5 rounded-xl transition-all text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing…
                </>
              ) : tab === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
