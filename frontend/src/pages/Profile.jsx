import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

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
      navigate("/login");
    } catch (err) {
      showMsg(
        "error",
        err.response?.data?.detail || "Failed to delete account",
      );
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col p-5 gap-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <span className="text-xl font-bold text-white">HireReady</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            📝 Interview
          </button>
          <button
            onClick={() => navigate("/history")}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            📚 History
          </button>
          <button className="bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg">
            👤 Profile
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-700">
          <span className="text-sm text-slate-400">👤 {username}</span>
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
          <h1 className="text-lg font-bold text-white">👤 My Profile</h1>
          <p className="text-sm text-slate-400">Manage your account settings</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl space-y-4">
          {/* Feedback Message */}
          {msg.text && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                msg.type === "success"
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-red-500/20 border border-red-500/50 text-red-400"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Account Info
            </h2>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Username</span>
                  <span className="text-sm font-semibold text-white">
                    {profile?.username}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">User ID</span>
                  <span className="text-sm font-semibold text-white">
                    #{profile?.user_id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Member Since</span>
                  <span className="text-sm font-semibold text-white">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Change Username */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() =>
                setActiveSection(
                  activeSection === "username" ? null : "username",
                )
              }
              className="w-full flex justify-between items-center px-5 py-4 hover:bg-slate-750 transition-all"
            >
              <div>
                <div className="text-sm font-semibold text-white text-left">
                  Change Username
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Update your display name
                </div>
              </div>
              <span className="text-slate-400">
                {activeSection === "username" ? "▲" : "▼"}
              </span>
            </button>
            {activeSection === "username" && (
              <div className="border-t border-slate-700 px-5 py-4 space-y-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                />
                <button
                  onClick={handleUpdateUsername}
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                >
                  {saving ? "Saving..." : "Update Username"}
                </button>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() =>
                setActiveSection(
                  activeSection === "password" ? null : "password",
                )
              }
              className="w-full flex justify-between items-center px-5 py-4 hover:bg-slate-750 transition-all"
            >
              <div>
                <div className="text-sm font-semibold text-white text-left">
                  Change Password
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Update your login password
                </div>
              </div>
              <span className="text-slate-400">
                {activeSection === "password" ? "▲" : "▼"}
              </span>
            </button>
            {activeSection === "password" && (
              <div className="border-t border-slate-700 px-5 py-4 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 text-sm"
                />
                <button
                  onClick={handleUpdatePassword}
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                >
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="bg-slate-800 border border-red-900/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="w-full flex justify-between items-center px-5 py-4 hover:bg-red-900/10 transition-all"
            >
              <div>
                <div className="text-sm font-semibold text-red-400 text-left">
                  Delete Account
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Permanently delete your account and all data
                </div>
              </div>
              <span className="text-slate-400">
                {showDeleteConfirm ? "▲" : "▼"}
              </span>
            </button>
            {showDeleteConfirm && (
              <div className="border-t border-red-900/50 px-5 py-4 space-y-3">
                <p className="text-sm text-red-400">
                  ⚠️ This will permanently delete your account, all interview
                  sessions, and chat history. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-semibold py-2.5 rounded-lg transition-all text-sm"
                  >
                    {saving ? "Deleting..." : "Yes, Delete My Account"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2.5 rounded-lg transition-all text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
