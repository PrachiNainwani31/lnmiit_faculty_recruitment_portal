// pages/dofa-office/DofaOfficedashboard.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";

import CYCLE from "../../config/activeCycle";

export default function DofaOfficeDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/expert-travel"),
      API.get(`/hod/candidates/${CYCLE}`),
      API.get("/hod/experts/all"),
    ])
      .then(([travelRes, candidateRes, expertRes]) => {
        const travels = Array.isArray(travelRes.data) ? travelRes.data : [];

        // ✅ API now returns { candidates, interviewDate } — handle both shapes
        const raw        = candidateRes.data;
        const candidates = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.candidates)
          ? raw.candidates
          : [];

        const experts = Array.isArray(expertRes.data) ? expertRes.data : [];

        setData({
          totalCandidates:  candidates.length,
          appearedCount:    candidates.filter(c => c.appearedInInterview).length,
          totalExperts:     experts.length,
          confirmedExperts: travels.filter(t => t.travel?.confirmed).length,
          offlineExperts:   travels.filter(t => t.travel?.presenceStatus === "Offline" && t.travel?.confirmed).length,
          onlineExperts:    travels.filter(t => t.travel?.presenceStatus === "Online"  && t.travel?.confirmed).length,
          pendingQuotes:    travels.filter(t => t.travel?.quote?.status  === "PENDING").length,
        });
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading dashboard…</p>;

  const cards = [
    {
      label: "Total Candidates",
      value: data.totalCandidates,
      sub:   data.appearedCount > 0 ? `${data.appearedCount} appeared in interview` : null,
      color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    },
    { label: "Total Experts",     value: data.totalExperts,     color: "bg-purple-50 border-purple-200 text-purple-700" },
    { label: "Confirmed Experts", value: data.confirmedExperts, color: "bg-green-50  border-green-200  text-green-700"  },
    { label: "Attending Offline", value: data.offlineExperts,   color: "bg-blue-50   border-blue-200   text-blue-700"   },
    { label: "Attending Online",  value: data.onlineExperts,    color: "bg-teal-50   border-teal-200   text-teal-700"   },
    { label: "Quotes Pending",    value: data.pendingQuotes,    color: "bg-amber-50  border-amber-200  text-amber-700"  },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview for recruitment cycle {CYCLE}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value ?? 0}</p>
            {c.sub && <p className="text-xs mt-1 opacity-70 font-medium">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "External Experts",   sub: "Mark attendance, enter travel",      path: "/dofa-office/experts"            },
          { label: "Pickup / Drop-off",  sub: "Station / airport pickup details",   path: "/dofa-office/pickup"             },
          { label: "Select Candidates",  sub: "Publish final selection list",       path: "/dofa-office/select-candidates"  },
          { label: "Room Allotment",     sub: "Allot rooms to selected candidates", path: "/dofa-office/room-allotment"    },
        ].map(({ label, sub, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md transition">
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </button>
        ))}
      </div>

      <SelectionStatusPanel role="DOFA_OFFICE" />
    </div>
  );
}