import { NavLink, Outlet } from "react-router-dom";

export default function HodLayout() {
  
  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-5 font-bold text-xl border-b">
          Institute Portal
          <p className="text-sm text-gray-500">HOD Management</p>
        </div>

        <nav className="mt-4 space-y-1">
          <NavLink to="/hod" className={({ isActive }) => `block px-5 py-3 ${isActive ? "bg-pink-200 font-semibold" : "hover:bg-pink-100"}`}>
            Dashboard
          </NavLink>
          <NavLink to="/hod/candidates" className={({ isActive }) => `block px-5 py-3 ${isActive ? "bg-pink-200 font-semibold" : "hover:bg-pink-100"}`}>
            Candidates
          </NavLink>
          <NavLink to="/hod/experts" className={({ isActive }) => `block px-5 py-3 ${isActive ? "bg-pink-200 font-semibold" : "hover:bg-pink-100"}`}>
            Experts
          </NavLink>
          <NavLink to="/hod/settings" className={({ isActive }) => `block px-5 py-3 ${isActive ? "bg-pink-200 font-semibold" : "hover:bg-pink-100"}`}>
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white p-4 shadow flex justify-between items-center">
          <h2 className="font-semibold text-lg">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="bg-gray-200 px-3 py-1 rounded-full">HD</span>
            <span>Dr. HOD Name</span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded">
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
