import { useState, useEffect, useRef, useCallback } from "react";
import { getProfile, updateUsername, updatePassword, deleteAccount, getResumes, deleteResume } from "../api";

/* ──────────────────────────────────────────
   Inline Canvas Cropper Modal
   - Drag to pan, slider to zoom
   - Outputs a circular 256×256 JPEG dataURL
 ────────────────────────────────────────── */
function CropModal({ src, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const SIZE = 320; // canvas display size
  const OUTPUT = 256; // output image size

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      // Center image initially
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
    };
  }, [src]);

  // Redraw on every zoom / offset change
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw image (centered + zoomed + offset)
    const w = img.width * zoom;
    const h = img.height * zoom;
    const x = SIZE / 2 - w / 2 + offset.x;
    const y = SIZE / 2 - h / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);

    // Dim outside the circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset]);

  useEffect(() => { draw(); }, [draw]);

  // Drag handlers
  const onMouseDown = (e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  const onMouseUp = () => { dragging.current = false; };

  // Touch drag
  const onTouchStart = (e) => {
    dragging.current = true;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Render to output canvas (circular crop)
    const out = document.createElement("canvas");
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext("2d");

    // Scale factors from display canvas → output canvas
    const scale = OUTPUT / SIZE;
    const w = img.width * zoom * scale;
    const h = img.height * zoom * scale;
    const x = OUTPUT / 2 - w / 2 + offset.x * scale;
    const y = OUTPUT / 2 - h / 2 + offset.y * scale;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);

    onConfirm(out.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a1007] text-center" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Crop your photo
          </h2>
          <p className="text-xs text-[#8a7060] text-center mt-1">Drag to reposition · Scroll or slide to zoom</p>
        </div>

        {/* Canvas */}
        <div className="relative rounded-full overflow-hidden shadow-lg cursor-grab active:cursor-grabbing select-none"
          style={{ width: SIZE, height: SIZE }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((z) => Math.min(6, Math.max(0.3, z - e.deltaY * 0.005)));
            }}
            className="block"
            style={{ borderRadius: "50%", touchAction: "none" }}
          />
        </div>

        {/* Zoom slider */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[#c2a882] text-lg">🔍</span>
          <input
            type="range"
            min="0.3"
            max="6"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-[#c84b2f]"
          />
          <span className="text-xs text-[#8a7060] font-bold w-10 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button onClick={onCancel}
            className="flex-1 bg-[#f0e8e0] hover:bg-[#e8ddd3] text-[#1a1007] font-bold py-3 rounded-xl text-sm transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex-1 bg-[#1a1007] hover:bg-[#2e1e10] text-[#fdf8f3] font-bold py-3 rounded-xl text-sm transition-all">
            Apply Photo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main Profile Page
 ────────────────────────────────────────── */
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resumes, setResumes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(localStorage.getItem("profilePhoto") || null);
  const [cropSrc, setCropSrc] = useState(null); // raw file dataURL → triggers crop modal
  const photoInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [resProfile, resResumes] = await Promise.all([
          getProfile(),
          getResumes()
        ]);
        setProfile(resProfile.data);
        setResumes(resResumes.data.resumes || []);
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

  // Open file picker → read to dataURL → show crop modal
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    // Reset input so same file can be picked again
    e.target.value = "";
  };

  const handleCropConfirm = (dataUrl) => {
    localStorage.setItem("profilePhoto", dataUrl);
    setProfilePhoto(dataUrl);
    setCropSrc(null);
    showMsg("success", "Profile photo updated!");
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return showMsg("error", "Username cannot be empty");
    setSaving(true);
    try {
      const res = await updateUsername(newUsername);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      setProfile((prev) => ({ ...prev, username: res.data.username }));
      setNewUsername(""); setActiveSection(null);
      showMsg("success", "Username updated!");
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) return showMsg("error", "Please fill in all fields");
    if (newPassword.length < 6) return showMsg("error", "New password must be at least 6 characters");
    if (newPassword !== confirmNewPassword) return showMsg("error", "New passwords do not match");
    setSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      setActiveSection(null);
      showMsg("success", "Password updated!");
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to update password");
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
      localStorage.removeItem("profilePhoto");
      window.location.href = "/login";
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to delete account");
      setSaving(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      await deleteResume(resumeId);
      setResumes((prev) => prev.filter(r => r.resume_id !== resumeId));
      showMsg("success", "Resume deleted");
    } catch (err) {
      showMsg("error", "Failed to delete resume");
    }
  };

  const inputClass = "w-full bg-white border border-[#e0d5c8] rounded-xl px-4 py-3 text-sm text-[#1a1007] placeholder-[#c2b5a6] outline-none focus:border-[#1a1007] focus:ring-2 focus:ring-[#1a1007]/10 transition-all font-medium";

  return (
    <div className="bg-[#fdf8f3] min-h-screen">
      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Profile Photo + Page Header */}
        <div className="mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {/* Circular Avatar with upload overlay */}
          <div className="relative shrink-0 group">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-lg hover:shadow-xl transition-all"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1a1007] flex items-center justify-center text-[#fdf8f3] font-bold text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {profile?.username ? profile.username[0].toUpperCase() : "?"}
                </div>
              )}
            </div>
            {/* Camera overlay */}
            <div
              onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-[10px] font-bold mt-1 uppercase tracking-wider">Change</span>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Title */}
          <div>
            <p className="text-[#c2a882] text-xs font-bold uppercase tracking-widest mb-3">Account</p>
            <h1 className="text-5xl lg:text-6xl text-[#1a1007] leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Your<br /><em className="not-italic text-[#c84b2f]">Profile.</em>
            </h1>
          </div>
        </div>

        {/* Feedback banner */}
        {msg.text && (
          <div className={`px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-2 mb-6 animate-fade-in ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            <span>{msg.type === "success" ? "✅" : "⚠️"}</span>
            {msg.text}
          </div>
        )}

        {/* Account Overview */}
        <div className="bg-white border border-[#e8ddd3] rounded-2xl p-8 shadow-sm mb-4">
          <h2 className="text-xs font-bold text-[#8a7060] uppercase tracking-widest mb-6 border-b border-[#f0e8e0] pb-3">Account Overview</h2>
          {loading ? (
            <div className="flex gap-1.5 pb-2">
              {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-[#c2a882] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-[#fdf8f3] border border-[#e8ddd3] rounded-xl p-4 flex items-center justify-between md:col-span-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a7060] block mb-0.5">Username</span>
                  <span className="text-base font-bold text-[#1a1007]">{profile?.username}</span>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#e8ddd3] shrink-0">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1007] flex items-center justify-center text-[#fdf8f3] font-bold text-sm">
                      {profile?.username ? profile.username[0].toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#fdf8f3] border border-[#e8ddd3] rounded-xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a7060] block mb-0.5">User ID</span>
                <span className="text-base font-bold text-[#6b584a] font-mono">#{profile?.user_id}</span>
              </div>
              <div className="bg-[#fdf8f3] border border-[#e8ddd3] rounded-xl p-4 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a7060] block mb-0.5">Member Since</span>
                <span className="text-sm font-semibold text-[#1a1007]">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Accordion Sections */}
        {[
          { id: "username", icon: "✏️", title: "Change Username", subtitle: "Update your public display name" },
          { id: "password", icon: "🔐", title: "Change Password", subtitle: "Secure your account with a new password" },
        ].map(({ id, icon, title, subtitle }) => (
          <div key={id} className="bg-white border border-[#e8ddd3] rounded-2xl overflow-hidden shadow-sm mb-4">
            <button
              onClick={() => setActiveSection(activeSection === id ? null : id)}
              className="w-full flex justify-between items-center px-6 py-5 hover:bg-[#fdf8f3] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#f0e8e0] flex items-center justify-center text-base border border-[#e0d5c8]">{icon}</div>
                <div>
                  <div className="text-sm font-bold text-[#1a1007] text-left group-hover:text-[#c84b2f] transition-colors">{title}</div>
                  <div className="text-xs text-[#8a7060] mt-0.5">{subtitle}</div>
                </div>
              </div>
              <span className="text-[#c2b5a6] font-black text-lg">{activeSection === id ? "−" : "+"}</span>
            </button>
            {activeSection === id && (
              <div className="px-6 pb-6 pt-2 border-t border-[#f0e8e0] animate-fade-in">
                <div className="space-y-3 mt-3">
                  {id === "username" ? (
                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="New username" className={inputClass} />
                  ) : (
                    <>
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className={inputClass} />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className={inputClass} />
                      <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" className={inputClass} />
                    </>
                  )}
                  <button
                    onClick={id === "username" ? handleUpdateUsername : handleUpdatePassword}
                    disabled={saving}
                    className="w-full bg-[#1a1007] hover:bg-[#2e1e10] disabled:opacity-50 text-[#fdf8f3] font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    {saving ? "Saving…" : id === "username" ? "Update Username" : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* My Resumes */}
        <div className="bg-white border border-[#e8ddd3] rounded-2xl overflow-hidden shadow-sm mb-4">
          <button
            onClick={() => setActiveSection(activeSection === "resumes" ? null : "resumes")}
            className="w-full flex justify-between items-center px-6 py-5 hover:bg-[#fdf8f3] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#f0e8e0] flex items-center justify-center text-base border border-[#e0d5c8]">📄</div>
              <div>
                <div className="text-sm font-bold text-[#1a1007] text-left group-hover:text-[#c84b2f] transition-colors">My Resumes</div>
                <div className="text-xs text-[#8a7060] mt-0.5">Manage your saved resumes</div>
              </div>
            </div>
            <span className="text-[#c2b5a6] font-black text-lg">{activeSection === "resumes" ? "−" : "+"}</span>
          </button>
          {activeSection === "resumes" && (
            <div className="px-6 pb-6 pt-2 border-t border-[#f0e8e0] animate-fade-in">
              {resumes.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-[#e8ddd3] rounded-xl text-sm text-[#8a7060]">
                  No resumes saved yet. You can upload one when starting a new interview.
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {resumes.map(r => (
                    <div key={r.resume_id} className="flex items-center justify-between p-4 bg-[#fdf8f3] border border-[#e8ddd3] rounded-xl group/res">
                      <div className="min-w-0 pr-4">
                        <div className="text-sm font-bold text-[#1a1007] truncate">{r.filename}</div>
                        <div className="text-[10px] text-[#8a7060] uppercase tracking-wider mt-1 font-semibold">
                          {new Date(r.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteResume(r.resume_id)}
                        className="w-8 h-8 flex items-center justify-center text-[#8a7060] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100 flex-shrink-0"
                        title="Delete Resume"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm mt-8">
          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="w-full flex justify-between items-center px-6 py-5 hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-base">⚠️</div>
              <div>
                <div className="text-sm font-bold text-red-600 text-left">Danger Zone: Delete Account</div>
                <div className="text-xs text-[#8a7060] mt-0.5">Permanently delete your account and all data</div>
              </div>
            </div>
            <span className="text-red-400 font-black text-lg">{showDeleteConfirm ? "−" : "+"}</span>
          </button>
          {showDeleteConfirm && (
            <div className="px-6 pb-6 pt-2 border-t border-red-100 animate-fade-in">
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-4 rounded-xl text-center mt-3">
                This is irreversible. All your interview history, stats, and profile data will be permanently deleted.
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={handleDeleteAccount} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm">
                  {saving ? "Deleting…" : "Yes, Delete Everything"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-[#f0e8e0] hover:bg-[#e8ddd3] text-[#1a1007] font-bold py-3 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
