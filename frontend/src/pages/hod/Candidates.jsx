import { useEffect, useState } from "react";
import CandidateStatsCard from "../../components/hod/CandidateStatsCard";
import CandidateUploadCard from "../../components/hod/CandidateUploadCard";
import CandidateListTable from "../../components/hod/CandidateListTable";
import { getCandidateStatus, clearCandidateStats } from "../../api/candidateApi";
import CandidateResumeUpload from "../../components/hod/CandidateResumeUpload";
import { useActiveCycle } from "../../hooks/useActiveCycle";

export default function Candidates({ isFrozen }) {
  const cycle = useActiveCycle();
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cycle === undefined) return;        // still resolving
    if (cycle === null) { setLoading(false); return; }  // no cycle exists

    setLoading(true);
    getCandidateStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [cycle]);

  const handleClearAll = async () => {
    if (!window.confirm("This will delete ALL candidates and reset counts. Continue?")) return;
    await clearCandidateStats(cycle);
    window.dispatchEvent(new Event("hod-refresh"));
    // Re-fetch after clear
    getCandidateStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus(null));
  };

  // ✅ All guards before any status access
  if (cycle === undefined || loading) return null;

  if (cycle === null) return (
    <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
      <p>No active cycle. Please initiate a cycle first.</p>
    </div>
  );

  if (!status) return (
    <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
      <p>Failed to load candidate status.</p>
    </div>
  );

  return (
    <>
      {!status.statsEntered && (
        <CandidateStatsCard cycle={cycle} onSaved={() =>
          getCandidateStatus().then(r => setStatus(r.data)).catch(() => {})
        } />
      )}

      {status.statsEntered && status.uploadedCount === 0 && (
        <CandidateUploadCard
          cycle={cycle}
          ilscCount={status.ilscCount}
          isFrozen={isFrozen}
          onClearAll={handleClearAll}
          onUploaded={() =>
            getCandidateStatus().then(r => setStatus(r.data)).catch(() => {})
          }
        />
      )}

      {status.statsEntered && status.uploadedCount > 0 && (
        <CandidateListTable
          cycle={cycle}
          isFrozen={isFrozen}
          onChange={() =>
            getCandidateStatus().then(r => setStatus(r.data)).catch(() => {})
          }
        />
      )}

      {status.uploadedCount > 0 && (
        <CandidateResumeUpload
          candidateCount={status.uploadedCount}
          isFrozen={isFrozen}
        />
      )}
    </>
  );
}