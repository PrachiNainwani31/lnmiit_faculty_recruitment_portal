import { NavLink } from "react-router-dom";

export default function SidebarLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">Institute Portal</h1>
          <p className="text-sm text-gray-500">HoD Management</p>
        </div>

        <nav className="mt-4">
          <NavLink to="/hod" className="menu-item">Dashboard</NavLink>
          <NavLink to="/hod/candidates" className="menu-item">Candidates</NavLink>
          <NavLink to="/hod/experts" className="menu-item">Experts</NavLink>
          <NavLink to="/comments" className="menu-item">Comments</NavLink>
          <NavLink to="/hod/logs" className={({ isActive }) => `block px-5 py-3 ${isActive ? "bg-pink-200 font-semibold" : "hover:bg-pink-100"}`}>Logs</NavLink>
          <NavLink to="/hod/settings" className="menu-item">Settings</NavLink>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
