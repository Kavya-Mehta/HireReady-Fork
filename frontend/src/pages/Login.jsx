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
      if (password.length < 6)
        return setError("Password must be at least 6 characters");
      if (password !== confirmPassword)
        return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      const res =
        tab === "login"
          ? await login(username, password)
          : await signup(username, password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-900">
      {/* Animated Deep Space Gradient Background */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#0f172a,#1e1b4b,#312e81,#1e1b4b,#0f172a)] bg-[length:400%_400%] animate-gradient opacity-90"></div>
      
      {/* Abstract Glowing Orbs for ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="mb-4 inline-block drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <img src="/logo.png" alt="HireReady Logo" className="w-24 h-24 mx-auto object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 tracking-tight">
            HireReady
          </h1>
          <p className="text-indigo-200/80 mt-3 font-medium tracking-wide">
            Your AI-Powered Interview Coach
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-fade-in relative overflow-hidden">
          
          {/* Subtle inner glow for the card */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"></div>

          {/* Tabs */}
          <div className="flex bg-black/20 backdrop-blur-md rounded-2xl p-1.5 mb-8 shadow-inner border border-white/5">
            <button
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out ${
                tab === "login"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-100"
                  : "text-indigo-200/60 hover:text-white hover:bg-white/5 scale-95"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setTab("signup");
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out ${
                tab === "signup"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-100"
                  : "text-indigo-200/60 hover:text-white hover:bg-white/5 scale-95"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-indigo-300 transition-colors">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your username"
                className="w-full bg-black/20 text-white border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-black/30 placeholder-indigo-200/30 transition-all font-medium"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-indigo-300 transition-colors">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your password"
                className="w-full bg-black/20 text-white border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-black/30 placeholder-indigo-200/30 transition-all font-medium"
              />
            </div>

            {tab === "signup" && (
              <div className="group animate-fade-in">
                <label className="block text-xs font-semibold text-indigo-200/80 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-indigo-300 transition-colors">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Re-enter your password"
                  className="w-full bg-black/20 text-white border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-black/30 placeholder-indigo-200/30 transition-all font-medium"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in flex items-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 bg-white text-indigo-900 hover:bg-indigo-50 disabled:bg-white/50 disabled:cursor-not-allowed disabled:text-indigo-900/50 font-bold py-3.5 rounded-xl transition-all duration-300 ease-out transform active:scale-[0.98] shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)]"
            >
              {loading
                ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                )
                : tab === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

