import { useEffect, useState } from "react";
import API from "../api/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RefereeStatus() {
  const [referees, setReferees] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(null);

  const load = async () => {
    try {
      const res = await API.get("/referee/status");
      setReferees(res.data);
    } catch {
      // not submitted yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30s so status updates without manual reload
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRemind = async (refereeId, refereeName) => {
    if (!window.confirm(`Send a gentle reminder to ${refereeName}?`)) return;
    try {
      setSending(refereeId);
      await API.post(`/referee/remind/${refereeId}`);
      alert(`Reminder sent to ${refereeName}`);
    } catch {
      alert("Failed to send reminder.");
    } finally {
      setSending(null);
    }
  };

  if (loading) return null;

  if (referees.length === 0) {
    return (
      <div className="bg-white p-6 rounded shadow text-center text-gray-400 text-sm">
        No referee status available. Submit your application to notify referees.
      </div>
    );
  }

  const submitted = referees.filter(r => r.status === "SUBMITTED").length;

  return (
    <div className="bg-white p-6 rounded shadow space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Referee Status</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{submitted} / {referees.length} submitted</span>
          {/* Manual refresh button */}
          <button onClick={load} className="text-xs border border-gray-300 text-gray-500 hover:bg-gray-50 px-3 py-1 rounded-lg">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${referees.length ? (submitted / referees.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-3">
        {referees.map(r => (
          <div key={r.id}
            className={`border rounded-lg px-4 py-3 ${
              r.status === "SUBMITTED" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {/* Status dot */}
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                  r.status === "SUBMITTED" ? "bg-green-500" : "bg-yellow-400"
                }`} />

                <div>
                  <p className="font-medium text-gray-800 text-sm">{r.name || "—"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[r.designation, r.institute, r.email].filter(Boolean).join(" · ")}
                  </p>

                  {r.status === "SUBMITTED" && r.submittedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      ✔ Submitted on {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  r.status === "SUBMITTED"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                }`}>
                  {r.status === "SUBMITTED" ? "✔ Submitted" : "⏳ Pending"}
                </span>

                {/* Remind — only if pending */}
                {r.status !== "SUBMITTED" && (
                  <button
                    onClick={() => handleRemind(r.id, r.name)}
                    disabled={sending === r.id}
                    className="text-xs border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    {sending === r.id ? "Sending..." : "📨 Remind"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}