import { useEffect, useState } from "react";
import CandidateStatsCard from "../../components/hod/CandidateStatsCard";
import CandidateUploadCard from "../../components/hod/CandidateUploadCard";
import CandidateListTable from "../../components/hod/CandidateListTable";
import {
  getCandidateStatus,
  clearCandidateStats,
} from "../../api/candidateApi";
import CandidateResumeUpload from "../../components/hod/CandidateResumeUpload";

export default function Candidates({ isFrozen }) {
  const cycle = "2026-27";

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    const res = await getCandidateStatus(cycle);
    setStatus(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "This will delete ALL candidates and reset counts. Continue?"
      )
    )
      return;

    await clearCandidateStats(cycle);
    window.dispatchEvent(new Event("hod-refresh"));
    await fetchStatus();
  };

  if (loading) return null;

  return (
    <>
      {/* STEP 1: Enter Counts */}
      {!status.statsEntered && (
        <CandidateStatsCard
          cycle={cycle}
          onSaved={fetchStatus}
        />
      )}

      {/* STEP 2: Upload CSV */}
      {status.statsEntered && status.uploadedCount === 0 && (
        <CandidateUploadCard
          cycle={cycle}
          ilscCount={status.ilscCount}
          isFrozen={isFrozen}
          onClearAll={handleClearAll}
          onUploaded={fetchStatus}
        />
      )}

      {/* STEP 3: Candidate List */}
      {status.statsEntered && status.uploadedCount > 0 && (
        <CandidateListTable
          cycle={cycle}
          isFrozen={isFrozen}
          onChange={fetchStatus} // 🔥 VERY IMPORTANT
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
