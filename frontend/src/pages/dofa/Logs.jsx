//dofa/logs.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import * as XLSX from "xlsx";


export default function DofaLogs() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [yearFilter, setYearFilter] = useState("");
  const [cycleFilter,setCycleFilter]= useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [closedDocs, setClosedDocs] = useState([]); 
  const [activeTab, setActiveTab] = useState("cycles");
  const [quotes, setQuotes]       = useState([]);
  useEffect(() => {
    API.get("/expert-travel/closed")   // we'll add this endpoint below
      .then(r => setQuotes(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    API.get("/dofa/closed-cycle-docs")
      .then(r => setClosedDocs(r.data))
      .catch(console.error);
  }, []);

  // helper to match docs to a log entry
  const getDocsForLog = (log) =>
    closedDocs.find(d => d.cycle === log.cycle /* match however your log stores cycle */);
  useEffect(() => {
    const params = new URLSearchParams();
    if (yearFilter)  params.set("academicYear", yearFilter);
    if (cycleFilter) params.set("cycleNumber",  cycleFilter);
    if (deptFilter)  params.set("department",   deptFilter);
    API.get(`/logs?${params.toString()}`)
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [yearFilter, cycleFilter, deptFilter]);

  const years = [...new Set(logs.map(l => l.academicYear).filter(Boolean))].sort().reverse();
  const depts = [...new Set(logs.map(l => l.department).filter(Boolean))].sort();

  const STATUS_COLOR = {
    SELECTED:     "bg-green-100 text-green-700",
    WAITLISTED:   "bg-amber-100 text-amber-700",
    NOT_SELECTED: "bg-gray-100  text-gray-500",
  };

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading logs…</p>;
  const downloadCycleData = (log, type) => {
  let rows = [];
  let sheetName = "";
  let fileName = `${log.department}_${log.academicYear}_Cycle${log.cycleNumber}`;

  if (type === "candidates") {
    sheetName = "Candidates";
    fileName += "_Candidates.xlsx";
    rows = (log.candidates || []).map((c, i) => ({
      "Sr.":           i + 1,
      "Name":          c.fullName || c.name || c.email,
      "Email":         c.email,
      "Qualification": c.highestQualification || "—",
      "Specialization":c.specialization || "—",
      "Status":        c.selectionStatus || "NOT SELECTED",
      "Designation":   c.designation || "—",
      "Employment":    c.employmentType || "—",
      "Appeared":      c.appearedInInterview ? "Yes" : "No",
    }));
  } else if (type === "experts") {
    sheetName = "External Experts";
    fileName += "_Experts.xlsx";
    rows = (log.experts || []).map((e, i) => ({
      "Sr.":           i + 1,
      "Name":          e.fullName,
      "Email":         e.email,
      "Designation":   e.designation,
      "Department":    e.department,
      "Institute":     e.institute,
      "Specialization":e.specialization || "—",
      "Mobile":        e.mobileNo || "—",
    }));
  } else if (type === "referees") {
    sheetName = "Referees";
    fileName += "_Referees.xlsx";
    rows = (log.referees || []).map((r, i) => ({
      "Sr.":        i + 1,
      "Name":       `${r.salutation || ""} ${r.name || ""}`.trim(),
      "Email":      r.email,
      "Designation":r.designation || "—",
      "Department": r.department || "—",
      "Institute":  r.institute || "—",
      "Status":     r.status || "PENDING",
    }));
  } else if (type === "all") {
    // Multi-sheet workbook
    const wb = XLSX.utils.book_new();

    const candRows = (log.candidates || []).map((c, i) => ({
      "Sr.": i+1, "Name": c.fullName||c.name||c.email, "Email": c.email,
      "Status": c.selectionStatus||"NOT SELECTED", "Designation": c.designation||"—",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(candRows), "Candidates");

    const expRows = (log.experts || []).map((e, i) => ({
      "Sr.": i+1, "Name": e.fullName, "Email": e.email,
      "Designation": e.designation, "Institute": e.institute,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), "Experts");

    const refRows = (log.referees || []).map((r, i) => ({
      "Sr.": i+1,
      "Name": `${r.salutation||""} ${r.name||""}`.trim(),
      "Email": r.email, "Institute": r.institute||"—", "Status": r.status||"PENDING",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(refRows), "Referees");

    XLSX.writeFile(wb, `${fileName}_Full.xlsx`);
    return;
  }

  if (!rows.length) return alert("No data to export.");
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]).map(k => ({
    wch: Math.max(k.length, ...rows.map(r => String(r[k]||"").length), 10),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};
  return (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Recruitment Logs</h2>
      <p className="text-sm text-gray-500 mt-1">Closed cycles — candidates, experts, referees, quotes</p>
    </div>

    {/* ── Tabs ── */}
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
      {[
        { id: "cycles", label: "Cycle Logs" },
        { id: "quotes", label: "Quote History" },
      ].map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === t.id ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
          }`}>
          {t.label}
        </button>
      ))}
    </div>

    {/* ══ CYCLE LOGS TAB ══ */}
    {activeTab === "cycles" && (
      <>
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Academic Year</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[140px]">
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</label>
            <input type="number" min="1" max="10" placeholder="Any"
              value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</label>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[130px]">
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {logs.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">
            No closed cycles found matching the filters.
          </div>
        )}

        {logs.map(log => (
        <div key={log.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
                <span className="text-white font-bold text-sm">{log.department}</span>
                <span className="text-gray-400 text-xs ml-3">
                {log.academicYear} · Cycle {log.cycleNumber} · HoD: {log.hodName}
                </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Count badges */}
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200 font-medium">
                {log.candidates?.length || 0} candidates
                </span>
                <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full border border-amber-200 font-medium">
                {log.experts?.length || 0} experts
                </span>
                <span className="bg-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full border border-violet-200 font-medium">
                {log.referees?.length || 0} referees
                </span>

                {log.closedAt && (
                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-200 font-medium">
                    Closed {new Date(log.closedAt).toLocaleDateString("en-GB")}
                </span>
                )}

                {/* Download dropdown */}
                <div className="relative group">
                <button className="bg-white text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200 font-medium hover:bg-gray-50 flex items-center gap-1.5 transition">
                    ↓ Download
                    <span className="text-gray-400">▾</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] hidden group-hover:block">
                    <button onClick={() => downloadCycleData(log, "all")}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-semibold border-b border-gray-100">
                    ↓ Full Report (All Sheets)
                    </button>
                    <button onClick={() => downloadCycleData(log, "candidates")}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50">
                    ↓ Candidates List
                    </button>
                    <button onClick={() => downloadCycleData(log, "experts")}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50">
                    ↓ External Experts
                    </button>
                    <button onClick={() => downloadCycleData(log, "referees")}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50">
                    ↓ Referees
                    </button>
                </div>
                </div>
            </div>
            </div>

          <div className="p-5 space-y-5">
            {/* Candidates */}
            <details open>
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                Candidates ({log.candidates.length})
              </summary>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b">
                    {["Sr","Name","Email","Qualification","Specialization","Status","Designation"].map(h =>
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {log.candidates.map((c, i) => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="px-3 py-2 text-gray-400">{i+1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{c.fullName}</td>
                        <td className="px-3 py-2 text-blue-600">{c.email}</td>
                        <td className="px-3 py-2 text-gray-600">{c.qualification}</td>
                        <td className="px-3 py-2 text-gray-600">{c.specialization}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.selectionStatus] || STATUS_COLOR.NOT_SELECTED}`}>
                            {c.selectionStatus?.replace("_"," ") || "Not Selected"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{c.designation || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {/* Experts */}
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                External Experts ({log.experts.length})
              </summary>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b">
                    {["Name","Email","Designation","Department","Institute","Specialization"].map(h =>
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {log.experts.map(e => (
                      <tr key={e.id} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{e.fullName}</td>
                        <td className="px-3 py-2 text-blue-600">{e.email}</td>
                        <td className="px-3 py-2 text-gray-600">{e.designation}</td>
                        <td className="px-3 py-2 text-gray-600">{e.department}</td>
                        <td className="px-3 py-2 text-gray-600">{e.institute}</td>
                        <td className="px-3 py-2 text-gray-600">{e.specialization || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
                    {(() => {
  const docEntry = closedDocs.find(d =>
    d.department === log.department && d.cycle === `${log.academicYear}-C${log.cycleNumber}`
  );
  if (!docEntry?.candidates?.length) return null;

  const DOCS_LIST = [
    { key: "cv",                label: "CV" },
    { key: "teachingStatement", label: "Teaching Statement" },
    { key: "researchStatement", label: "Research Statement" },
    { key: "marks10",           label: "10th Marksheet" },
    { key: "marks12",           label: "12th Marksheet" },
    { key: "graduation",        label: "Graduation Cert" },
    { key: "postGraduation",    label: "Post Graduation Cert" },
    { key: "phdCourseWork",     label: "PhD Course Work" },
    { key: "phdProvisional",    label: "PhD Provisional" },
    { key: "phdDegree",         label: "PhD Degree" },
    { key: "thesisSubmission",  label: "Thesis Submission" },
  ];

  const VERDICT_BADGE = {
    Correct:   "bg-green-100 text-green-700 border-green-200",
    Incorrect: "bg-red-100 text-red-700 border-red-200",
    Missing:   "bg-yellow-100 text-yellow-700 border-yellow-200",
    Pending:   "bg-blue-50 text-blue-600 border-blue-200",
  };

  const BASE = import.meta.env.VITE_API_URL;

  return (
    <details>
      <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
        📄 Submitted Documents ({docEntry.candidates.length} candidates)
      </summary>
      <div className="space-y-4 mt-2">
        {docEntry.candidates.map((cand, ci) => (
          <details key={cand.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 bg-gray-50 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100">
              <span>{ci + 1}. {cand.name} <span className="text-gray-400 font-normal">— {cand.email}</span></span>
              <div className="flex gap-1.5 ml-4 flex-wrap">
                {["Correct","Incorrect","Missing"].map(s => {
                  const cnt = DOCS_LIST.filter(d => cand.verdicts?.[d.key]?.status === s).length;
                  if (!cnt) return null;
                  return (
                    <span key={s} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${VERDICT_BADGE[s]}`}>
                      {cnt} {s}
                    </span>
                  );
                })}
              </div>
            </summary>

            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-400 uppercase tracking-wide font-semibold">
                    <th className="pb-2 pr-4 text-left">#</th>
                    <th className="pb-2 pr-4 text-left">Document</th>
                    <th className="pb-2 pr-4 text-left">File</th>
                    <th className="pb-2 pr-4 text-left">Verdict</th>
                    <th className="pb-2 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {DOCS_LIST.map((doc, i) => {
                    const file    = cand.documents?.[doc.key];
                    const verdict = cand.verdicts?.[doc.key];
                    const status  = verdict?.status || "Pending";
                    return (
                      <tr key={doc.key} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-4 font-medium text-gray-700">{doc.label}</td>
                        <td className="py-2 pr-4">
                          {file ? (
                            <a href={`${BASE}/${file}`} target="_blank" rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded">
                              📄 {file.split(/[/\\]/).pop()}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">Not uploaded</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full border font-medium ${VERDICT_BADGE[status] || VERDICT_BADGE.Pending}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500 italic">{verdict?.remark || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Multi-file docs */}
              {[
                { key: "bestPapers", label: "Best Papers" },
                { key: "salarySlips", label: "Salary Slips" },
                { key: "researchExpCerts", label: "Research Exp Certs" },
                { key: "teachingExpCerts", label: "Teaching Exp Certs" },
                { key: "industryExpCerts", label: "Industry Exp Certs" },
                { key: "otherDocs", label: "Other Docs" },
              ].map(md => {
                const files = cand.documents?.[md.key];
                if (!files?.length) return null;
                return (
                  <div key={md.key} className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {md.label} ({files.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, fi) => {
                        const fp   = typeof f === "string" ? f : f?.file;
                        const name = typeof f === "object" && f?.name ? f.name : `File ${fi + 1}`;
                        if (!fp) return null;
                        return (
                          <a key={fi} href={`${BASE}/${fp}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded hover:underline">
                            📄 {name}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Referees */}
              {cand.referees?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Referees ({cand.referees.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cand.referees.map((r, ri) => (
                      <span key={ri} className={`text-xs px-3 py-1 rounded-full border font-medium ${
                        r.status === "SUBMITTED"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}>
                        {r.name || r.email} — {r.status}
                        {r.status === "SUBMITTED" && r.letter && (
                          <a href={`${BASE}/${r.letter}`} target="_blank" rel="noreferrer"
                            className="ml-1 underline">📄</a>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
})()}
            {/* Referees */}
            {log.referees.length > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 mb-2">
                  Referees ({log.referees.length})
                </summary>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead><tr className="bg-gray-50 border-b">
                      {["Name","Email","Institute","Status"].map(h =>
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {log.referees.map(r => (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                          <td className="px-3 py-2 text-blue-600">{r.email}</td>
                          <td className="px-3 py-2 text-gray-600">{r.institute}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                              r.status === "SUBMITTED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        </div>
      ))}
      </>
    )}

    {/* ══ QUOTE HISTORY TAB ══ */}
    {activeTab === "quotes" && (
      <div className="space-y-4">
        {quotes.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
            No quote history from closed cycles.
          </div>
        )}
        {quotes.map(({ expert, travel }) => {
          const q = travel?.quote;
          if (!q) return null;
          return (
            <div key={expert.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">{expert.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {expert.institute} · {travel.modeOfTravel || "—"} · Cycle: {expert.cycle}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  q.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" :
                  q.status === "REJECTED" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>{q.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                <div><p className="text-xs text-gray-400">Amount</p>
                  <p className="font-semibold text-gray-800">₹{q.amount}</p></div>
                <div><p className="text-xs text-gray-400">Vendor</p>
                  <p className="text-gray-700">{q.vendor || "—"}</p></div>
                <div><p className="text-xs text-gray-400">Remarks</p>
                  <p className="text-gray-700">{q.remarks || "—"}</p></div>
                {q.approvedAt && (
                  <div><p className="text-xs text-gray-400">
                    {q.status === "APPROVED" ? "Approved" : "Decided"} by
                  </p>
                  <p className="text-gray-700">{q.approvedBy} · {new Date(q.approvedAt).toLocaleDateString("en-GB")}</p>
                  </div>
                )}
                {q.rejectionNote && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Rejection Note</p>
                    <p className="text-red-600">{q.rejectionNote}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);}