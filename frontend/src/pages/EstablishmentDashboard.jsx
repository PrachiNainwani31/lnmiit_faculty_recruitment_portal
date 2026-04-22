import { useEffect, useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function EstablishmentDashboard() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/establishment/records"),
      API.get("/selected-candidates"),
    ]).then(([recRes, selRes]) => {
      const selMap = {};
      (Array.isArray(selRes.data) ? selRes.data : []).forEach(s => {
        const id = s.candidateId || s.candidate?.id;
        if (id) selMap[id] = s;
      });
      const merged = (recRes.data || []).map(dept => ({
        ...dept,
        records: (dept.records || []).map(r => ({
          ...r,
          selectionStatus:  selMap[r.candidate?.id]?.status || "SELECTED",
        })),
      })).filter(dept => dept.records.length > 0);
      setDepts(merged);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  const all      = depts.flatMap(d => d.records);
  const total    = all.length;
  const offered  = all.filter(r => r.offerLetterPath).length;
  const joined   = all.filter(r => r.joiningDate).length;
  const complete = all.filter(r => r.joiningComplete).length;
  const notJoined= all.filter(r => r.notJoined).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Establishment Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Onboarding status overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Selected",    value: total,    color: "bg-blue-50  border-blue-200  text-blue-700"  },
          { label: "Offers Sent",        value: offered,  color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Joining Date Set",   value: joined,   color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Process Complete",   value: complete, color: "bg-teal-50  border-teal-200  text-teal-700"  },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Per-department status */}
      {depts.map(({ department, records }) => (
        <div key={department} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-amber-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{department}</p>
            <span className="text-amber-100 text-xs">{records.length} candidate(s)</span>
          </div>
          <div>
            {records.map(r => {
              const steps = [
                { label: "Offer Sent",     done: !!r.offerLetterPath },
                { label: "Joining Date",   done: !!r.joiningDate || !!r.notJoined },
                { label: "Joining Letter", done: !!r.joiningLetterPath },
                { label: "MIS & Library",  done: !!(r.misUsername && r.libraryMemberId) },
                { label: "RFID",           done: !!r.rfidSentToCandidate },
              ];
              const doneCount = steps.filter(s => s.done).length;

              return (
                <div key={r.id} className="border-b border-gray-50 last:border-0">
                
                {/* Closed banner — full width, above the row */}
                {r.isCycleClosedFlag && (
                    <div className="mx-5 mt-2 bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="text-gray-500 text-sm">🔒</span>
                    <p className="text-sm text-gray-600 font-medium">
                        Cycle closed — record is read-only.
                    </p>
                    </div>
                )}

                {/* Candidate row */}
                <div className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{r.candidate?.fullName}</p>
                    <p className="text-xs text-gray-400">{r.candidate?.email}</p>
                    </div>
                    {r.notJoined && (
                    <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                        Did Not Join
                    </span>
                    )}
                    <div className="flex gap-1">
                    {steps.map((s, i) => (
                        <div key={i} title={s.label}
                        className={`w-2.5 h-2.5 rounded-full ${s.done ? "bg-green-500" : "bg-gray-200"}`} />
                    ))}
                    </div>
                    <span className="text-xs text-gray-500">{doneCount}/{steps.length}</span>
                    {r.joiningComplete && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                        Complete
                    </span>
                    )}
                </div>
                </div>
            );
            })}
          </div>
          <div className="px-5 py-2 border-t border-gray-100">
            <button onClick={() => navigate("/establishment/onboarding")}
              className="text-xs text-amber-700 hover:underline font-medium">
              Manage Offer & Joining Letters →
            </button>
          </div>
        </div>
      ))}

      {depts.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">
          No selected candidates yet.
        </div>
      )}
    </div>
  );
}