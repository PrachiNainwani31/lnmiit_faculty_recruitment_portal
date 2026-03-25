import { useEffect, useState } from "react";
import API from "../../api/api";
import CYCLE from "../../config/activeCycle";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

export default function DofaOfficeCandidates() {
  const [grouped,  setGrouped]  = useState({});
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    API.get(`/hod/candidates/${CYCLE}`)
      .then(res => {
        // Group by department (from HOD user)
        // We need to populate HOD department — fetch all and group
        const map = {};
        res.data.forEach(c => {
          // Use hod field to group — we'll fetch hod info separately
          const dept = c.department || "Unknown";
          if (!map[dept]) map[dept] = [];
          map[dept].push(c);
        });
        setGrouped(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter candidates by search
  const filterCandidates = (candidates) => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c =>
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.specialization?.toLowerCase().includes(q)
    );
  };

  const totalCount = Object.values(grouped).flat().length;

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading candidates...</p>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Candidates</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} candidate(s) — cycle {CYCLE}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, email, specialization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-rose-300"
        />
      </div>

      {/* Department groups */}
      {Object.keys(grouped).sort().map(dept => {
        const candidates = filterCandidates(grouped[dept]);
        if (candidates.length === 0) return null;

        return (
          <div key={dept} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">

            {/* Dept header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{dept}</h3>
              <span className="text-indigo-200 text-xs">{candidates.length} candidates</span>
            </div>

            {candidates.length > 0 && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => downloadAsCSV(
                            candidates.map(c => ({
                              srNo: c.srNo, fullName: c.fullName, email: c.email,
                              phone: c.phone, qualification: c.qualification,
                              specialization: c.specialization,
                              reviewerObservation: c.reviewerObservation,
                              ilscComments: c.ilscComments,
                            })),
                            `candidates_${dept || "all"}.csv`
                          )}
                          className="flex items-center gap-2 text-sm border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium"
                        >
                          Download CSV
                        </button>
                      </div>
            )}
            {/* Candidate rows */}
            {candidates.map((c, i) => (
              <CandidateRow key={c._id} candidate={c} index={i} />
            ))}
          </div>
        );
      })}

      {totalCount === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🎓</p>
          <p>No candidates found for cycle {CYCLE}</p>
        </div>
      )}
    </div>
  );
}

function CandidateRow({ candidate: c, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      {/* Summary */}
      <div
        className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-semibold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{c.fullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {c.email} {c.phone && `· ${c.phone}`}
          </p>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 shrink-0">
          <span>Qualification: <strong className="text-gray-700">{c.qualification}</strong></span>
          <span>Specialization: <strong className="text-gray-700">{c.specialization}</strong></span>
        </div>
        <span className="text-gray-400 text-sm ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            {[
              { label:"Email",           val: c.email          },
              { label:"Phone",           val: c.phone          },
              { label:"Qualification",   val: c.qualification  },
              { label:"Specialization",  val: c.specialization },
              { label:"Reviewer Obs.",   val: c.reviewerObservation },
              { label:"ILSC Comments",   val: c.ilscComments   },
            ].map(({ label, val }) => val ? (
              <div key={label}>
                <span className="text-gray-400 text-xs uppercase tracking-wide">{label}</span>
                <p className="text-gray-700 mt-0.5">{val}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
}