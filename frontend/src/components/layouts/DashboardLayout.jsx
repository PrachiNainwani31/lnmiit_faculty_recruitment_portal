import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/lnmiit_logo.png";
import { logoutUser } from "../../auth";

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b2b4b] text-white flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-white/20">
          <img src={logo} className="h-10" />
          <span className="font-semibold text-sm">Faculty Recruitment</span>
        </div>

        <nav className="flex-1 p-3 space-y-2 text-sm">
          <NavLink to="/hod" className="block px-3 py-2 rounded hover:bg-white/10">
            Dashboard
          </NavLink>
          <NavLink to="/hod/candidates" className="block px-3 py-2 rounded hover:bg-white/10">
            Candidates
          </NavLink>
          <NavLink to="/hod/experts" className="block px-3 py-2 rounded hover:bg-white/10">
            Experts
          </NavLink>
          <NavLink to="/hod/notifications" className="block px-3 py-2 rounded hover:bg-white/10">
            Notifications
          </NavLink>
          <NavLink to="/hod/queries" className="block px-3 py-2 rounded hover:bg-white/10">
            DoFA Queries
          </NavLink>
        </nav>

        <button
          onClick={() => {
            logoutUser();
            navigate("/login");
          }}
          className="m-3 bg-red-600 py-2 rounded text-sm"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
