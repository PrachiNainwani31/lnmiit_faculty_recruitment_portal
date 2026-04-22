import { useEffect, useState } from "react";
import API from "../../api/api";
import { useActiveCycle } from "../../hooks/useActiveCycle";
import { downloadAsCSV } from "../../components/DownloadCSVButton";

export default function DofaOfficeCandidates() {
  const [grouped,  setGrouped]  = useState({});
  const [search,   setSearch]   = useState("");
  const cycle = useActiveCycle();
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
  // const { Op } = require("sequelize"); // backend handles this
  API.get("/hod/candidates")
    .then(res => {
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.candidates)
        ? res.data.candidates
        : [];
      const map = {};
      data.forEach(c => {
        const dept = c.department || "Unknown";
        if (!map[dept]) map[dept] = [];
        map[dept].push(c);
      });
      setGrouped(map);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

  const filterCandidates = (candidates) => {
    if (!search.trim()) return candidates;
    const q = search.toLowerCase();
    return candidates.filter(c =>
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.specialization?.toLowerCase().includes(q)
    );
  };

  const allCandidates  = Object.values(grouped).flat();
  const totalCount     = allCandidates.length;
  const appearedCount  = allCandidates.filter(c => c.appearedInInterview).length;

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading candidates...</p>;

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Candidates</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} candidate(s) · <span className="text-green-600 font-medium">{appearedCount} appeared</span>
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

      {Object.keys(grouped).sort().map(dept => {
        const candidates = filterCandidates(grouped[dept]);
        if (candidates.length === 0) return null;

        const deptAppeared = candidates.filter(c => c.appearedInInterview).length;

        return (
          <div key={dept} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{dept}</h3>
              <div className="flex items-center gap-3">
                <span className="text-indigo-200 text-xs">{candidates.length} candidates</span>
                <span className="text-green-300 text-xs font-medium">{deptAppeared} appeared</span>
                {candidates[0]?.cycle && (
                  <span className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {candidates[0].cycle}
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 py-2 border-b border-gray-100">
              <button
                onClick={() => downloadAsCSV(
                  candidates.map(c => ({
                    srNo: c.srNo, fullName: c.fullName,
                    email: c.email, secondaryEmail: c.secondaryEmail || "",
                    phone: c.phone, qualification: c.qualification,
                    specialization: c.specialization,
                    appliedPosition: c.appliedPosition || "",
                    recommendedPosition: c.recommendedPosition || "",
                    appeared: c.appearedInInterview ? "Yes" : "No",
                    dlscRecommendation: c.dlscRecommendation,
                    dlscRemarks: c.dlscRemarks,
                    ilscRecommendation: c.ilscRecommendation,
                    ilscRemarks: c.ilscRemarks,
                  })),
                  `candidates_${dept}.csv`
                )}
                className="text-sm border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-1.5 rounded-lg font-medium"
              >
                Download CSV
              </button>
            </div>

            {candidates.map((c, i) => (
              <CandidateRow key={c.id} candidate={c} index={i} />
            ))}
          </div>
        );
      })}

      {totalCount === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
          <p>No candidates found for cycle {cycle || "-"}</p>
        </div>
      )}
    </div>
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function CandidateRow({ candidate: c, index }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async (e) => {
    e.stopPropagation();
    // We need the CandidateApplication id — it's stored in c.userId (the candidate's user id)
    // The DOFA Office downloads by candidateApplication id which maps via candidateUserId
    // Use a fallback: hit the endpoint with candidate.id and let backend find the application
    try {
      setDownloading(true);
      const res = await fetch(`${BASE_URL}/api/dofa/candidate-docs/${c.id}/download-by-candidate`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Not found");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${c.fullName || "candidate"}_Documents.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No documents uploaded for this candidate yet");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border-b last:border-b-0">
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
          <span>Qual: <strong className="text-gray-700">{c.qualification}</strong></span>
          <span>Spec: <strong className="text-gray-700">{c.specialization}</strong></span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${
          c.appearedInInterview
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-gray-100 text-gray-400 border-gray-200"
        }`}>
          {c.appearedInInterview ? "Appeared" : "—"}
        </span>
        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          title="Download all documents as ZIP"
          className="shrink-0 text-xs border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-medium transition disabled:opacity-60"
        >
          {downloading ? "…" : "↓ ZIP"}
        </button>
        <span className="text-gray-400 text-sm ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            {[
              { label:"Email",               val: c.email               },
              { label:"Secondary Email",      val: c.secondaryEmail      },
              { label:"Phone",               val: c.phone               },
              { label:"Qualification",       val: c.qualification       },
              { label:"Specialization",      val: c.specialization      },
              { label:"Applied Position",    val: c.appliedPosition     },
              { label:"Recommended For",     val: c.recommendedPosition },
              { label:"DLSC Recommendation",     val: c.dlscRecommendation },
              { label:"DLSC Remarks",     val: c.dlscRemarks },
              { label:"ILSC Recommendation",     val: c.ilscRecommendation },
              { label:"ILSC Remarks",     val: c.ilscRemarks },
              { label:"Appeared",            val: c.appearedInInterview ? "Yes" : "No" },
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