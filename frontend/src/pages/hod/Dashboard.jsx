// ✅ Replace: pages/hod/Dashboard.jsx
import { useEffect, useState } from "react";
import { getHodCounts, submitToDofa } from "../../api/hodApi";
import FinalSubmissionCard from "../../components/hod/FinalSubmissionCard";
import { useOutletContext } from "react-router-dom";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";
import API from "../../api/api";

/* ── Submit Appeared card — shown when DOFA has set the interview date ── */
function SubmitAppearedCard({ cycleData, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
      : null;

  const handleSubmit = async () => {
    if (!window.confirm(
      "Submit appeared candidate data to DOFA? Your portal will be frozen again after submission."
    )) return;
    try {
      setSubmitting(true);
      await API.post("/cycle/submit-appeared");
      alert("Appeared candidates submitted to DOFA. Portal is now locked.");
      onSubmitted();
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">Interview Scheduled by DOFA</span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">Step 2</span>
        </div>
        <span className="text-indigo-200 text-xs">Mark appeared candidates, then submit</span>
      </div>

      <div className="px-6 py-5">
        {/* Dates */}
        <div className="flex flex-wrap gap-6 mb-4 text-sm">
          {fmt(cycleData?.teachingInteractionDate) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Teaching Interaction</p>
              <p className="font-semibold text-indigo-700">{fmt(cycleData.teachingInteractionDate)}</p>
            </div>
          )}
          {fmt(cycleData?.interviewDate) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Interview Date</p>
              <p className="font-semibold text-green-700">{fmt(cycleData.interviewDate)}</p>
            </div>
          )}
        </div>

        {/* Instruction */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">ℹ</span>
          <p className="text-xs text-amber-700">
            Go to <strong>Candidates</strong> in the sidebar and mark which candidates appeared in the
            interview using the toggle. Once done, come back here and submit to DOFA.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition shadow-sm"
          >
            {submitting ? "Submitting…" : "Submit Appeared Candidates to DOFA →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearedSubmittedBadge() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 flex items-center gap-3">
      <span className="text-green-600 text-xl">✓</span>
      <div>
        <p className="text-sm font-semibold text-green-800">Appeared Data Submitted to DOFA</p>
        <p className="text-xs text-green-600 mt-0.5">
          Portal is locked pending DOFA's final selection.
        </p>
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  DRAFT:              { label: "Draft",                       cls: "bg-gray-100 text-gray-600 border-gray-200"   },
  SUBMITTED:          { label: "Submitted to DOFA",           cls: "bg-blue-100 text-blue-700 border-blue-200"   },
  QUERY:              { label: "Query from DOFA",             cls: "bg-amber-100 text-amber-700 border-amber-200" },
  APPROVED:           { label: "Approved by DOFA",            cls: "bg-green-100 text-green-700 border-green-200" },
  INTERVIEW_SET:      { label: "Interview Scheduled — Mark Appeared", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  APPEARED_SUBMITTED: { label: "Appeared Data Submitted",     cls: "bg-violet-100 text-violet-700 border-violet-200" },
};

export default function Dashboard() {
  const [counts,    setCounts]    = useState({ candidates: 0, experts: 0 });
  const [cycleData, setCycleData] = useState(null);
  const { isFrozen } = useOutletContext();

  const fetchCounts = async () => {
    const res = await getHodCounts();
    setCounts(res.data);
  };

  const fetchCycle = async () => {
    try {
      const res = await API.get("/cycle/current");
      setCycleData(res.data);
    } catch { /* no cycle yet */ }
  };

  const refresh = () => { fetchCounts(); fetchCycle(); };

  useEffect(() => {
    refresh();
    window.addEventListener("hod-refresh", refresh);
    return () => window.removeEventListener("hod-refresh", refresh);
  }, []);

  const status = cycleData?.status;
  const statusCfg = STATUS_LABELS[status] || STATUS_LABELS.DRAFT;

  // Show first-submission card only before any submission
  const showFirstSubmit = (counts.candidates > 0 || counts.experts > 0)
    && !["SUBMITTED","QUERY","APPROVED","INTERVIEW_SET","APPEARED_SUBMITTED"].includes(status);

  const showSubmitAppeared  = status === "INTERVIEW_SET" && !isFrozen;
  const showAppearedDone    = status === "APPEARED_SUBMITTED";

  return (
    <div className="space-y-6">

      {/* ── First-time submission ── */}
      {showFirstSubmit && (
        <FinalSubmissionCard
          locked={isFrozen}
          counts={counts}
          onSubmit={async () => {
            if (!window.confirm("Once submitted, data will be frozen. Continue?")) return;
            await submitToDofa();
            alert("Submitted to DoFA successfully. Data is now locked.");
            refresh();
          }}
        />
      )}

      {/* ── Step 2: submit appeared ── */}
      {showSubmitAppeared && (
        <SubmitAppearedCard cycleData={cycleData} onSubmitted={refresh} />
      )}

      {/* ── Already submitted appeared ── */}
      {showAppearedDone && <AppearedSubmittedBadge />}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Candidates</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{counts.candidates}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Experts</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{counts.experts}</p>
        </div>
      </div>

      {/* ── Cycle status pill ── */}
      {status && (
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-3.5 shadow-sm flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cycle Status</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
        </div>
      )}

      {/* ── Overview ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-gray-800">Overview</h3>
        <p className="text-gray-600 text-sm">
          Welcome to the HOD Management Portal. Use the sidebar to manage
          candidates and experts. Upload candidate data via CSV or add experts manually.
        </p>
      </div>

      <SelectionStatusPanel role="HOD" />
    </div>
  );
}