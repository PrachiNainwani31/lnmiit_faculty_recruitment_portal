// pages/hod/Dashboard.jsx
import { useEffect, useState } from "react";
import { getHodCounts, submitToDofa } from "../../api/hodApi";
import FinalSubmissionCard from "../../components/hod/FinalSubmissionCard";
import { useOutletContext } from "react-router-dom";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";
import API from "../../api/api";
import { showToast, showConfirm } from "../../components/ui/Toast";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
    </div>
  );
}

/* ── Submit Appeared card — shown after DOFA sets interview date ── */
function SubmitAppearedCard({ cycleData, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false);

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : null;

  const handleSubmit = async () => {
    const ok = await showConfirm(
      "Submit appeared candidate data to DoFA? Your portal will be frozen again after submission."
    );
    if (!ok) return;
    try {
      setSubmitting(true);
      await API.post("/cycle/submit-appeared");
      showToast("Appeared candidates submitted to DoFA. Portal is now locked.");
      onSubmitted();
    } catch (err) {
      showToast(err.response?.data?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">Interview Scheduled by DoFA</span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">Step 2</span>
        </div>
        <span className="text-indigo-200 text-xs">Mark appeared candidates, then submit</span>
      </div>
      <div className="px-6 py-5">
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 shrink-0">ℹ</span>
          <p className="text-xs text-amber-700">
            Go to <strong>Candidates</strong> and mark which candidates appeared using the toggle.
            Come back here and submit to DoFA when done.
          </p>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition shadow-sm">
            {submitting ? "Submitting…" : "Submit Appeared Candidates to DoFA →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 20 }, (_, i) => {
  const start = currentYear - 2 + i;  // show 2 past + 18 future
  const end   = String(start + 1).slice(-2);
  return `${start}-${end}`;
});

function AppearedSubmittedBadge() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 flex items-center gap-3">
      <span className="text-green-600 text-xl">✓</span>
      <div>
        <p className="text-sm font-semibold text-green-800">Appeared Data Submitted to DoFA</p>
        <p className="text-xs text-green-600 mt-0.5">Portal is locked pending DoFA's final selection.</p>
      </div>
    </div>
  );
}

const STATUS_LABELS = {
  DRAFT:              { label: "Draft",                              cls: "bg-gray-100   text-gray-600   border-gray-200"   },
  SUBMITTED:          { label: "Submitted to DoFA",                 cls: "bg-blue-100   text-blue-700   border-blue-200"   },
  QUERY:              { label: "Query from DoFA — Please Respond",  cls: "bg-amber-100  text-amber-700  border-amber-200"  },
  APPROVED:           { label: "Approved by DoFA",                  cls: "bg-green-100  text-green-700  border-green-200"  },
  INTERVIEW_SET:      { label: "Interview Scheduled — Mark Appeared",cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  APPEARED_SUBMITTED: { label: "Appeared Data Submitted",           cls: "bg-violet-100 text-violet-700 border-violet-200" },
};

export default function Dashboard() {
  const [counts,    setCounts]    = useState({ candidates: 0, experts: 0 });
  const [cycleData, setCycleData] = useState(null);
  const { isFrozen } = useOutletContext();
  const [yearForm, setYearForm] = useState({
  academicYear: `${currentYear}-${String(currentYear + 1).slice(-2)}`,cycleNumber: "",});
  const [yearError, setYearError] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [cycleLoaded, setCycleLoaded] = useState(false);
  const [showNewCycleForm, setShowNewCycleForm] = useState(false);
  const [nextCycleNumber, setNextCycleNumber] = useState(1);
  const fetchCounts = async () => {
  try {
    const res = await getHodCounts();
    setCounts(res.data);
  } catch (err) {
    if (err?.response?.status !== 400) {
      console.error("fetchCounts error:", err);
    }
  }
};
  const openNewCycleForm = async () => {
    setShowNewCycleForm(true);
  };

  const fetchCycle = async () => {
  try {
    const res = await API.get("/cycle/current");
    setCycleData(res.data);  // null if not initiated yet
  } catch {
    setCycleData(null);
  } finally{
    setCycleLoaded(true);
  }
};

  const refresh = () => { fetchCounts(); fetchCycle(); };

  useEffect(() => {
    refresh();
    window.addEventListener("hod-refresh", refresh);
    return () => window.removeEventListener("hod-refresh", refresh);
  }, []);

useEffect(() => {
  if (!yearForm.academicYear) return;
  API.get(`/cycle/next-cycle-number?academicYear=${yearForm.academicYear}`)
    .then(res => setYearForm(f => ({ ...f, cycleNumber: String(res.data.nextNumber || 1) })))
    .catch(() => setYearForm(f => ({ ...f, cycleNumber: "1" })));
}, [yearForm.academicYear]);
  const status    = cycleData?.status;
  const statusCfg = STATUS_LABELS[status] || STATUS_LABELS.DRAFT;

  // ── Determine which action card to show ──────────────────────────────────

  const hasData = counts.candidates > 0 || counts.experts > 0;

  // Show first-time submit: only when DRAFT (never submitted yet) and has data
  const showFirstSubmit =
    hasData &&
    (status === "DRAFT" || !status);

  // ✅ FIX: Show RE-SUBMIT when DOFA raised a query (status=QUERY, cycle unfrozen)
  // Previously this was combined with showFirstSubmit but QUERY was excluded — bug fixed here.
  const showReSubmit =
    hasData &&
    status === "QUERY";

  // Step 2: Submit appeared candidates after interview is scheduled
  const showSubmitAppeared  = status === "INTERVIEW_SET" && !isFrozen;
  const showAppearedDone    = status === "APPEARED_SUBMITTED";

  const handleFirstSubmit = async () => {
    const ok = window.confirm("Once submitted, data will be frozen. Continue?");
    if (!ok) return;
    try {
      await submitToDofa();
      showToast("Submitted to DoFA successfully. Data is now locked.");
      refresh();
    } catch (err) {
      console.error("Submit error:", err);
      showToast(err.response?.data?.message || "Submission failed", "error");
    }
  };

  const handleReSubmit = async () => {
    const ok = window.confirm("Re-submit to DoFA? Data will be frozen again after submission.");
    if (!ok) return;
    try {
      await submitToDofa();
      showToast("Re-submitted to DoFA successfully. Data is now locked.");
      refresh();
    } catch (err) {
      console.error("Re-submit error:", err);
      showToast(err.response?.data?.message || "Submission failed", "error");
    }
  };

  const validateYearForm = () => {
    const { academicYear } = yearForm;
    if (!academicYear) return "Academic year is required";
    if (!/^\d{4}-\d{2}$/.test(academicYear))
      return "Format must be YYYY-YY (e.g. 2025-26)";
    const [start, end] = academicYear.split("-");
    if (parseInt(end) !== (parseInt(start) + 1) % 100)
      return "End year must be start year + 1 (e.g. 2025-26)";
    // cycleNumber is auto-calculated, no validation needed
    return null;
  };

const handleInitiate = async () => {
  const err = validateYearForm();
  if (err) { setYearError(err); return; }
  try {
    setInitiating(true);
    await API.post("/cycle/initiate", {
      academicYear: yearForm.academicYear,
      cycleNumber:  parseInt(yearForm.cycleNumber),
    });
    setYearError("");
    setShowNewCycleForm(false);                         
    setYearForm({
      academicYear: `${currentYear}-${String(currentYear + 1).slice(-2)}`,
      cycleNumber: "",
    });
    await refresh();
  } catch (e) {
    setYearError(e.response?.data?.message || "Failed to initiate cycle");
  } finally {
    setInitiating(false);
  }
};

if (!cycleLoaded) return (
  <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
    Loading…
  </div>
);

if (cycleLoaded && cycleData === null) return (
  <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-5 shadow-sm">
    <div>
      <h2 className="text-lg font-bold text-gray-800">Initiate Recruitment Cycle</h2>
      <p className="text-sm text-gray-500 mt-1">
        Set the academic year and cycle number to begin the recruitment process for your department.
      </p>
    </div>

    {yearError && (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
        {yearError}
      </div>
    )}

    <div>
      <Field label="Academic Year">
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          value={yearForm.academicYear}
          onChange={e => { setYearError(""); setYearForm(f => ({ ...f, academicYear: e.target.value })); }}
          style={{ maxHeight: "200px" }}
        >
          <option value="">— Select Academic Year —</option>
          {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </Field>
    </div>

    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle Number</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{yearForm.cycleNumber || "—"}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Auto-calculated based on previous cycles in {yearForm.academicYear || "selected year"}
        </p>
      </div>
      {/* <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
        {yearForm.cycleNumber || "?"}
      </div> */}
    </div>

    <button
      onClick={handleInitiate}
      disabled={initiating}
      className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
    >
      {initiating ? "Initiating…" : "Initiate Cycle"}
    </button>
  </div>
);

  return (
    <div className="space-y-6">
      {/* ── DOFA Query banner ── */}
      {status === "QUERY" && cycleData?.dofaComment && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-amber-500 text-xl shrink-0">⚠</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Query from DoFA</p>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">{cycleData.dofaComment}</p>
            <p className="text-xs text-amber-600 mt-2">
              Please make the required changes and re-submit below.
            </p>
          </div>
        </div>
      )}

      {/* ── First-time submit ── */}
      {showFirstSubmit && (
        <FinalSubmissionCard
          locked={isFrozen}
          counts={counts}
          onSubmit={handleFirstSubmit}
        />
      )}

      {/* ── Re-submit after QUERY ── */}
      {showReSubmit && (
        <div className="bg-white rounded-xl border border-amber-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">Re-submit to DoFA</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Query responded
              </span>
            </div>
            <span className="text-amber-100 text-xs">Make changes then submit</span>
          </div>
          <div className="px-6 py-5">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 shrink-0">ℹ</span>
              <p className="text-xs text-amber-700">
                DoFA raised a query. You can now edit your candidates and experts.
                Once you have addressed the query, re-submit below.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 mb-4 text-sm">
              <div className="flex gap-6">
                <span>
                  Candidates: <strong className="text-gray-800">{counts.candidates}</strong>
                </span>
                <span>
                  Experts: <strong className="text-gray-800">{counts.experts}</strong>
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleReSubmit}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition shadow-sm"
              >
                Re-submit Everything to DoFA →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Submit appeared ── */}
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
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-3.5 shadow-sm flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cycle Status</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          {cycleData?.academicYear && (
            <>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-gray-500 font-medium">
                📅 {cycleData.academicYear}
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
                Cycle {cycleData.cycleNumber}
              </span>
            </>
          )}

          {/* NEW: Start new cycle — only when current cycle is complete */}
          {(cycleData?.joiningComplete || cycleData?.isClosed) && (
            <button
              onClick={openNewCycleForm}
              className="ml-auto text-xs bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-lg font-medium transition"
            >
              + Start New Cycle
            </button>
          )}
        </div>
      )}

      {/* ✅ NEW: Inline new cycle form */}
      {showNewCycleForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Initiate New Recruitment Cycle</h3>
            <button onClick={() => setShowNewCycleForm(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>

          {yearError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {yearError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                value={yearForm.academicYear}
                onChange={e => {
                  setYearError("");
                  setYearForm(f => ({ ...f, academicYear: e.target.value }));
                }}
              >
                <option value="">— Select Academic Year —</option>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Cycle Number
              </label>
              <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-gray-800">{yearForm.cycleNumber || "—"}</span>
                  <p className="text-xs text-gray-400">Auto-calculated</p>
                </div>
                {yearForm.academicYear && yearForm.cycleNumber && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Cycle {yearForm.cycleNumber} of {yearForm.academicYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNewCycleForm(false)}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleInitiate} disabled={initiating}
              className="text-sm bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-60 transition">
              {initiating ? "Initiating…" : "Initiate Cycle"}
            </button>
          </div>
        </div>
      )}

      {/* ── Overview ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-2 text-gray-800">Overview</h3>
        <p className="text-gray-600 text-sm">
          Welcome to the HoD Portal. Use the sidebar to manage
          candidates and experts. Upload candidate data via CSV or add experts manually.
        </p>
      </div>
        {cycleData?.cycle && cycleData?.status !== "DRAFT" && (
          <SelectionStatusPanel role="HOD" cycle={cycleData.cycle} />
        )}
    </div>
  );
}