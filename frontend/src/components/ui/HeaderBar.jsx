import { useNavigate } from "react-router-dom";
import NotificationBell from "../notifications/NotificationBell";

export default function HeaderBar({ title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-400">Home / {title}</p>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
            {user.name?.slice(0, 2)?.toUpperCase() || "HD"}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user.name || "Head of Department"}</p>
            <p className="text-xs text-gray-400">{user.department || ""}</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.clear(); navigate("/login"); }}
          className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}