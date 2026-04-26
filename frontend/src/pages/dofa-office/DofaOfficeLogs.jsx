import { useEffect, useState } from "react";
import API from "../../api/api";
import * as XLSX from "xlsx";
const BASE = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────
   TAB 1 — All Candidates (every status)
───────────────────────────────────────────── */
function AllCandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    API.get("/selected-candidates/logs/all")
      .then(res => setCandidates(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-4">Loading candidates…</p>;
  if (!candidates.length)
    return <p className="text-gray-400 text-sm p-4">No candidates found.</p>;

  const depts = ["ALL", ...new Set(candidates.map(c => c.department).filter(Boolean))];
  const statuses = ["ALL", "SELECTED", "WAITLISTED", "NOT_SELECTED", "REJECTED"];

  const filtered = candidates.filter(c => {
    const matchSearch = !search ||
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept   = filterDept   === "ALL" || c.department === filterDept;
    const matchStatus = filterStatus === "ALL" || c.selectionStatus === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  const statusStyle = {
    SELECTED:     "bg-green-100 text-green-700 border-green-200",
    WAITLISTED:   "bg-amber-100 text-amber-700 border-amber-200",
    NOT_SELECTED: "bg-gray-100  text-gray-500  border-gray-200",
    REJECTED:     "bg-red-100   text-red-600   border-red-200",
  };

  // Summary counts
  const counts = statuses.slice(1).reduce((acc, s) => {
    acc[s] = candidates.filter(c => c.selectionStatus === s).length;
    return acc;
  }, {});
const downloadByDeptCycle = () => {
  const wb = XLSX.utils.book_new();

  // Group candidates by "dept__cycle"
  const groups = {};
  candidates.forEach(c => {
    const key = `${c.department || "Unknown"}__${c.cycle || "Unknown"}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  Object.entries(groups).forEach(([key, rows]) => {
    const [dept, cycle] = key.split("__");
    const sheetRows = rows.map((c, i) => ({
      "Sr.":             i + 1,
      "Name":            c.fullName || "—",
      "Email":           c.email    || "—",
      "Department":      c.department || "—",
      "Cycle":           c.cycle    || "—",
      "Designation":     c.designation    || "—",
      "Employment Type": c.employmentType || "—",
      "Status":          c.selectionStatus || "—",
      "Waitlist #":      c.selectionStatus === "WAITLISTED" ? (c.waitlistPriority || "—") : "—",
      "HoD Dept":        c.hod?.department || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetRows);
    // Auto column widths
    ws["!cols"] = Object.keys(sheetRows[0] || {}).map(k => ({
      wch: Math.max(k.length, ...sheetRows.map(r => String(r[k] || "").length), 10),
    }));
    // Sheet name max 31 chars (Excel limit)
    const sheetName = `${dept}_${cycle}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  if (!Object.keys(groups).length) return alert("No data to export.");
  XLSX.writeFile(wb, `Candidates_All_Dept_Cycle.xlsx`);
};

const downloadFiltered = () => {
  if (!filtered.length) return alert("No data to export.");
  const rows = filtered.map((c, i) => ({
    "Sr.":             i + 1,
    "Name":            c.fullName || "—",
    "Email":           c.email    || "—",
    "Department":      c.department || "—",
    "Cycle":           c.cycle    || "—",
    "Designation":     c.designation    || "—",
    "Employment Type": c.employmentType || "—",
    "Status":          c.selectionStatus || "—",
    "Waitlist #":      c.selectionStatus === "WAITLISTED" ? (c.waitlistPriority || "—") : "—",
    "HoD Dept":        c.hod?.department || "—",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]).map(k => ({
    wch: Math.max(k.length, ...rows.map(r => String(r[k] || "").length), 10),
  }));
  const wb = XLSX.utils.book_new();
  const label = [
    filterDept   !== "ALL" ? filterDept   : "",
    filterStatus !== "ALL" ? filterStatus : "",
  ].filter(Boolean).join("_") || "All";
  XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 31));
  XLSX.writeFile(wb, `Candidates_${label}.xlsx`);
};
  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([s, n]) => (
          <div key={s} className={`px-3 py-2 rounded-lg border text-xs font-medium ${statusStyle[s] || "bg-gray-100"}`}>
            {s.replace("_", " ")}: <span className="font-bold">{n}</span>
          </div>
        ))}
        <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700">
          Total: <span className="font-bold">{candidates.length}</span>
        </div>
      </div>

      {/* Filters + Download */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name / email…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={downloadFiltered}
            className="text-xs border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition">
            ↓ Current View
          </button>
          <div className="relative group">
            <button className="text-xs border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
              ↓ By Dept &amp; Cycle <span className="text-indigo-400">▾</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] hidden group-hover:block">
              <button onClick={downloadByDeptCycle}
                className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 font-semibold border-b border-gray-100">
                ↓ All Departments (multi-sheet)
              </button>
              {[...new Set(candidates.map(c => `${c.department || "Unknown"}||${c.cycle || "Unknown"}`))]
                .sort().map(key => {
                  const [dept, cycle] = key.split("||");
                  return (
                    <button key={key}
                      onClick={() => {
                        const rows = candidates
                          .filter(c => (c.department || "Unknown") === dept && (c.cycle || "Unknown") === cycle)
                          .map((c, i) => ({
                            "Sr.": i+1, "Name": c.fullName||"—", "Email": c.email||"—",
                            "Department": c.department||"—", "Cycle": c.cycle||"—",
                            "Designation": c.designation||"—", "Employment Type": c.employmentType||"—",
                            "Status": c.selectionStatus||"—",
                            "Waitlist #": c.selectionStatus==="WAITLISTED"?(c.waitlistPriority||"—"):"—",
                          }));
                        const ws = XLSX.utils.json_to_sheet(rows);
                        ws["!cols"] = Object.keys(rows[0]||{}).map(k=>({wch:Math.max(k.length,...rows.map(r=>String(r[k]||"").length),10)}));
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, `${dept}_${cycle}`.slice(0,31));
                        XLSX.writeFile(wb, `Candidates_${dept}_${cycle}.xlsx`);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between">
                      <span>{dept}</span>
                      <span className="font-mono text-gray-400 ml-2">{cycle}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 uppercase tracking-wide font-semibold">
                {["#","Name","Email","Department","Designation","Employment Type","Status","Waitlist#","Cycle","HoD"].map(h => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 text-gray-400">{i+1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{c.fullName}</td>
                  <td className="px-4 py-2.5 text-blue-600">{c.email}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.department||"—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.designation||"—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.employmentType||"—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border font-medium ${statusStyle[c.selectionStatus]||"bg-gray-100 text-gray-500"}`}>
                      {c.selectionStatus||"—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-center">
                    {c.selectionStatus==="WAITLISTED"?(c.waitlistPriority||"—"):"—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                      {c.cycle||"—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{c.hod?.department||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 2 — All Experts (active + closed cycles)
───────────────────────────────────────────── */
function AllExpertsTab() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filterDept, setFilterDept] = useState("ALL");

  useEffect(() => {
    // Fetch both active and closed cycle expert travel records
      API.get("/expert-travel/closed")
    .then(res => {
      setItems(Array.isArray(res.data) ? res.data : []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-4">Loading experts…</p>;
  if (!items.length)
    return <p className="text-gray-400 text-sm p-4">No experts found.</p>;

  const depts = ["ALL", ...new Set(
    items.map(i => i.expert?.uploadedBy?.department || "Manual").filter(Boolean)
  )];

  const filtered = items.filter(({ expert }) => {
    const matchSearch = !search ||
      expert?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      expert?.email?.toLowerCase().includes(search.toLowerCase());
    const dept = expert?.uploadedBy?.department || "Manual";
    const matchDept = filterDept === "ALL" || dept === filterDept;
    return matchSearch && matchDept;
  });

  const presenceStyle = {
    Online:  "bg-green-100 text-green-700 border-green-200",
    Offline: "bg-blue-100 text-blue-700 border-blue-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name / email…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {items.length} experts</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 uppercase tracking-wide font-semibold">
                {["#","Name","Email","Designation","Institute","Department","Cycle","Uploaded by","Presence","Confirmed","Mode","Ticket","Invoice"].map(h => (
                  <th key={h} className="px-3 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ expert, travel }, i) => (
                <tr key={expert.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{expert.fullName}</td>
                  <td className="px-3 py-2.5 text-blue-600">{expert.email}</td>
                  <td className="px-3 py-2.5 text-gray-600">{expert.designation || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-500">{expert.institute || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600">{expert.department || "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                      {expert.cycle || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-xs">
                      {expert.uploadedBy?.department || "Manual"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {travel?.presenceStatus ? (
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${presenceStyle[travel.presenceStatus] || "bg-gray-100"}`}>
                        {travel.presenceStatus}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {travel?.confirmed
                      ? <span className="text-green-600 font-bold">✔</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{travel?.modeOfTravel || "—"}</td>
                  <td className="px-3 py-2.5">
                    {travel?.ticketPath
                      ? <a href={`${BASE}/${travel.ticketPath}`} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline">📄 View</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {travel?.invoicePath
                      ? <a href={`${BASE}/${travel.invoicePath}`} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline">🧾 View</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 3 — Travel & Expert Details (closed cycles)
───────────────────────────────────────────── */
function TravelLogsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/expert-travel/closed")
      .then(res => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-4">Loading…</p>;
  if (!items.length)
    return <p className="text-gray-400 text-sm p-4">No closed-cycle travel records yet.</p>;

  return (
    <div className="space-y-3">
      {items.map(({ expert, travel }) => (
        <div key={expert.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{expert.fullName}</p>
              <p className="text-xs text-gray-400">{expert.designation} · {expert.institute}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="font-mono text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">
                {expert.cycle || "—"}
              </span>
              {travel?.presenceStatus && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  travel.presenceStatus === "Online"  ? "bg-green-100 text-green-700 border-green-200" :
                  travel.presenceStatus === "Offline" ? "bg-blue-100 text-blue-700 border-blue-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>{travel.presenceStatus}</span>
              )}
              {travel?.confirmed && (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  ✔ Confirmed
                </span>
              )}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Mode</p>
              <p className="text-gray-700 font-medium">{travel?.modeOfTravel || "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Onward</p>
              <p className="text-gray-700">
                {travel?.traveller?.onwardFromCity || "—"} → {travel?.traveller?.onwardToCity || "—"}
              </p>
              <p className="text-gray-400">
                {travel?.traveller?.onwardFrom
                  ? new Date(travel.traveller.onwardFrom).toLocaleDateString("en-GB") : "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Return</p>
              <p className="text-gray-700">
                {travel?.traveller?.returnFromCity || "—"} → {travel?.traveller?.returnToCity || "—"}
              </p>
              <p className="text-gray-400">
                {travel?.traveller?.returnFrom
                  ? new Date(travel.traveller.returnFrom).toLocaleDateString("en-GB") : "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Quote</p>
              {travel?.quote ? (
                <span className={`px-2 py-0.5 rounded-full border font-medium ${
                  travel.quote.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" :
                  travel.quote.status === "REJECTED" ? "bg-red-100 text-red-700 border-red-200" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }`}>₹{travel.quote.amount} — {travel.quote.status}</span>
              ) : <p className="text-gray-400">No quote</p>}
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Ticket</p>
              {travel?.ticketPath
                ? <a href={`${BASE}/${travel.ticketPath}`} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline">📄 View</a>
                : <p className="text-gray-400">Not uploaded</p>}
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Invoice</p>
              {travel?.invoicePath
                ? <a href={`${BASE}/${travel.invoicePath}`} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline">🧾 View</a>
                : <p className="text-gray-400">Not uploaded</p>}
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Pickup</p>
              <p className="text-gray-700">{travel?.pickupDrop?.pickupLocation || "—"}</p>
              <p className="text-gray-400">{travel?.pickupDrop?.pickupTime || ""}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wide font-medium mb-0.5">Driver</p>
              {travel?.pickupDrop?.driverName ? (
                <>
                  <p className="text-gray-700 font-medium">{travel.pickupDrop.driverName}</p>
                  <p className="text-gray-400">{travel.pickupDrop.driverContact}</p>
                </>
              ) : <p className="text-amber-600">Not assigned</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function DofaOfficeLogs() {
  const [tab, setTab] = useState("candidates");

  const TABS = [
    { id: "candidates", label: "All Candidates" },
    { id: "experts",    label: "All Experts"    },
    { id: "travel",     label: "Travel Details (Closed Cycles)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">DoFA Office Logs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete records — candidates, experts, and travel across all cycles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "candidates" && <AllCandidatesTab />}
      {tab === "experts"    && <AllExpertsTab />}
      {tab === "travel"     && <TravelLogsTab />}
    </div>
  );
}