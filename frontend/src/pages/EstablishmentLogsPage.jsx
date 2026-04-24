// pages/EstablishmentLogsPage.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "0";

export default function EstablishmentLogsPage() {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/establishment/logs")
      .then(r => setDepts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Onboarding Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Closed cycles — completed onboarding records.</p>
      </div>

      {depts.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No closed cycle records found.</p>
        </div>
      )}

      {depts.map(({ department, records }) => (
        <div key={department} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium">{department}</p>
            {records[0]?.cycle && (
              <span className="text-gray-400 text-xs font-mono">
                {records[0].cycle}
              </span>
            )}
          </div>
          {records.map(r => {
            const c = r.candidate;
            return (
              <div key={r.id} className="border-b last:border-0 px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold">
                      {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
                      <p className="text-xs text-gray-400">{c?.email} · {r.cycle}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {r.selectionStatus === "SELECTED" && (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">✓ Selected</span>
                    )}
                    {r.selectionStatus === "WAITLISTED" && (
                      <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">⟳ Waitlisted</span>
                    )}
                    {r.joiningComplete && (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        ✓ Joined {r.joiningCompletedAt ? new Date(r.joiningCompletedAt).toLocaleDateString("en-GB") : ""}
                      </span>
                    )}
                    {r.notJoined && (
                      <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                        ✗ Did Not Join
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Offer Letter",    done: !!r.offerLetterPath,
                      link: r.offerLetterPath ? `${BASE}/${r.offerLetterPath}` : null },
                    { label: "Joining Date",    done: !!r.joiningDate,
                      detail: r.joiningDate ? new Date(r.joiningDate).toLocaleDateString("en-GB") : null },
                    { label: "Joining Letter",  done: !!r.joiningLetterPath,
                      link: r.joiningLetterPath ? `${BASE}/${r.joiningLetterPath}` : null },
                    { label: "MIS & Library",   done: !!(r.misUsername && r.libraryMemberId) },
                    { label: "RFID Issued",     done: !!r.rfidSentToCandidate },
                  ].map(({ label, done, detail, link }) => (
                    <div key={label} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      <span className={done ? "text-green-600" : "text-gray-300"}>{done ? "✓" : "○"}</span>
                      <div>
                        <p className={`font-medium ${done ? "text-gray-700" : "text-gray-400"}`}>{label}</p>
                        {detail && <p className="text-gray-400">{detail}</p>}
                        {link && <a href={link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View PDF</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}