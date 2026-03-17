import { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function DofaOfficeDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/expert-travel"),
      API.get("/hod/candidates/2025-26"),
      API.get("/hod/experts"),
    ])
      .then(([travelRes, candidateRes, expertRes]) => {
        const travels = travelRes.data;
        setData({
          totalCandidates: candidateRes.data.length,
          totalExperts:    expertRes.data.length,
          confirmedExperts: travels.filter(t => t.travel?.confirmed).length,
          offlineExperts:   travels.filter(t => t.travel?.presenceStatus === "Offline").length,
          onlineExperts:    travels.filter(t => t.travel?.presenceStatus === "Online").length,
          pendingQuotes:    travels.filter(t => t.travel?.quote?.status === "PENDING").length,
        });
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading dashboard...</p>;

  const cards = [
    { label: "Total Candidates",   value: data.totalCandidates,   color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
    { label: "Total Experts",      value: data.totalExperts,       color: "bg-purple-50 border-purple-200 text-purple-700" },
    { label: "Confirmed Experts",  value: data.confirmedExperts,   color: "bg-green-50 border-green-200 text-green-700"   },
    { label: "Attending Offline",  value: data.offlineExperts,     color: "bg-blue-50 border-blue-200 text-blue-700"     },
    { label: "Attending Online",   value: data.onlineExperts,      color: "bg-teal-50 border-teal-200 text-teal-700"     },
    { label: "Quotes Pending",     value: data.pendingQuotes,      color: "bg-amber-50 border-amber-200 text-amber-700"  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview for recruitment cycle 2025–26</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/dofa-office/experts")}
          className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md transition"
        >
          <p className="text-sm font-semibold text-gray-700">👨‍🏫 Confirm Expert Attendance</p>
          <p className="text-xs text-gray-400 mt-1">Mark experts as Online / Offline and enter travel details</p>
        </button>
        <button
          onClick={() => navigate("/dofa-office/pickup")}
          className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md transition"
        >
          <p className="text-sm font-semibold text-gray-700">🚗 Manage Pickup / Drop-off</p>
          <p className="text-xs text-gray-400 mt-1">Enter station/airport pickup details for offline experts</p>
        </button>
      </div>
    </div>
  );
}