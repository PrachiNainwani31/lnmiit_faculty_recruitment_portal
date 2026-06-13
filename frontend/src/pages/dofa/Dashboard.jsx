// pages/dofa/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
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
import { showToast, showConfirm } from "../../components/ui/Toast";

// YYYY-MM-DD → DD/MM/YYYY for display
const toDisplay = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// DD/MM/YYYY → YYYY-MM-DD for storage
const toISO = (display) => {
  if (!display) return "";
  const [d, m, y] = display.split("/");
  if (!d || !m || !y || y.length !== 4) return "";
  return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
};

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
    ? new Date(d + "T00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;


function DatePicker({ value, onChange, placeholder = "DD/MM/YYYY" }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const ref = useRef(null);

  // value is YYYY-MM-DD or ""
  const parsed = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00") : null;

  useEffect(() => {
    const now = parsed || new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayVal = parsed
    ? `${String(parsed.getDate()).padStart(2,"0")}/${String(parsed.getMonth()+1).padStart(2,"0")}/${parsed.getFullYear()}`
    : "";

  const MONTHS = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();

  const handleDayClick = (day) => {
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = viewYear !== null ? getDaysInMonth(viewYear, viewMonth) : 0;
  const firstDay    = viewYear !== null ? getFirstDay(viewYear, viewMonth)    : 0;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(v => !v)}
        className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex items-center justify-between focus-within:ring-2 focus-within:ring-indigo-300"
      >
        <span className={displayVal ? "text-gray-800" : "text-gray-400"}>
          {displayVal || placeholder}
        </span>
        <span className="text-gray-400 text-base">📅</span>
      </div>

      {open && viewYear !== null && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-64">
          {/* Month/year nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 font-bold"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isSelected =
                parsed &&
                parsed.getFullYear() === viewYear &&
                parsed.getMonth()    === viewMonth &&
                parsed.getDate()     === day;
              const today = new Date();
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth()    === viewMonth &&
                today.getDate()     === day;
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition
                    ${isSelected
                      ? "bg-indigo-600 text-white"
                      : isToday
                      ? "border border-indigo-400 text-indigo-600"
                      : "text-gray-700 hover:bg-indigo-50"}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
    
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
      showToast(err.response?.data?.message || "Failed to save dates", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasDates = dept.teachingInteractionDate || dept.interviewDate;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">

      {/* ── Date summary row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Teaching:</span>
            {fmtDate(dept.teachingInteractionDate) ? (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                📅 {fmtDate(dept.teachingInteractionDate)}
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Not set</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Interview:</span>
            {fmtDate(dept.interviewDate) ? (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                🗓 {fmtDate(dept.interviewDate)}
              </span>
            ) : (
              <span className="text-xs text-red-400 italic font-medium">
                Not set — HoD cannot mark appeared yet
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setOpen(v => !v)}
          className={`text-xs px-4 py-1.5 rounded-lg font-medium transition border ${
            open
              ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
              : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {open ? "✕ Close" : `${hasDates ? "Edit Dates" : "Set Interview Dates"}`}
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
              <DatePicker
                value={form.teachingInteractionDate}
                onChange={val => setForm(f => ({ ...f, teachingInteractionDate: val }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Interview Date{" "}
                <span className="text-indigo-500 font-medium">
                  (unlocks HoD's Mark Appeared feature)
                </span>
              </label>
              <DatePicker
                value={form.interviewDate}
                onChange={val => setForm(f => ({ ...f, interviewDate: val }))}
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
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleLabel = user.role === "ADoFA" ? "ADoFA" : "DoFA";
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
        <h2 className="text-2xl font-bold text-gray-800">{roleLabel} Dashboard</h2>
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
                  <p className="text-xs text-gray-400 mt-0.5">HoD: {d.hodEmail}</p>
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
                  <p className="text-xs text-gray-400 mb-0.5">Academic Year</p>
                  <p className="font-medium text-gray-700">{d.academicYear || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Cycle</p>
                  <p className="font-medium text-gray-700">
                    {d.cycleNumber ? `Cycle ${d.cycleNumber}` : "—"}
                  </p>
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
                  onClick={() => navigate(`/dofa/experts?hodId=${d.hodId}`)}   // ← d not dept, onClick not href
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
                        const ok = await showConfirm("Approve the details submitted for interview?");
                        if (!ok) return; 
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
                    ⏳ Awaiting HoD response
                  </span>
                )}

                {d.status === "APPROVED" && (
                  <span className="px-4 py-2 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium">
                    ✓ Submission approved
                  </span>
                )}

                {d.status === "INTERVIEW_SET" && (
                  <span className="px-4 py-2 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium">
                    📅 Interview scheduled — HoD marking appeared
                  </span>
                )}

                {d.status === "APPEARED_SUBMITTED" && (
                  <span className="px-4 py-2 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-lg font-medium">
                    ✓ Appeared data submitted by HoD
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
      <SelectionStatusPanel role={localStorage.getItem("role")} />

      {/* Comment modal */}
      <CommentModal
        open={showComment}
        onClose={() => setShowComment(false)}
        onSend={async (text) => {
          await raiseQuery(text, selectedHodId);
          setShowComment(false);
          alert("Query sent to HoD");
        }}
      />
    </div>
  );
}