// pages/travel/TravelQuotes.jsx
// Fix: quote data was empty because old JSON column was replaced with flat columns.
// Fix: added Submit Quote form for offline confirmed experts (for Ramswaroop).
import { useEffect, useState } from "react";
import API from "../../api/api";

export default function TravelQuotes() {
  const [items,    setItems]   = useState([]);      // experts who need quotes
  const [loading,  setLoading] = useState(true);
  const [forms,    setForms]   = useState({});      // expertId → { amount, vendor, remarks }
  const [saving,   setSaving]  = useState(null);

  const load = () => {
    API.get("/expert-travel")
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];

        // Ramswaroop sees:
        // - Offline confirmed experts who don't yet have a quote (to submit)
        // - Offline confirmed experts who have a quote (to view status)
        const relevant = all.filter(i =>
          i.travel?.presenceStatus === "Offline" && i.travel?.confirmed
        );

        setItems(relevant);

        // Pre-fill form with existing quote data if any
        const f = {};
        relevant.forEach(({ expert, travel }) => {
          f[expert.id] = {
            amount:  travel?.quote?.amount  || "",
            vendor:  travel?.quote?.vendor  || "",
            remarks: travel?.quote?.remarks || "",
          };
        });
        setForms(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setF = (expertId, key, val) =>
    setForms(f => ({ ...f, [expertId]: { ...f[expertId], [key]: val } }));

  const handleSubmit = async (expertId) => {
    const form = forms[expertId] || {};
    if (!form.amount || isNaN(Number(form.amount))) {
      return alert("Please enter a valid amount");
    }
    try {
      setSaving(expertId);
      await API.post(`/expert-travel/quote/${expertId}`, {
        amount:  Number(form.amount),
        vendor:  form.vendor  || "",
        remarks: form.remarks || "",
      });
      alert("Quote submitted. DOFA has been notified.");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit quote");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading…</p>;

  const pending  = items.filter(i => !i.travel?.quote);
  const submitted = items.filter(i => !!i.travel?.quote);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Travel Quotes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit quotes for offline experts confirmed by DOFA Office.
        </p>
      </div>

      {/* ── Submit quotes (pending) ── */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Pending Quotes — {pending.length} expert{pending.length !== 1 ? "s" : ""}
          </p>
          {pending.map(({ expert, travel }) => (
            <div key={expert.id}
              className="bg-white rounded-xl border border-amber-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{expert.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {expert.institute} · {travel?.modeOfTravel}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
                  Quote Required
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number" min="0"
                    placeholder="e.g. 5000"
                    value={forms[expert.id]?.amount || ""}
                    onChange={e => setF(expert.id, "amount", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Vendor / Agency
                  </label>
                  <input
                    placeholder="e.g. MakeMyTrip"
                    value={forms[expert.id]?.vendor || ""}
                    onChange={e => setF(expert.id, "vendor", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Remarks (optional)
                  </label>
                  <input
                    placeholder="Any notes..."
                    value={forms[expert.id]?.remarks || ""}
                    onChange={e => setF(expert.id, "remarks", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmit(expert.id)}
                  disabled={saving === expert.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition"
                >
                  {saving === expert.id ? "Submitting…" : "Submit Quote to DOFA"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Submitted quotes (view status) ── */}
      {submitted.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Submitted Quotes — {submitted.length}
          </p>
          {submitted.map(({ expert, travel }) => {
            const q = travel.quote;
            const statusColor = {
              APPROVED: "bg-green-100 text-green-700 border-green-200",
              REJECTED: "bg-red-100 text-red-700 border-red-200",
              PENDING:  "bg-amber-100 text-amber-700 border-amber-200",
            }[q?.status] || "bg-gray-100 text-gray-500 border-gray-200";

            return (
              <div key={expert.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{expert.fullName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {expert.institute} · {travel.modeOfTravel}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
                    {q?.status || "PENDING"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Amount</p>
                    <p className="font-semibold text-gray-800 mt-0.5">
                      {q?.amount ? `₹${q.amount}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Vendor</p>
                    <p className="text-gray-700 mt-0.5">{q?.vendor || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
                    <p className="text-gray-700 mt-0.5">
                      {q?.submittedAt
                        ? new Date(q.submittedAt).toLocaleDateString("en-GB")
                        : "—"}
                    </p>
                  </div>
                </div>

                {q?.status === "REJECTED" && q?.rejectionNote && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                    Rejected: {q.rejectionNote}
                  </div>
                )}
                {q?.status === "APPROVED" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    ✔ Approved on{" "}
                    {q.approvedAt ? new Date(q.approvedAt).toLocaleDateString("en-GB") : "—"}
                    {q.approvedBy ? ` by ${q.approvedBy}` : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p>No offline confirmed experts yet.</p>
          <p className="text-xs mt-2">
            Quotes appear here once DOFA Office confirms an expert as Offline.
          </p>
        </div>
      )}
    </div>
  );
}