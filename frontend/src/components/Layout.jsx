import { useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const menuItems = [
    { path: "/", label: "📝 Interview" },
    { path: "/history", label: "📚 History" },
    { path: "/profile", label: "👤 Profile" },
  ];

  return (
    <div className="h-screen w-screen flex text-slate-100 overflow-hidden bg-slate-900 relative">
      {/* Global Animated Background */}
      <div className="fixed inset-0 bg-[linear-gradient(45deg,#0f172a,#1e1b4b,#312e81,#1e1b4b,#0f172a)] bg-[length:400%_400%] animate-gradient opacity-90 z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse z-0 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse z-0 pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Global Sidebar */}
      <div className="relative z-10 w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 gap-6 shadow-[8px_0_32px_0_rgba(0,0,0,0.3)] shrink-0 overflow-y-auto">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-4 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]">
          <img src="/logo.png" alt="HireReady Logo" className="w-12 h-12 object-contain" style={{ background: 'transparent' }} />
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 tracking-tight">HireReady</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`py-3 px-4 rounded-xl text-sm font-bold text-left transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-indigo-200/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* User Footer */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-sm text-indigo-200/80 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-shadow">
              {username ? username[0].toUpperCase() : "U"}
            </div>
            <span className="font-semibold">{username}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="text-xs bg-black/20 hover:bg-red-500/20 text-red-300 hover:text-red-200 px-3 py-2 rounded-lg transition-all border border-white/5 hover:border-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Page Area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}