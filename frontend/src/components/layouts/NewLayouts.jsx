import { Outlet, NavLink, useNavigate } from "react-router-dom";

const mk = (active) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition mx-2 ${
    active
      ? "bg-white/20 text-white font-medium"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

/* ══════════════════════════
   DIRECTOR LAYOUT
══════════════════════════ */
export function DirectorLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#1a3a2a] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-semibold text-sm">Director's Office</p>
          <p className="text-white/50 text-xs mt-0.5">LNMIIT Recruitment & Onboarding Portal</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/director" end className={({ isActive }) => mk(isActive)}>Office Orders</NavLink>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 border border-white/20 transition">
          Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">Director's Office – LNMIIT Recruitment & Onboarding Portal</h2>
          <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-2.5 py-1 rounded-full font-medium">Director</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}

/* ══════════════════════════
   ESTABLISHMENT LAYOUT
══════════════════════════ */
export function EstablishmentLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#7c4a03] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-semibold text-sm">Establishment</p>
          <p className="text-white/50 text-xs mt-0.5">LNMIIT Recruitment & Onboarding Portal</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/establishment"           end className={({ isActive }) => mk(isActive)}>Dashboard</NavLink>
          <NavLink to="/establishment/onboarding"    className={({ isActive }) => mk(isActive)}>Offer & Joining Letters</NavLink>
          <NavLink to="/establishment/room-allotment" className={({ isActive }) => mk(isActive)}>Room Allotment</NavLink>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 border border-white/20 transition">
          Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">Establishment Section</h2>
          <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">Establishment</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}

/* ══════════════════════════
   ESTATE LAYOUT
══════════════════════════ */
export function EstateLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#6b1a5a] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-semibold text-sm">Estate Section</p>
          <p className="text-white/50 text-xs mt-0.5">LNMIIT Recruitment & Onboarding Portal</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/estate" end className={({ isActive }) => mk(isActive)}>Room Handovers</NavLink>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 border border-white/20 transition">
          Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">Estate Section</h2>
          <span className="text-xs bg-pink-100 text-pink-800 border border-pink-200 px-2.5 py-1 rounded-full font-medium">Estate</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}

/* ══════════════════════════
   LUCS LAYOUT
══════════════════════════ */
export function LucsLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#085041] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-semibold text-sm">LUCS</p>
          <p className="text-white/50 text-xs mt-0.5">LNMIIT Recruitment & Onboarding Portal</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/lucs" end className={({ isActive }) => mk(isActive)}>IT Asset Assignment</NavLink>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 border border-white/20 transition">
          Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">LUCS Portal</h2>
          <span className="text-xs bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full font-medium">LUCS</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}