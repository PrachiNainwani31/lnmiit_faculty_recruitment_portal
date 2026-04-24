import { useEffect, useState } from "react";
import API from "../../api/api";

const BASE = import.meta.env.VITE_API_URL;

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";

export default function TravelLogs() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // all | APPROVED | REJECTED | PENDING

  useEffect(() => {
    API.get("/expert-travel/closed")
      .then(res => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading…</p>;

  const counts = {
    all:      items.length,
    APPROVED: items.filter(i => i.travel?.quote?.status === "APPROVED").length,
    REJECTED: items.filter(i => i.travel?.quote?.status === "REJECTED").length,
    PENDING:  items.filter(i => i.travel?.quote?.status === "PENDING").length,
  };

  const filtered = filter === "all"
    ? items
    : items.filter(i => i.travel?.quote?.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Travel Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Closed cycle expert travel records with quote history.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: "all",      label: `All (${counts.all})` },
          { key: "APPROVED", label: `✔ Approved (${counts.APPROVED})` },
          { key: "REJECTED", label: `✗ Rejected (${counts.REJECTED})` },
          { key: "PENDING",  label: `⏳ Pending (${counts.PENDING})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
              filter === key
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-14 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No records found for this filter.</p>
          <p className="text-xs mt-2">Records appear here once a recruitment cycle is closed.</p>
        </div>
      )}

      {/* Car arrangement table — approved offline experts */}
      {filter === "all" || filter === "APPROVED" ? (() => {
        const offlineApproved = filtered.filter(
          i => i.travel?.presenceStatus === "Offline" && i.travel?.quote?.status === "APPROVED"
        );
        if (!offlineApproved.length) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-blue-700 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Car Arrangement Summary — Approved Offline</p>
              <span className="text-blue-200 text-xs">{offlineApproved.length} expert{offlineApproved.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {["Sr","Name","Dept","Cycle","Mode","Arrival Date","Pickup","Flight/Train","Arrival Time","Depart Date","Drop","Return Flight","Depart Time","Contact","Driver"].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offlineApproved.map(({ expert, travel }, i) => {
                    const tr = travel.traveller || {};
                    const pd = travel.pickupDrop || {};
                    return (
                      <tr key={`${expert.id}-${expert.cycle}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{expert.fullName}</td>
                        <td className="px-3 py-2.5 text-gray-600">{expert.uploadedBy?.department || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-500">{expert.cycle}</td>
                        <td className="px-3 py-2.5">
                          <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                            {travel.modeOfTravel || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{fmtDate(tr.onwardFrom)}</td>
                        <td className="px-3 py-2.5 text-gray-700">{pd.pickupLocation || "—"}</td>
                        <td className="px-3 py-2.5 font-medium text-indigo-700">{tr.onwardFlightNo || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-700">{tr.onwardTime?.slice(0,5) || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{fmtDate(tr.returnFrom)}</td>
                        <td className="px-3 py-2.5 text-gray-700">{pd.dropLocation || "—"}</td>
                        <td className="px-3 py-2.5 font-medium text-indigo-700">{tr.returnFlightNo || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-700">{tr.returnTime?.slice(0,5) || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-600">{travel.contactNumber || "—"}</td>
                        <td className="px-3 py-2.5">
                          {pd.driverName
                            ? <span className="text-gray-800 font-medium">{pd.driverName}</span>
                            : <span className="text-amber-500">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })() : null}

      {/* Expert cards */}
      <div className="space-y-4">
        {filtered.map(({ expert, travel }) => {
          const q  = travel?.quote;
          const tr = travel?.traveller || {};
          const pd = travel?.pickupDrop || {};

          const statusCls =
            q?.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" :
            q?.status === "REJECTED" ? "bg-red-100 text-red-700 border-red-200" :
            "bg-amber-100 text-amber-700 border-amber-200";

          const presCls =
            travel?.presenceStatus === "Online"  ? "bg-green-100 text-green-700 border-green-200" :
            travel?.presenceStatus === "Offline" ? "bg-blue-100 text-blue-700 border-blue-200" :
            "bg-gray-100 text-gray-500 border-gray-200";

          return (
            <div key={`${expert.id}-${expert.cycle}`} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {expert.fullName?.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{expert.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{expert.designation} · {expert.institute}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${presCls}`}>
                    {travel?.presenceStatus || "—"}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusCls}`}>
                    {q?.status || "—"}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
                    {expert.cycle}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {/* Quote */}
                {q && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Quote</p>
                    <p className="font-semibold text-gray-800">₹{q.amount}</p>
                    <p className="text-xs text-gray-500">{q.vendor || "—"}</p>
                    {q.approvedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {q.status === "APPROVED" ? "✔" : "✗"} {q.approvedBy} · {fmtDate(q.approvedAt)}
                      </p>
                    )}
                    {q.rejectionNote && (
                      <p className="text-xs text-red-500 mt-0.5">{q.rejectionNote}</p>
                    )}
                  </div>
                )}

                {/* Mode */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mode</p>
                  <p className="font-medium text-gray-800">{travel?.modeOfTravel || "—"}</p>
                  <p className="text-xs text-gray-500">{travel?.contactNumber || ""}</p>
                </div>

                {/* Onward */}
                {tr.onwardFrom && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Arrival</p>
                    <p className="font-medium text-gray-800">{fmtDate(tr.onwardFrom)}</p>
                    <p className="text-xs text-gray-500">{tr.onwardTime?.slice(0,5) || ""}</p>
                    {tr.onwardFlightNo && <p className="text-xs font-semibold text-indigo-700">✈ {tr.onwardFlightNo}</p>}
                  </div>
                )}

                {/* Return */}
                {tr.returnFrom && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Departure</p>
                    <p className="font-medium text-gray-800">{fmtDate(tr.returnFrom)}</p>
                    <p className="text-xs text-gray-500">{tr.returnTime?.slice(0,5) || ""}</p>
                    {tr.returnFlightNo && <p className="text-xs font-semibold text-indigo-700">✈ {tr.returnFlightNo}</p>}
                  </div>
                )}

                {/* Pickup/Drop */}
                {pd.pickupLocation && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pickup → Drop</p>
                    <p className="text-gray-700">{pd.pickupLocation}</p>
                    <p className="text-xs text-gray-400">→ {pd.dropLocation || "—"}</p>
                  </div>
                )}

                {/* Driver */}
                {pd.driverName && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Driver</p>
                    <p className="font-medium text-gray-800">{pd.driverName}</p>
                    <p className="text-xs text-gray-500">{pd.driverContact}</p>
                  </div>
                )}

                {/* Ticket */}
                {travel?.ticketPath && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ticket</p>
                    <a href={`${BASE}/${travel.ticketPath}`} target="_blank" rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline">📄 View</a>
                    {travel.ticketUploadedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(travel.ticketUploadedAt)}</p>
                    )}
                  </div>
                )}

                {/* Invoice */}
                {travel?.invoicePath && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Invoice</p>
                    <a href={`${BASE}/${travel.invoicePath}`} target="_blank" rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline">📄 View</a>
                    {travel.invoiceUploadedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(travel.invoiceUploadedAt)}</p>
                    )}
                  </div>
                )}

                {/* PENDING warning */}
                {q?.status === "PENDING" && (
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                    Quote was still pending when this cycle was closed — no decision was recorded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}