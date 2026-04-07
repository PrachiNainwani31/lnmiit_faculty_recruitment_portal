import { Outlet, NavLink, useNavigate } from "react-router-dom";

const navStyle = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition mx-2 ${
    isActive
      ? "bg-white/20 text-white font-medium"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

export default function TravelPortalLayout() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-[#0c2340] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/12">
          <p className="text-white font-semibold text-sm">Travel Portal</p>
          <p className="text-white/50 text-xs mt-0.5">Registrar Office</p>
        </div>
        <nav className="flex-1 py-3 space-y-0.5">
          <NavLink to="/travel"              end className={navStyle}>📋 Expert Travel</NavLink>
          <NavLink to="/travel/quotes"          className={navStyle}>💰 Quotes</NavLink>
          <NavLink to="/travel/tickets"         className={navStyle}>🎫 Tickets</NavLink>
          <NavLink to="/travel/invoices"        className={navStyle}>🧾 Invoices</NavLink>
          <NavLink to="/travel/pickup"          className={navStyle}>🚗 Pickup / Drop-off</NavLink>
        </nav>
        <button
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="m-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 border border-white/20 transition"
        >
          Logout
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-6 h-14 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="font-semibold text-gray-800">Travel Portal</h2>
          <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">Establishment</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}