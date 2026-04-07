// layouts/Dofaofficelayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";

const navStyle = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition mx-2 ${
    isActive
      ? "bg-white/20 text-white font-medium"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

export default function DofaOfficeLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#6b0f1a] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-semibold text-sm">DOFA Office</p>
          <p className="text-white/50 text-xs mt-0.5">Faculty Recruitment Portal</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          <NavLink to="/dofa-office"               end className={navStyle}>Dashboard</NavLink>
          <NavLink to="/dofa-office/candidates"        className={navStyle}>Candidates</NavLink>
          <NavLink to="/dofa-office/document-tracking"  className={navStyle}>Document Tracking</NavLink>
          <NavLink to="/dofa-office/experts"           className={navStyle}>External Experts</NavLink>
          <NavLink to="/dofa-office/pickup"            className={navStyle}>Pickup / Drop-off</NavLink>
          <NavLink to="/dofa-office/select-candidates" className={navStyle}>Select Candidates</NavLink>
          <NavLink to="/dofa-office/room-allotment"    className={navStyle}>Room Allotment</NavLink>
          <NavLink to="/dofa-office/logs"              className={navStyle}>Interview Logs</NavLink>
          <NavLink to="/dofa-office/registration" className={navStyle}>Registration</NavLink>
        </nav>
        <button
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white border border-white/20 transition"
        >
          Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">DOFA Office Portal</h2>
          <span className="text-xs bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
            DOFA Office
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}