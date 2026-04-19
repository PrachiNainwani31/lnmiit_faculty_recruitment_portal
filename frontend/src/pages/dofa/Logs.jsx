import { useEffect, useState } from "react";
import API from "../../api/api";
import * as XLSX from "xlsx";


export default function DofaLogs() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [yearFilter, setYearFilter] = useState("");
  const [cycleFilter,setCycleFilter]= useState("");
  const [deptFilter, setDeptFilter] = useState("");

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
        <p className="text-sm text-gray-500 mt-1">Closed cycles — candidates, experts, referees</p>
      </div>

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
                {log.academicYear} · Cycle {log.cycleNumber} · HOD: {log.hodName}
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
    </div>
  );
}