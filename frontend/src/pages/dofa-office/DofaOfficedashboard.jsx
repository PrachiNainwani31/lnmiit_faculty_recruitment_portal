// pages/dofa-office/DofaOfficedashboard.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";

export default function DofaOfficeDashboard() {
  const [data, setData] = useState({
    totalCandidates:  0,
    appearedCount:    0,
    totalExperts:     0,
    confirmedExperts: 0,
    offlineExperts:   0,
    onlineExperts:    0,
    pendingQuotes:    0,
  });
  const [cycleLabel,  setCycleLabel]  = useState("-");
  const [cycleString, setCycleString] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/cycle/dofa-office-dashboard").catch(() => ({ data: null })),
      API.get("/expert-travel").catch(() => ({ data: [] })),
    ]).then(([statsRes, travelRes]) => {
      const stats   = statsRes.data;
      const travels = Array.isArray(travelRes.data) ? travelRes.data : [];

      const confirmedExperts = travels.filter(t => t.travel?.confirmed).length;
      const offlineExperts   = travels.filter(t => t.travel?.presenceStatus === "Offline" && t.travel?.confirmed).length;
      const onlineExperts    = travels.filter(t => t.travel?.presenceStatus === "Online"  && t.travel?.confirmed).length;
      const pendingQuotes    = travels.filter(t => t.travel?.quote?.status  === "PENDING").length;

      if (stats) {
        setData({
          totalCandidates:  stats.totalCandidates ?? 0,
          appearedCount:    stats.appearedCount    ?? 0,
          totalExperts:     stats.totalExperts     ?? 0,
          confirmedExperts: stats.confirmedExperts ?? confirmedExperts,
          offlineExperts:   stats.attendingOffline ?? offlineExperts,
          onlineExperts:    stats.attendingOnline  ?? onlineExperts,
          pendingQuotes:    stats.quotesPending    ?? pendingQuotes,
        });
      } else {
        setData(d => ({ ...d, confirmedExperts, offlineExperts, onlineExperts, pendingQuotes }));
      }

      // Cycle label — non-critical, runs after main data is set
      API.get("/cycle/dofa-dashboard")
        .then(r => {
          const depts = r.data?.departments || [];
          const valid = depts.filter(d => d.academicYear);

          if (valid.length) {
            const d = valid[0];
            setCycleLabel(
              d.cycleNumber ? `${d.academicYear} Cycle ${d.cycleNumber}` : d.academicYear
            );
            const cycleStr = d.cycleNumber ? `${d.academicYear}-C${d.cycleNumber}` : null;
            if (cycleStr) setCycleString(cycleStr);
          } else {
            const now       = new Date();
            const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
            setCycleLabel(`${startYear}-${String(startYear + 1).slice(2)}`);
          }
        })
        .catch(() => {
          const now       = new Date();
          const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
          setCycleLabel(`${startYear}-${String(startYear + 1).slice(2)} (Not Initiated)`);
        });

    }).catch(console.error)
      .finally(() => setLoading(false)); // ← this was missing before
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
        <p className="text-sm text-gray-500 mt-1">Overview for recruitment cycle {cycleLabel}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value ?? 0}</p>
            {c.sub && <p className="text-xs mt-1 opacity-70 font-medium">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "External Experts",  sub: "Mark attendance, enter travel",         path: "/dofa-office/experts"           },
          { label: "Pickup / Drop-off", sub: "Station / airport pickup details",      path: "/dofa-office/pickup"            },
          { label: "Select Candidates", sub: "Publish final selection list",          path: "/dofa-office/select-candidates" },
          { label: "Office Allotment",  sub: "Allot offices to selected candidates",  path: "/dofa-office/room-allotment"    },
        ].map(({ label, sub, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:shadow-md transition">
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </button>
        ))}
      </div>

      <SelectionStatusPanel role="DoFA_OFFICE" cycle={cycleString} />
    </div>
  );
}