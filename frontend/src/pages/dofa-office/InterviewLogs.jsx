// pages/dofa-office/InterviewLogs.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import * as XLSX from "xlsx";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "";

const calcExp = (from, to) => {
  if (!from || !to) return null;
  const f = new Date(from);
  const t = new Date(to);
  if (t <= f) return null;
  let years = t.getFullYear() - f.getFullYear();
  let months = t.getMonth() - f.getMonth();
  let days = t.getDate() - f.getDate();
  if (days   < 0) { months--; days += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years  > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days   > 0) parts.push(`${days}d`);
  return parts.length ? parts.join(" ") : null;
};

const TYPE_COLORS = {
  Research: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Teaching: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Industry: "bg-amber-50 text-amber-700 border-amber-200",
  Other:    "bg-gray-50 text-gray-600 border-gray-200",
};

/* ── Inline cells ── */
function Cell({ value, onChange, type = "text", readOnly = false, placeholder = "", minWidth = "120px" }) {
  return (
    <input type={type} value={value || ""} readOnly={readOnly}
      placeholder={placeholder || (readOnly ? "—" : "")}
      onChange={e => !readOnly && onChange(e.target.value)}
      style={{ minWidth }}
      className={`w-full px-2 py-1.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded ${
        readOnly ? "bg-gray-100 text-gray-600 cursor-default" : "bg-white text-gray-800"
      }`}
    />
  );
}

function TextCell({ value, onChange, readOnly = false, placeholder = "", minWidth = "150px" }) {
  return (
    <textarea value={value || ""} readOnly={readOnly} placeholder={placeholder} rows={2}
      onChange={e => !readOnly && onChange(e.target.value)}
      style={{ minWidth }}
      className={`w-full px-2 py-1.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded resize-none ${
        readOnly ? "bg-gray-100 text-gray-600 cursor-default" : "bg-white text-gray-800"
      }`}
    />
  );
}

/* ── Experience table for a single candidate ── */
function ExperienceCell({ cand, onUpdateToDate }) {
  if (!cand) return <div className="px-2 py-2 text-xs text-gray-400 italic min-w-[500px]">—</div>;

  const exps = cand.experiences || [];
  if (exps.length === 0) {
    return <div className="px-2 py-2 text-xs text-gray-400 italic min-w-[500px]">No experience entries</div>;
  }

  return (
    <table className="w-full text-xs border-collapse min-w-[500px]">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-2 py-1 text-left text-gray-400 font-medium w-24">Type</th>
          <th className="px-2 py-1 text-left text-gray-400 font-medium w-40">Organisation</th>
          <th className="px-2 py-1 text-left text-gray-400 font-medium w-28">From</th>
          <th className="px-2 py-1 text-left text-gray-500 font-semibold w-32">
            To <span className="text-indigo-500">(edit)</span>
          </th>
          <th className="px-2 py-1 text-left text-gray-400 font-medium w-20">Duration</th>
        </tr>
      </thead>
      <tbody>
        {exps.map((exp, ei) => {
          const effectiveTo = exp.editedToDate || exp.toDate || "";
          const duration    = calcExp(exp.fromDate, effectiveTo);
          const typeColor   = TYPE_COLORS[exp.type] || TYPE_COLORS.Other;
          return (
            <tr key={ei} className="border-t border-gray-100 hover:bg-gray-50/50">
              <td className="px-2 py-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor}`}>
                  {exp.type || "Other"}
                </span>
              </td>
              <td className="px-2 py-1.5 text-gray-700 max-w-[150px] truncate" title={exp.organization}>
                {exp.organization || "—"}
              </td>
              <td className="px-2 py-1.5">
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                  {exp.fromDate ? fmtDate(exp.fromDate) : "—"}
                </span>
              </td>
              <td className="px-1 py-1">
                <input type="date"
                  value={exp.editedToDate || exp.toDate || ""}
                  onChange={e => onUpdateToDate(ei, e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white text-gray-800"
                />
              </td>
              <td className="px-2 py-1.5">
                {duration ? (
                  <span className="bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {duration}
                  </span>
                ) : <span className="text-gray-300 text-xs">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Column definitions ── */
// Shared columns (span all candidate rows for a department)
const SHARED_COLS = [
  ["interviewDate",            "Date of Faculty Interview",           "date",   true,  "140px"],
  ["department",               "Department",                          "text",   true,  "100px"],
  ["noOfApplications",         "Total Applications Received",        "number", true,  "130px"],
  ["noOfIlscShortlisted",      "Shortlisted in ILSC",                "number", true,  "130px"],
  ["noOfDlscShortlisted",      "Shortlisted in DLSC",                "number", true,  "130px"],
  ["noForTeachingPresentation","No. Present for Teaching",           "number", false, "130px"],
  ["noShortlistedForInterview","No. Shortlisted for Interview",      "number", false, "130px"],
  ["noForPersonalInterview",   "No. Present for Personal Interview", "number", true,  "130px"],
  ["expert1Name",              "Name of Expert 1",                   "text",   false, "160px"],
  ["expert1Detail",            "Detail 1",                           "text",   false, "200px"],
  ["expert2Name",              "Name of Expert 2",                   "text",   false, "160px"],
  ["expert2Detail",            "Detail 2",                           "text",   false, "200px"],
];

const EXPERT3_COLS = [
  ["expert3Name",   "Name of Expert 3", "text", false, "160px"],
  ["expert3Detail", "Detail 3",         "text", false, "200px"],
];

const AFTER_COLS = [
  ["evaluationSheetLink", "Evaluation Sheet Link",       "url",  false, "200px"],
  ["advCopyDate",         "Adv. Copy Date",              "date", false, "130px"],
  ["advCopyLink",         "Advertisement Copy Link",     "url",  false, "200px"],
  ["committeeLink",       "Committee Office Order Link", "url",  false, "200px"],
  ["remark",              "Remark",                      "text", false, "200px"],
];

export default function InterviewLogs() {
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);
  const [exporting,   setExporting]   = useState(false);
  const [dateFilter,  setDateFilter]  = useState("");
  // ✅ Track expert count per department row (default 2, expandable)
  const [expertCounts, setExpertCounts] = useState({});

  const getExpertCount = (hodId) => expertCounts[hodId] || 2;
  const addExpert      = (hodId) => setExpertCounts(p => ({
    ...p, [hodId]: Math.min((p[hodId] || 2) + 1, 10),
  }));

  const load = () => {
    setLoading(true);
    API.get("/interview-logs")
      .then(res => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ── Cell update helpers ── */
  const updateCell = (hodId, key, value) =>
    setRows(prev => prev.map(r => r.hodId === hodId ? { ...r, [key]: value } : r));

  const updateCandDesignation = (hodId, candIdx, value) =>
    setRows(prev => prev.map(r => {
      if (r.hodId !== hodId) return r;
      const updated = (r.candidateExperiences || []).map((c, i) =>
        i === candIdx ? { ...c, designation: value } : c
      );
      return { ...r, candidateExperiences: updated };
    }));

  const updateExpToDate = (hodId, candIdx, expIdx, value) =>
    setRows(prev => prev.map(r => {
      if (r.hodId !== hodId) return r;
      const updated = (r.candidateExperiences || []).map((sc, si) => {
        if (si !== candIdx) return sc;
        return {
          ...sc,
          experiences: (sc.experiences || []).map((e, ei) =>
            ei === expIdx ? { ...e, editedToDate: value } : e
          ),
        };
      });
      return { ...r, candidateExperiences: updated };
    }));

  const handleSave = async (row) => {
    try {
      setSaving(row.hodId);
      await API.post("/interview-logs", row);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
      setSaving(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res  = await API.get("/interview-logs/export");
      const data = res.data;
      if (!data.length) return alert("No data to export");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Interview Logs");
      ws["!cols"] = Object.keys(data[0]).map(k => ({
        wch: Math.max(k.length, ...data.map(r => String(r[k] || "").length), 10),
      }));
      XLSX.writeFile(wb, `Faculty_Interview_Records_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch { alert("Export failed"); }
    finally { setExporting(false); }
  };

  const uniqueDates = [...new Set(rows.map(r => r.interviewDate).filter(Boolean))].sort();
  const filtered    = dateFilter ? rows.filter(r => r.interviewDate === dateFilter) : rows;

  // ✅ Determine if ANY row has expert 3 — drives thead rendering
  const anyExpert3 = filtered.some(r => getExpertCount(r.hodId) >= 3);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading interview logs…</p>;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Faculty Interview Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            One row per candidate (selected / waitlisted). Shared columns span all rows per department.
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {uniqueDates.length > 0 && (
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">All interview dates</option>
              {uniqueDates.map(d => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          )}
          <button onClick={handleExport} disabled={exporting}
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
            {exporting ? "Exporting…" : "↓ Download Excel"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block"/>
          Auto-filled (read-only)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block"/>
          Editable
        </span>
        <span className="flex items-center gap-2">
          {Object.entries(TYPE_COLORS).map(([type, cls]) => (
            <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
              {type}
            </span>
          ))}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-14 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No records yet. Appears once DOFA sets interview dates and HODs submit appeared data.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs" style={{ minWidth: "3600px" }}>
              <thead>
                <tr className="bg-[#6b0f1a]">
                  <th className="sticky left-0 z-20 bg-[#6b0f1a] px-3 py-3 text-left text-white font-semibold whitespace-nowrap border-r border-white/20 min-w-[40px]">
                    Sr.
                  </th>

                  {/* Shared column headers */}
                  {SHARED_COLS.map(([key, label,,,minW]) => (
                    <th key={key} style={{ minWidth: minW }}
                      className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap border-r border-white/20">
                      {label}
                    </th>
                  ))}

                  {/* Expert 3 header — only if any row needs it */}
                  {anyExpert3 && EXPERT3_COLS.map(([key, label,,,minW]) => (
                    <th key={key} style={{ minWidth: minW }}
                      className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap border-r border-white/20">
                      {label}
                    </th>
                  ))}

                  {/* "Add Expert" placeholder header when not yet shown */}
                  {!anyExpert3 && (
                    <th className="px-3 py-3 text-left text-white/60 font-semibold whitespace-nowrap border-r border-white/20 min-w-[120px]">
                      Expert 3 (optional)
                    </th>
                  )}

                  {/* Per-candidate headers */}
                  <th className="px-3 py-3 text-left text-white font-semibold border-r border-white/20 min-w-[160px]">
                    Candidate
                  </th>
                  <th className="px-3 py-3 text-left text-white font-semibold border-r border-white/20 min-w-[160px]">
                    For the Post of
                  </th>
                  <th className="px-3 py-3 text-left text-white font-semibold border-r border-white/20 min-w-[560px]">
                    Total Experience — <span className="text-indigo-200">To Date editable</span>
                  </th>

                  {/* After-exp headers */}
                  {AFTER_COLS.map(([key, label,,,minW]) => (
                    <th key={key} style={{ minWidth: minW }}
                      className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap border-r border-white/20">
                      {label}
                    </th>
                  ))}

                  <th className="px-3 py-3 text-center text-white font-semibold whitespace-nowrap min-w-[80px]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row, idx) => {
                  const isSaving    = saving === row.hodId;
                  const bg          = idx % 2 === 0 ? "bg-white" : "bg-gray-50/40";
                  const candidates  = row.candidateExperiences || [];
                  const showExpert3 = getExpertCount(row.hodId) >= 3;

                  // ✅ One table row per candidate; if none, still render one empty row
                  const candRows = candidates.length > 0 ? candidates : [null];
                  const rowSpan  = candRows.length;

                  return candRows.map((cand, candIdx) => {
                    const isFirst = candIdx === 0;

                    return (
                      <tr key={`${row.hodId}-${candIdx}`}
                        className={`border-b border-gray-100 ${bg}`}>

                        {/* Sr — only on first candidate row, spans all */}
                        {isFirst && (
                          <td rowSpan={rowSpan}
                            className={`sticky left-0 z-10 px-3 py-2 text-gray-400 border-r border-gray-100 font-medium align-top ${bg}`}>
                            {idx + 1}
                          </td>
                        )}

                        {/* ── Shared (department-level) cells — only first row, rowSpan ── */}
                        {isFirst && SHARED_COLS.map(([key, , type, readOnly]) => (
                          <td key={key} rowSpan={rowSpan}
                            className="border-r border-gray-100 p-0.5 align-top">
                            {key.includes("Detail") ? (
                              <TextCell value={row[key]} readOnly={readOnly} minWidth="190px"
                                onChange={v => updateCell(row.hodId, key, v)} />
                            ) : (
                              <Cell type={type} readOnly={readOnly}
                                value={type === "date" && row[key] ? row[key].toString().slice(0,10) : row[key]}
                                onChange={v => updateCell(row.hodId, key, v)} />
                            )}
                          </td>
                        ))}

                        {/* Expert 3 cells — only first row */}
                        {isFirst && showExpert3 && EXPERT3_COLS.map(([key, , type, readOnly]) => (
                          <td key={key} rowSpan={rowSpan}
                            className="border-r border-gray-100 p-0.5 align-top">
                            {key.includes("Detail") ? (
                              <TextCell value={row[key]} readOnly={readOnly} minWidth="190px"
                                onChange={v => updateCell(row.hodId, key, v)} />
                            ) : (
                              <Cell type={type} readOnly={readOnly} value={row[key]}
                                onChange={v => updateCell(row.hodId, key, v)} />
                            )}
                          </td>
                        ))}

                        {/* Add Expert 3 button — only first row, when not yet added */}
                        {isFirst && !showExpert3 && (
                          <td rowSpan={rowSpan} className="border-r border-gray-100 p-2 align-top">
                            <button onClick={() => addExpert(row.hodId)}
                              className="text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-2 py-1 rounded whitespace-nowrap transition">
                              + Add Expert 3
                            </button>
                          </td>
                        )}

                        {/* ── Per-candidate cells ── */}

                        {/* Candidate name + status badge */}
                        <td className="border-r border-gray-100 px-2 py-1.5 align-top min-w-[160px]">
                          {cand ? (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-800">{cand.candidateName}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                cand.status === "SELECTED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {cand.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No candidates</span>
                          )}
                        </td>

                        {/* For the Post of — pre-filled from designation in SelectedCandidate, editable */}
                        <td className="border-r border-gray-100 p-0.5 align-top min-w-[160px]">
                          <Cell
                            value={cand?.designation || ""}
                            readOnly={false}
                            placeholder="e.g. Assistant Professor"
                            onChange={v => updateCandDesignation(row.hodId, candIdx, v)}
                          />
                        </td>

                        {/* Experience breakdown — per candidate, to-date editable */}
                        <td className="border-r border-gray-100 p-0 align-top">
                          <ExperienceCell
                            cand={cand}
                            onUpdateToDate={(ei, val) => updateExpToDate(row.hodId, candIdx, ei, val)}
                          />
                        </td>

                        {/* After-exp cells — only first row, rowSpan */}
                        {isFirst && AFTER_COLS.map(([key, , type, readOnly]) => (
                          <td key={key} rowSpan={rowSpan}
                            className="border-r border-gray-100 p-0.5 align-top">
                            {key === "remark" ? (
                              <TextCell value={row[key]} readOnly={readOnly} minWidth="190px"
                                onChange={v => updateCell(row.hodId, key, v)} />
                            ) : key.includes("Link") ? (
                              <div className="flex items-center gap-1 px-1">
                                <input type="url" value={row[key] || ""} placeholder="https://…"
                                  onChange={e => updateCell(row.hodId, key, e.target.value)}
                                  className="w-full min-w-[180px] px-2 py-1.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded bg-white text-blue-600" />
                                {row[key] && (
                                  <a href={row[key]} target="_blank" rel="noreferrer"
                                    className="text-blue-500 hover:text-blue-700 shrink-0">↗</a>
                                )}
                              </div>
                            ) : (
                              <Cell type={type} readOnly={readOnly}
                                value={type === "date" && row[key] ? row[key].toString().slice(0,10) : row[key]}
                                onChange={v => updateCell(row.hodId, key, v)} />
                            )}
                          </td>
                        ))}

                        {/* Save — only first row, rowSpan */}
                        {isFirst && (
                          <td rowSpan={rowSpan} className="px-2 py-2 text-center align-middle">
                            <button onClick={() => handleSave(row)} disabled={isSaving}
                              className="bg-[#6b0f1a] hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60 transition whitespace-nowrap">
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">← Scroll horizontally to see all columns →</p>
      )}
    </div>
  );
}