import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function DofaLayout() {
  const navigate = useNavigate();

  const navStyle = ({ isActive }) =>
    `block px-5 py-3 rounded-lg mx-3 transition ${
      isActive
        ? "bg-pink-500 text-white font-semibold"
        : "text-gray-700 hover:bg-pink-100"
    }`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold">DOFA Portal</h1>
          <p className="text-sm text-gray-500">
            Dean of Faculty Affairs
          </p>
        </div>

        <nav className="mt-4 space-y-2">
          <NavLink to="/dofa" end className={navStyle}>
            📊 Dashboard
          </NavLink>

          <NavLink to="/dofa/candidates" className={navStyle}>
            🎓 Candidates
          </NavLink>

          <NavLink to="/dofa/experts" className={navStyle}>
            👨‍🏫 Experts
          </NavLink>

          <NavLink to="/dofa/comments" className={navStyle}>
            💬 Comments
          </NavLink>
          <NavLink to="/dofa/document-tracking" className={navStyle}>
            📄 Document Tracking
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white px-6 py-4 shadow flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            DOFA Dashboard
          </h2>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
