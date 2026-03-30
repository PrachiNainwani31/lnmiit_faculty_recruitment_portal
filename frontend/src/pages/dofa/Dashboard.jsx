// pages/dofa/Dashboard.jsx
import { useEffect, useState } from "react";
import {
  raiseQuery,
  getDofaDashboard,
  downloadDepartmentResumes,
  approveCycle,
  setInterviewDates,
} from "../../api/dofaApi";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/ui/SummaryCard";
import CommentModal from "../../components/dofa/CommentModal";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";

/* ── All possible stages in order ── */
const STAGES = [
  { key: "DRAFT",              label: "Draft"       },
  { key: "SUBMITTED",          label: "Submitted"   },
  { key: "QUERY",              label: "Query"       },
  { key: "APPROVED",           label: "Approved"    },
  { key: "INTERVIEW_SET",      label: "Scheduled"   },
  { key: "APPEARED_SUBMITTED", label: "Appeared"    },
];

const STATUS_ORDER = STAGES.map(s => s.key);

/* ── Format a DATEONLY string nicely ── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

/* ── Date input row — collapsible, shown for APPROVED and beyond ── */
function DateInputRow({ dept, onSaved }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({
    teachingInteractionDate: dept.teachingInteractionDate
      ? dept.teachingInteractionDate.slice(0, 10)
      : "",
    interviewDate: dept.interviewDate
      ? dept.interviewDate.slice(0, 10)
      : "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await setInterviewDates({
        hodId:                   dept.hodId,
        teachingInteractionDate: form.teachingInteractionDate || null,
        interviewDate:           form.interviewDate           || null,
      });
      onSaved();
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save dates");
    } finally {
      setSaving(false);
    }
  };

  const hasDates = dept.teachingInteractionDate || dept.interviewDate;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">

      {/* ── Date summary row — always visible ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          {/* Teaching interaction */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Teaching:
            </span>
            {fmtDate(dept.teachingInteractionDate) ? (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                📅 {fmtDate(dept.teachingInteractionDate)}
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Not set</span>
            )}
          </div>

          {/* Interview date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Interview:
            </span>
            {fmtDate(dept.interviewDate) ? (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                🗓 {fmtDate(dept.interviewDate)}
              </span>
            ) : (
              <span className="text-xs text-red-400 italic font-medium">
                Not set — HOD cannot mark appeared yet
              </span>
            )}
          </div>
        </div>

        {/* Edit toggle */}
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
        >
          {open ? "▲ Close" : `✏ ${hasDates ? "Edit" : "Set"} Dates`}
        </button>
      </div>

      {/* ── Expanded edit form ── */}
      {open && (
        <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
          <p className="text-xs text-indigo-600 font-semibold mb-3 uppercase tracking-wide">
            Set Interview Schedule — {dept.department}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Teaching Interaction Date
              </label>
              <input
                type="date"
                value={form.teachingInteractionDate}
                onChange={e => setForm(f => ({ ...f, teachingInteractionDate: e.target.value }))}
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Interview Date{" "}
                <span className="text-indigo-500 font-medium">
                  (unlocks HOD's "Mark Appeared")
                </span>
              </label>
              <input
                type="date"
                value={form.interviewDate}
                onChange={e => setForm(f => ({ ...f, interviewDate: e.target.value }))}
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3 gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Dates"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const [data,          setData]          = useState(null);
  const [showComment,   setShowComment]   = useState(false);
  const [selectedHodId, setSelectedHodId] = useState(null);
  const navigate = useNavigate();

  const load = () =>
    getDofaDashboard().then(res => setData(res.data)).catch(console.error);

  useEffect(() => { load(); }, []);

  if (!data)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading dashboard…
      </div>
    );

  const handleDownload = async (dept) => {
    try {
      const res  = await downloadDepartmentResumes(dept);
      const blob = new Blob([res.data], { type: "application/zip" });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${dept}_resumes.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No resumes uploaded for this department");
    }
  };

  return (
    <div className="space-y-8">

      {/* ── Page title ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">DOFA Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review department submissions and manage recruitment schedule
        </p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Pending Review"   value={data.summary.pending}         />
        <SummaryCard title="Total Candidates" value={data.summary.totalCandidates} />
        <SummaryCard title="Total Experts"    value={data.summary.totalExperts}    />
        <SummaryCard title="Approved"         value={data.summary.approved}        />
      </div>

      {/* ── Department cards ── */}
      <div className="space-y-5">
        {data.departments?.map(d => {

          const currentIdx = STATUS_ORDER.indexOf(d.status);

          return (
            <div
              key={d.department}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              {/* ── Header row ── */}
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{d.department}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">HOD: {d.hodEmail}</p>
                </div>

                {/* ── 6-stage stepper ── */}
                <div className="flex items-center gap-0 flex-wrap">
                  {STAGES.map((stage, i, arr) => {
                    const stageIdx  = STATUS_ORDER.indexOf(stage.key);
                    const isDone    = stageIdx < currentIdx;
                    const isCurrent = stageIdx === currentIdx;
                    return (
                      <div key={stage.key} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                            isDone    ? "bg-green-500  border-green-500  text-white" :
                            isCurrent ? "bg-blue-600   border-blue-600   text-white" :
                                        "bg-white      border-gray-200   text-gray-400"
                          }`}>
                            {isDone ? "✓" : i + 1}
                          </div>
                          <p className={`text-xs mt-1 whitespace-nowrap font-medium ${
                            isCurrent ? "text-blue-600"  :
                            isDone    ? "text-green-600" :
                                        "text-gray-400"
                          }`}>
                            {stage.label}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`h-0.5 w-8 mx-1 mb-4 rounded-full ${
                            isDone ? "bg-green-300" : "bg-gray-200"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Info grid ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Position</p>
                  <p className="font-medium text-gray-700">{d.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Candidates</p>
                  <p className="font-medium text-gray-700">{d.candidates}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Appeared</p>
                  <p className={`font-medium ${d.appeared > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {d.appeared > 0 ? `${d.appeared} / ${d.candidates}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Experts</p>
                  <p className="font-medium text-gray-700">{d.experts}</p>
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  onClick={() => navigate(`/dofa/candidates?dept=${d.department}`)}
                  className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                >
                  View Candidates
                </button>
                <button
                  onClick={() => navigate(`/dofa/experts?dept=${d.department}`)}
                  className="px-4 py-2 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium transition"
                >
                  View Experts
                </button>
                <button
                  onClick={() => handleDownload(d.department)}
                  className="px-4 py-2 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition"
                >
                  Download Resumes
                </button>

                {d.status === "SUBMITTED" && (
                  <>
                    <button
                      onClick={() => { setSelectedHodId(d.hodId); setShowComment(true); }}
                      className="px-4 py-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition"
                    >
                      Raise Query
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Approve ${d.department} submission?`)) return;
                        try { await approveCycle(d.hodId); load(); }
                        catch { alert("Failed to approve"); }
                      }}
                      className="px-4 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      Approve
                    </button>
                  </>
                )}

                {d.status === "QUERY" && (
                  <span className="px-4 py-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium">
                    ⏳ Awaiting HOD response
                  </span>
                )}

                {d.status === "APPROVED" && (
                  <span className="px-4 py-2 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium">
                    ✓ Submission approved
                  </span>
                )}

                {d.status === "INTERVIEW_SET" && (
                  <span className="px-4 py-2 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium">
                    📅 Interview scheduled — HOD marking appeared
                  </span>
                )}

                {d.status === "APPEARED_SUBMITTED" && (
                  <span className="px-4 py-2 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg font-medium">
                    ✓ Appeared data submitted by HOD
                  </span>
                )}
              </div>

              {/* ── Date section — visible for APPROVED and all later stages ── */}
              {["APPROVED","INTERVIEW_SET","APPEARED_SUBMITTED"].includes(d.status) && (
                <DateInputRow dept={d} onSaved={load} />
              )}
            </div>
          );
        })}
      </div>

      <SelectionStatusPanel role="DOFA" />

      {/* Comment modal */}
      <CommentModal
        open={showComment}
        onClose={() => setShowComment(false)}
        onSend={async (text) => {
          await raiseQuery(text, selectedHodId);
          setShowComment(false);
          alert("Query sent to HOD");
        }}
      />
    </div>
  );
}