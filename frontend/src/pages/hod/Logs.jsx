import { useEffect, useState } from "react";
import API from "../../api/api";

export default function HodLogs() {
  const [logs,        setLogs]        = useState([]);
  const [yearFilter,  setYearFilter]  = useState("");
  const [cycleFilter, setCycleFilter] = useState("");
  const [years,       setYears]       = useState([]);

  useEffect(() => {
    API.get("/hod/logs").then(res => {
      setLogs(res.data);
      // Build unique academic years for dropdown
      const uniqueYears = [...new Set(res.data.map(l => l.academicYear))].sort().reverse();
      setYears(uniqueYears);
    }).catch(() => {});
  }, []);

  const filtered = logs.filter(l =>
    (!yearFilter  || l.academicYear === yearFilter) &&
    (!cycleFilter || String(l.cycleNumber).includes(cycleFilter))
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Past Cycle Logs</h2>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Academic Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <input
          type="text" placeholder="Cycle No. (e.g. 1)"
          value={cycleFilter} onChange={e => setCycleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-40"
        />
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
          No past cycle logs found.
        </div>
      )}

      {filtered.map(log => (
        <div key={log.id} className="bg-white rounded-xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800">{log.academicYear}</span>
              <span className="ml-3 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Cycle {log.cycleNumber}
              </span>
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {log.status}
              </span>
            </div>
          </div>

          {/* Candidates */}
          <details className="text-sm">
            <summary className="cursor-pointer text-indigo-600 font-medium">
              {log.candidates?.length || 0} Candidates
            </summary>
            <table className="mt-2 w-full border text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {["Sr","Name","Primary Email","Qualification","Specialization","Applied Position"].map(h =>
                    <th key={h} className="border px-2 py-1 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(log.candidates || []).map((c, i) => (
                  <tr key={c.id} className="border-t">
                    <td className="border px-2 py-1">{i+1}</td>
                    <td className="border px-2 py-1">{c.fullName}</td>
                    <td className="border px-2 py-1">{c.email}</td>
                    <td className="border px-2 py-1">{c.qualification}</td>
                    <td className="border px-2 py-1">{c.specialization}</td>
                    <td className="border px-2 py-1">{c.appliedPosition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          {/* Experts */}
          <details className="text-sm">
            <summary className="cursor-pointer text-indigo-600 font-medium">
              {log.experts?.length || 0} Experts
            </summary>
            <table className="mt-2 w-full border text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {["Name","Designation","Department","Institute","Email","Specialization"].map(h =>
                    <th key={h} className="border px-2 py-1 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(log.experts || []).map(e => (
                  <tr key={e.id} className="border-t">
                    <td className="border px-2 py-1">{e.fullName}</td>
                    <td className="border px-2 py-1">{e.designation}</td>
                    <td className="border px-2 py-1">{e.department}</td>
                    <td className="border px-2 py-1">{e.institute}</td>
                    <td className="border px-2 py-1">{e.email}</td>
                    <td className="border px-2 py-1">{e.specialization || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ))}
    </div>
  );
}