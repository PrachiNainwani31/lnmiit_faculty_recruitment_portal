import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentCycle } from "../../api/hodApi";

export default function HodLayout() {
  const navigate = useNavigate();
  const [isFrozen, setIsFrozen] = useState(false);

  const fetchCycle = async () => {
    const res = await getCurrentCycle();
    setIsFrozen(res.data.isFrozen);
  };

  useEffect(() => {
    fetchCycle();
    window.addEventListener("hod-refresh", fetchCycle);
    return () =>
      window.removeEventListener("hod-refresh", fetchCycle);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">Institute Portal</h1>
          <p className="text-sm text-gray-500">
            {JSON.parse(localStorage.getItem("user"))?.department || "HOD"} Department
          </p>
        </div>

        <nav className="mt-4">
          <NavLink to="/hod" end className="block px-5 py-3">
            📊 Dashboard
          </NavLink>

          <NavLink to="/hod/candidates" className="block px-5 py-3">
            🎓 Candidates
          </NavLink>

          <NavLink to="/hod/experts" className="block px-5 py-3">
            👨‍🏫 Experts
          </NavLink>

          <NavLink to="/hod/comments" className="block px-5 py-3">
            💬 Comments
          </NavLink>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {isFrozen && (
          <div className="bg-red-100 text-red-700 text-center py-2 font-medium">
            Cycle submitted. Editing is locked.
          </div>
        )}

        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* 👇 PASS isFrozen TO ALL CHILD PAGES */}
          <Outlet context={{ isFrozen }} />
        </main>
      </div>
    </div>
  );
}
