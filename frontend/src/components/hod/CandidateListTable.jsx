// components/hod/CandidateListTable.jsx
import { useEffect, useState } from "react";
import {
  getCandidatesByCycle,
  deleteCandidateById,
  clearCandidateStats,
  markCandidateAppeared,
} from "../../api/candidateApi";
import API from "../../api/api";

export default function CandidateListTable({ cycle, isFrozen, onChange }) {
  const [candidates,    setCandidates]    = useState([]);
  const [interviewDate, setInterviewDate] = useState(null);
  const [cycleStatus,   setCycleStatus]   = useState(null);
  const [togglingId,    setTogglingId]    = useState(null);
  const [submitting,    setSubmitting]    = useState(false);

  const fetchCandidates = async () => {
    const res = await getCandidatesByCycle(cycle);
    if (res.data?.candidates) {
      setCandidates(res.data.candidates);
      setInterviewDate(res.data.interviewDate || null);
    } else {
      setCandidates(Array.isArray(res.data) ? res.data : []);
    }
    // Also fetch current cycle status so we know if already submitted
    try {
      const cycleRes = await API.get("/cycle/current");
      setCycleStatus(cycleRes.data?.status || null);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await deleteCandidateById(id);
    window.dispatchEvent(new Event("hod-refresh"));
    await fetchCandidates();
    onChange?.();
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL candidates and reset?")) return;
    await clearCandidateStats(cycle);
    window.dispatchEvent(new Event("hod-refresh"));
    onChange?.();
  };

  const handleToggleAppeared = async (candidate) => {
    setTogglingId(candidate.id);
    try {
      const newVal = !candidate.appearedInInterview;
      await markCandidateAppeared(candidate.id, newVal);
      setCandidates(prev =>
        prev.map(c => c.id === candidate.id ? { ...c, appearedInInterview: newVal } : c)
      );
    } catch (err) {
      if (err.response?.data?.gated) {
        alert("Interview date not yet set by DOFA. Cannot mark appeared yet.");
      } else {
        alert("Failed to update appeared status");
      }
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Submit appeared to DOFA ── */
  const handleSubmitAppeared = async () => {
    if (!window.confirm(
      "Submit appeared candidate data to DOFA? Your portal will be frozen again after submission."
    )) return;
    try {
      setSubmitting(true);
      await API.post("/cycle/submit-appeared");
      alert("Appeared candidates submitted to DOFA. Portal is now locked.");
      window.dispatchEvent(new Event("hod-refresh")); // refresh layout freeze state
      await fetchCandidates();
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const appearedCount = candidates.filter(c => c.appearedInInterview).length;

  // Show submit button when:
  // - interview date is set (unlocked by DOFA)
  // - cycle is not yet re-frozen (status !== APPEARED_SUBMITTED)
  // - portal is not frozen (isFrozen false)
  const showSubmitBtn =
    !!interviewDate &&
    !isFrozen &&
    cycleStatus !== "APPEARED_SUBMITTED";

  const alreadySubmitted = cycleStatus === "APPEARED_SUBMITTED";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Candidate List</h3>
          {appearedCount > 0 && (
            <p className="text-xs text-green-600 mt-0.5 font-medium">
              ✓ {appearedCount} / {candidates.length} marked as appeared
            </p>
          )}
        </div>
        {!isFrozen && (
          <button onClick={handleClearAll}
            className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
            Clear All
          </button>
        )}
      </div>

      {/* Interview date banner */}
      {!interviewDate ? (
        <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <span className="text-base mt-0.5">🔒</span>
          <div>
            <p className="font-semibold">Appeared marking is locked</p>
            <p className="mt-0.5 text-amber-600">
              DOFA has not set the interview date yet. Once set, you can mark which candidates appeared.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700">
          <span>✓</span>
          <p>
            Interview date:{" "}
            <strong>
              {new Date(interviewDate).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </strong>{" "}
            — mark which candidates appeared
          </p>
        </div>
      )}

      {/* Already submitted banner */}
      {alreadySubmitted && (
        <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-xs text-violet-700">
          <span className="text-base">✓</span>
          <div>
            <p className="font-semibold">Appeared data submitted to DOFA</p>
            <p className="mt-0.5 text-violet-600">
              Portal is locked pending DOFA's final selection.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Sr","Name","Email","Secondary Email","Phone",
                "Qualification","Specialization","Applied Position",
                "Recommended Position","Reviewer Observation","ILSC Comments",
              ].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
              <th className={`px-3 py-3 text-center text-xs font-semibold whitespace-nowrap ${
                interviewDate ? "text-green-600" : "text-gray-400"
              }`}>
                {interviewDate ? "Appeared ✓" : "Appeared 🔒"}
              </th>
              {!isFrozen && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, index) => (
              <tr key={c.id} className={`border-b border-gray-50 last:border-0 transition ${
                c.appearedInInterview ? "bg-green-50/40" : "hover:bg-gray-50/50"
              }`}>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{index + 1}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{c.fullName}</td>
                <td className="px-3 py-2.5 text-blue-600 text-xs">{c.email}</td>
                <td className="px-3 py-2.5 text-gray-400 text-xs">{c.secondaryEmail || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.phone}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.qualification}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.specialization}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.appliedPosition || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{c.recommendedPosition || "—"}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[160px]">
                  <span className="line-clamp-2" title={c.reviewerObservation}>
                    {c.reviewerObservation || "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[140px]">
                  <span className="line-clamp-2" title={c.ilscComments}>
                    {c.ilscComments || "—"}
                  </span>
                </td>

                {/* Appeared toggle */}
                <td className="px-3 py-2.5 text-center">
                  {interviewDate ? (
                    <button
                      onClick={() => !isFrozen && !alreadySubmitted && handleToggleAppeared(c)}
                      disabled={togglingId === c.id || isFrozen || alreadySubmitted}
                      title={
                        alreadySubmitted  ? "Already submitted to DOFA" :
                        isFrozen          ? "Cycle frozen" :
                        c.appearedInInterview ? "Click to unmark" : "Click to mark appeared"
                      }
                      className={`w-8 h-8 rounded-full font-bold text-sm transition border-2 ${
                        c.appearedInInterview
                          ? "bg-green-500 border-green-500 text-white shadow-sm"
                          : "bg-white border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500"
                      } ${
                        togglingId === c.id || isFrozen || alreadySubmitted
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {togglingId === c.id ? "…" : c.appearedInInterview ? "✓" : "○"}
                    </button>
                  ) : (
                    <span className="text-gray-300 text-lg" title="Interview date not set by DOFA">🔒</span>
                  )}
                </td>

                {!isFrozen && (
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleDelete(c.id)}
                      className="text-red-400 hover:text-red-600 transition text-base" title="Delete">
                      🗑
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            <p className="text-3xl mb-2">📋</p>No candidates uploaded yet
          </div>
        )}
      </div>

      {/* Legend */}
      {candidates.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-green-500 inline-block" />Appeared
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 inline-block" />Not appeared
          </span>
          {!interviewDate && (
            <span className="flex items-center gap-1.5 text-amber-500">
              🔒 Locked until DOFA sets interview date
            </span>
          )}
        </div>
      )}

      {/* ✅ NEW: Submit appeared to DOFA button */}
      {showSubmitBtn && candidates.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Done marking appeared candidates?</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Submit to DOFA to lock this cycle and notify them.
                {appearedCount > 0 && (
                  <span className="ml-1 text-green-600 font-medium">
                    {appearedCount} / {candidates.length} marked as appeared.
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleSubmitAppeared}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition shadow-sm"
            >
              {submitting ? "Submitting…" : "Submit Appeared Candidates to DOFA →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}