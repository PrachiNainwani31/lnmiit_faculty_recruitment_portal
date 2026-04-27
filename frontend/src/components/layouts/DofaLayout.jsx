// layouts/DofaLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dofa",                   label: "Dashboard", end: true },
  { to: "/dofa/candidates",        label: "Candidates"},
  { to: "/dofa/experts",           label: "Experts" },
  { to: "/dofa/document-tracking", label: "Document Tracking" },
  { to: "/dofa/quote-approval",    label: "Quote Approval" },
  { to: "/dofa/comments",          label: "Comments" },
  { to: "/dofa/logs", label: "Logs" },
];
const now = new Date();
const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
const cycleYear = `${startYear}–${String(startYear + 1).slice(2)}`;

export default function DofaLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className="w-60 bg-[#0f1f3d] flex flex-col shrink-0">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow">
              DF
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Welcome DoFA</p>
              <p className="text-white/40 text-xs mt-0.5">Dean of Faculty Affairs</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-4 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-semibold"
                    : "text-white/55 hover:bg-white/8 hover:text-white/90"
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.slice(0,2)?.toUpperCase() || "DA"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user.role === "ADoFA" ? "ADoFA" : "DoFA"}</p>
              <p className="text-xs text-white/40 truncate">{user.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate("/login"); }}
            className="w-full py-2 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <h2 className="font-semibold text-gray-800 text-sm">Faculty Recruitment · {cycleYear}</h2>
          <span className="text-xs bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-medium">
            DoFA
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}