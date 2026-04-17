// components/hod/CandidatesTab.jsx
import { useState, useEffect } from "react";
import {
  deleteAllCandidates,
  getCandidates,
} from "../../api/hodApi";
import {
  markCandidateAppeared,
  getCandidatesByCycle,
} from "../../api/candidateApi";
import CandidateStatsCard   from "./CandidateStatsCard";
import CandidateUploadCard  from "./CandidateUploadCard";
import CandidateListTable   from "./CandidateListTable";
import CandidateResumeUpload from "./CandidateResumeUpload";
import CYCLE from "../../config/activeCycle"; // adjust path to wherever you export CYCLE on frontend

/* ─────────────────────────────────────────────────────────────────
   STEP FLOW:
   1 → Enter stats (ilscShortlisted)
   2 → Upload CSV
   3 → View list + Mark Appeared + Upload resumes
───────────────────────────────────────────────────────────────── */
export default function CandidatesTab({ refreshCounts, isFrozen }) {
  const [step,        setStep]        = useState(1);
  const [ilscCount,   setIlscCount]   = useState(0);
  const [candidates,  setCandidates]  = useState([]);
  const [togglingId,  setTogglingId]  = useState(null);

  // On mount, check if stats + candidates already exist → skip ahead
  useEffect(() => {
    (async () => {
      try {
        const res = await getCandidatesByCycle(CYCLE);
        if (res.data?.length > 0) {
          setCandidates(res.data);
          setStep(3);
        }
      } catch {/* first visit, stats not entered yet */}
    })();
  }, []);

  /* ── After stats saved, move to upload step ── */
  const handleStatsSaved = (count) => {
    setIlscCount(count);
    setStep(2);
  };

  /* ── After CSV uploaded, move to list step ── */
  const handleCsvUploaded = async () => {
    const res = await getCandidatesByCycle(CYCLE);
    setCandidates(res.data);
    refreshCounts();
    setStep(3);
  };

  /* ── Clear all → back to step 1 ── */
  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL candidates and reset?")) return;
    await deleteAllCandidates(CYCLE);
    setCandidates([]);
    refreshCounts();
    setStep(1);
  };

  /* ── Toggle appeared (also used inside table rows) ── */
  const handleToggleAppeared = async (candidate) => {
    setTogglingId(candidate.id);
    try {
      const newVal = !candidate.appearedInInterview;
      await markCandidateAppeared(candidate.id, newVal);
      setCandidates(prev =>
        prev.map(c =>
          c.id === candidate.id ? { ...c, appearedInInterview: newVal } : c
        )
      );
    } catch {
      alert("Failed to update appeared status");
    } finally {
      setTogglingId(null);
    }
  };

  const appearedCount = candidates.filter(c => c.appearedInInterview).length;

  return (
    <div className="space-y-6">

      {/* ── Frozen banner ── */}
      {isFrozen && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
          his session is frozen. Editing is disabled until DoFA sends it back.
        </div>
      )}

      {/* ═══ STEP 1 — Stats ═══ */}
      {step === 1 && (
        <CandidateStatsCard
          cycle={CYCLE}
          onSaved={handleStatsSaved}
        />
      )}

      {/* ═══ STEP 2 — Upload CSV ═══ */}
      {step === 2 && (
        <CandidateUploadCard
          cycle={CYCLE}
          ilscCount={ilscCount}
          isFrozen={isFrozen}
          onClearAll={handleClearAll}
          onUploaded={handleCsvUploaded}
        />
      )}

      {/* ═══ STEP 3 — List + Appeared + Resumes ═══ */}
      {step === 3 && (
        <>
          {/* ── Appeared summary banner ── */}
          {candidates.length > 0 && (
            <div className={`flex items-center justify-between px-5 py-3 rounded-lg border text-sm ${
              appearedCount === candidates.length
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              <span>
                <b>{appearedCount}</b> of <b>{candidates.length}</b> candidates marked as appeared
              </span>
              {appearedCount < candidates.length && (
                <span className="text-xs text-gray-500">
                  Use the ○ button in each row to mark who appeared
                </span>
              )}
            </div>
          )}

          {/* ── Candidate list table (with appeared toggles) ── */}
          <CandidateListTable
            cycle={CYCLE}
            isFrozen={isFrozen}
            onChange={handleClearAll}
          />

          {/* ── Resume ZIP upload ── */}
          <CandidateResumeUpload isFrozen={isFrozen} />
        </>
      )}
    </div>
  );
}