// layouts/HodLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentCycle } from "../../api/hodApi";
import NotificationBell from "../../components/notifications/NotificationBell";

const NAV_ITEMS = [
  { to: "/hod",            label: "Dashboard", end: true },
  { to: "/hod/candidates", label: "Candidates" },
  { to: "/hod/experts",    label: "Experts" },
  { to: "/hod/comments",   label: "Comments" },
  { to: "/hod/logs",       label: "Logs" },
];

const STATUS_CONFIG = {
  DRAFT:              { label: "Draft",                       dot: "bg-gray-400",   badge: "bg-gray-100   text-gray-600   border-gray-300"   },
  SUBMITTED:          { label: "Submitted",                   dot: "bg-blue-400",   badge: "bg-blue-50    text-blue-700   border-blue-200"   },
  QUERY:              { label: "Query from DOFA",             dot: "bg-amber-400",  badge: "bg-amber-50   text-amber-700  border-amber-200"  },
  APPROVED:           { label: "Approved",                    dot: "bg-green-400",  badge: "bg-green-50   text-green-700  border-green-200"  },
  INTERVIEW_SET:      { label: "Interview Scheduled",         dot: "bg-indigo-400", badge: "bg-indigo-50  text-indigo-700 border-indigo-200" },
  APPEARED_SUBMITTED: { label: "Appeared Submitted",          dot: "bg-violet-400", badge: "bg-violet-50  text-violet-700 border-violet-200" },
};

export default function HodLayout() {
  const navigate = useNavigate();
  const [cycle,    setCycle]    = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchCycle = async () => {
    try {
      const res = await getCurrentCycle();
      setCycle(res.data);
      setIsFrozen(res.data.isFrozen);
    } catch {}
  };

  useEffect(() => {
    fetchCycle();
    window.addEventListener("hod-refresh", fetchCycle);
    return () => window.removeEventListener("hod-refresh", fetchCycle);
  }, []);

  const status = STATUS_CONFIG[cycle?.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-sm">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow">
              {user.department?.slice(0, 2) || "HD"}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">HoD Portal</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.department || "Department"}</p>
            </div>
          </div>
        </div>

        {/* Cycle status chip */}
        {cycle && (
          <div className="mx-4 mt-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${status.badge}`}>
              <span className={`w-2 h-2 rounded-full ${status.dot} shrink-0`} />
              Session 2025–26 · {status.label}
            </div>
          </div>
        )}

        {/* Interview dates — shown when DOFA has set them */}
        {(cycle?.interviewDate || cycle?.teachingInteractionDate) && (
          <div className="mx-4 mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 space-y-2">
            {cycle.teachingInteractionDate && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">Teaching</p>
                  <p className="text-xs font-bold text-indigo-700">
                    {new Date(cycle.teachingInteractionDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {cycle.interviewDate && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Interview</p>
                  <p className="text-xs font-bold text-green-700">
                    {new Date(cycle.interviewDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">
              {user.name?.slice(0, 2)?.toUpperCase() || "DR"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.name || "Head of Dept."}</p>
              <p className="text-xs text-gray-400 truncate">{user.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate("/login"); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition"
          >
            <span>→</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Frozen banner */}
        {isFrozen && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs text-center py-2 font-medium">
             Cycle submitted — editing is locked until DoFA responds
          </div>
        )}

        {/* Interview-set banner — prompt HOD to mark appeared */}
        {cycle?.status === "INTERVIEW_SET" && !isFrozen && (
          <div className="bg-indigo-50 border-b border-indigo-200 text-indigo-700 text-xs text-center py-2 font-medium">
            📅 Interview scheduled by DOFA — please mark appeared candidates and submit
          </div>
        )}

        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ isFrozen, cycleData: cycle }} />
        </main>
      </div>
    </div>
  );
}