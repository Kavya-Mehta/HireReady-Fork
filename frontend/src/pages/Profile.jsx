import { useState, useEffect } from "react";
import {
  getProfile,
  updateUsername,
  updatePassword,
  deleteAccount,
} from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim())
      return showMsg("error", "Username cannot be empty");
    setSaving(true);
    try {
      const res = await updateUsername(newUsername);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      setProfile((prev) => ({ ...prev, username: res.data.username }));
      setNewUsername("");
      setActiveSection(null);
      showMsg("success", "Username updated successfully!");
    } catch (err) {
      showMsg(
        "error",
        err.response?.data?.detail || "Failed to update username",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword)
      return showMsg("error", "Please fill in all fields");
    if (newPassword.length < 6)
      return showMsg("error", "New password must be at least 6 characters");
    if (newPassword !== confirmNewPassword)
      return showMsg("error", "New passwords do not match");
    setSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setActiveSection(null);
      showMsg("success", "Password updated successfully!");
    } catch (err) {
      showMsg(
        "error",
        err.response?.data?.detail || "Failed to update password",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteAccount();
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/login";
    } catch (err) {
      showMsg(
        "error",
        err.response?.data?.detail || "Failed to delete account",
      );
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent relative z-10 w-full overflow-hidden">
      {/* Top Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-5 shadow-sm shrink-0">
        <h1 className="text-xl font-bold text-white tracking-wide">👤 My Profile</h1>
        <p className="text-sm text-indigo-200/70 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex justify-center custom-scrollbar">
        <div className="w-full max-w-2xl space-y-6 animate-slide-up">
          
          {/* Feedback Message */}
          {msg.text && (
            <div
              className={`px-5 py-4 rounded-2xl text-[15px] font-bold shadow-lg flex items-center gap-3 animate-fade-in ${
                msg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              <span className="text-xl">
                 {msg.type === "success" ? "✅" : "⚠️"}
              </span>
              {msg.text}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full blur-2xl"></div>
            
            <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-6 border-b border-white/10 pb-3">
              Account Overview
            </h2>
            
            {loading ? (
               <div className="flex items-center gap-1.5 animate-fade-in pb-4">
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50 block mb-1">Username</span>
                    <span className="text-lg font-bold text-white tracking-wide">
                      {profile?.username}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                    {profile?.username ? profile.username[0].toUpperCase() : "U"}
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50 block mb-1">User ID</span>
                    <span className="text-lg font-bold text-slate-300 font-mono">
                      #{profile?.user_id}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between md:col-span-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200/50 block mb-1">Member Since</span>
                    <span className="text-[15px] font-bold text-white">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString(undefined, {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Username */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all">
            <button
              onClick={() => setActiveSection(activeSection === "username" ? null : "username")}
              className="w-full flex justify-between items-center px-8 py-6 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl group-hover:bg-indigo-500/40 transition-colors border border-indigo-500/30">
                  ✏️
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white text-left group-hover:text-indigo-200 transition-colors">
                    Change Username
                  </div>
                  <div className="text-xs text-indigo-200/50 mt-1 font-medium">
                    Update your public display name
                  </div>
                </div>
              </div>
              <span className="text-indigo-200/50 font-black group-hover:text-indigo-300 transition-colors text-lg">
                {activeSection === "username" ? "−" : "+"}
              </span>
            </button>
            {activeSection === "username" && (
              <div className="px-8 pb-8 pt-2 animate-fade-in">
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 block mb-2 ml-1">New Username</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      className="w-full bg-white/5 text-white rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500/50 border border-white/10 focus:bg-white/10 transition-all font-medium placeholder-white/30"
                    />
                  </div>
                  <button
                    onClick={handleUpdateUsername}
                    disabled={saving}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-white/50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] disabled:shadow-none"
                  >
                    {saving ? "Saving Changes..." : "Update Username"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all">
            <button
              onClick={() => setActiveSection(activeSection === "password" ? null : "password")}
               className="w-full flex justify-between items-center px-8 py-6 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl group-hover:bg-purple-500/40 transition-colors border border-purple-500/30">
                  🔐
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white text-left group-hover:text-purple-200 transition-colors">
                    Change Password
                  </div>
                  <div className="text-xs text-indigo-200/50 mt-1 font-medium">
                    Secure your account with a new login password
                  </div>
                </div>
              </div>
              <span className="text-indigo-200/50 font-black group-hover:text-purple-300 transition-colors text-lg">
                {activeSection === "password" ? "−" : "+"}
              </span>
            </button>
            {activeSection === "password" && (
              <div className="px-8 pb-8 pt-2 animate-fade-in">
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 block mb-2 ml-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 text-white rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 focus:bg-white/10 transition-all font-medium placeholder-white/20"
                    />
                  </div>
                  <div className="group">
                     <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 block mb-2 ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-white/5 text-white rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 focus:bg-white/10 transition-all font-medium placeholder-white/30"
                    />
                  </div>
                  <div className="group">
                     <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 block mb-2 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-white/5 text-white rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 focus:bg-white/10 transition-all font-medium placeholder-white/30"
                    />
                  </div>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all mt-2 shadow-[0_4px_14px_0_rgba(168,85,247,0.39)] disabled:shadow-none"
                  >
                    {saving ? "Saving Changes..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-3xl overflow-hidden shadow-xl transition-all mt-10">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
               className="w-full flex justify-between items-center px-8 py-6 hover:bg-red-500/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl group-hover:bg-red-500/40 transition-colors border border-red-500/30">
                  ⚠️
                </div>
                <div>
                  <div className="text-[15px] font-bold text-red-400 text-left group-hover:text-red-300 transition-colors">
                    Danger Zone: Delete Account
                  </div>
                  <div className="text-xs text-red-400/60 mt-1 font-medium">
                    Permanently delete your account and all data
                  </div>
                </div>
              </div>
              <span className="text-red-400/50 font-black group-hover:text-red-400 transition-colors text-lg">
                {showDeleteConfirm ? "−" : "+"}
              </span>
            </button>
            {showDeleteConfirm && (
              <div className="px-8 pb-8 pt-2 animate-fade-in border-t border-red-500/20 mt-2">
                <div className="space-y-5 pt-4">
                  <p className="text-sm font-bold text-red-300 bg-red-950/40 p-4 rounded-xl border border-red-500/20 text-center">
                    This action is irreversible. All your interview history, stats, and profile data will be permanently wiped.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={saving}
                      className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] disabled:shadow-none"
                    >
                      {saving ? "Deleting..." : "Yes, Delete Everything"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all border border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
