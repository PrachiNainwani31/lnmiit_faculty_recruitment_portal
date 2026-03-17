import { useEffect, useState } from "react";
import API from "../../api/api";

const CYCLE = "2025-26";

export default function DofaOfficeCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    API.get(`/hod/candidates/${CYCLE}`)
      .then(res => setCandidates(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} candidate(s) — cycle {CYCLE}</p>
        </div>
        <input
          placeholder="Search by name, email, specialization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-rose-300"
        />
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No candidates found.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((c, i) => (
          <div key={c._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpanded(expanded === c._id ? null : c._id)}
            >
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-semibold text-sm shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{c.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.email} · {c.phone}</p>
              </div>
              <div className="hidden md:flex gap-6 text-sm text-gray-500">
                <span><span className="text-gray-400 text-xs">Qualification: </span>{c.qualification}</span>
                <span><span className="text-gray-400 text-xs">Specialization: </span>{c.specialization}</span>
              </div>
              <span className="text-gray-400 text-xs ml-2">{expanded === c._id ? "▲" : "▼"}</span>
            </div>

            {/* Expanded details */}
            {expanded === c._id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "Full Name",       value: c.fullName       },
                    { label: "Email",           value: c.email          },
                    { label: "Phone",           value: c.phone          },
                    { label: "Qualification",   value: c.qualification  },
                    { label: "Specialization",  value: c.specialization },
                    { label: "Sr. No.",         value: c.srNo           },
                    { label: "Reviewer Obs.",   value: c.reviewerObservation || "—" },
                    { label: "ILSC Comments",   value: c.ilscComments   || "—" },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{f.label}</p>
                      <p className="text-gray-700 mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}