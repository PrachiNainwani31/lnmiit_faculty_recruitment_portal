// pages/travel/TravelQuotes.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";

export default function TravelQuotes() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    API.get("/expert-travel")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        // ✅ FIX: show ALL offline + confirmed experts (not just ones with a quote already)
        // Travel portal needs to see these to BE ABLE to submit a quote
        const offline = data.filter(i =>
          i.travel?.presenceStatus === "Offline" && i.travel?.confirmed
        );
        setItems(offline);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  const withQuote    = items.filter(i => i.travel?.quote);
  const withoutQuote = items.filter(i => !i.travel?.quote);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Travel Quotes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit quotes for offline experts confirmed by DOFA Office.
        </p>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">No offline experts confirmed yet.</p>
          <p className="text-xs mt-2">
            DOFA Office must mark an expert as Offline + Confirmed before quotes can be submitted.
          </p>
        </div>
      )}

      {/* ── Pending quote submission ── */}
      {withoutQuote.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Awaiting Quote — {withoutQuote.length} expert{withoutQuote.length !== 1 ? "s" : ""}
          </p>
          {withoutQuote.map(({ expert, travel }) => (
            <QuoteSubmitCard key={expert.id} expert={expert} travel={travel} onSaved={load} />
          ))}
        </div>
      )}

      {/* ── Submitted quotes ── */}
      {withQuote.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Submitted Quotes — {withQuote.length}
          </p>
          {withQuote.map(({ expert, travel }) => (
            <QuoteStatusCard key={expert.id} expert={expert} travel={travel} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card to SUBMIT a new quote ── */
function QuoteSubmitCard({ expert, travel, onSaved }) {
  const [amount,  setAmount]  = useState("");
  const [vendor,  setVendor]  = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async () => {
    if (!amount) return alert("Please enter a quote amount.");
    setSaving(true);
    try {
      await API.post(`/expert-travel/quote/${expert.id}`, { amount, vendor, remarks });
      alert("Quote submitted. DOFA has been notified.");
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit quote");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-b border-amber-100">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
          {expert.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{expert.fullName}</p>
          <p className="text-xs text-gray-500">
            {expert.designation} · {expert.institute}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
            Offline
          </span>
          {travel?.modeOfTravel && (
            <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">
              {travel.modeOfTravel}
            </span>
          )}
        </div>
      </div>

      {/* Travel summary (for reference) */}
      {(travel?.traveller?.onwardFrom || travel?.traveller?.returnFrom) && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 text-xs text-gray-600">
          {travel.traveller.onwardFrom && (
            <span>
              ✈ Onward: <strong>
                {new Date(travel.traveller.onwardFrom).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
              </strong>
              {travel.traveller.onwardTime && ` at ${travel.traveller.onwardTime.slice(0,5)}`}
              {travel.traveller.onwardFlightNo && ` · ${travel.traveller.onwardFlightNo}`}
            </span>
          )}
          {travel.traveller.returnFrom && (
            <span>
              ↩ Return: <strong>
                {new Date(travel.traveller.returnFrom).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
              </strong>
              {travel.traveller.returnTime && ` at ${travel.traveller.returnTime.slice(0,5)}`}
              {travel.traveller.returnFlightNo && ` · ${travel.traveller.returnFlightNo}`}
            </span>
          )}
        </div>
      )}

      {/* Quote form */}
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Quote Amount (₹) *</label>
            <input className={inputCls} type="number" min="0" placeholder="e.g. 12500"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Vendor / Agency</label>
            <input className={inputCls} placeholder="e.g. MakeMyTrip / IRCTC"
              value={vendor} onChange={e => setVendor(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Remarks (optional)</label>
            <input className={inputCls} placeholder="Any notes about the quote..."
              value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={saving}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
            {saving ? "Submitting…" : "Submit Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Card to VIEW an existing quote (with re-submit if rejected) ── */
function QuoteStatusCard({ expert, travel, onSaved }) {
  const q = travel.quote;
  const [editing,  setEditing]  = useState(q?.status === "REJECTED");
  const [amount,   setAmount]   = useState(String(q?.amount  || ""));
  const [vendor,   setVendor]   = useState(q?.vendor  || "");
  const [remarks,  setRemarks]  = useState(q?.remarks || "");
  const [saving,   setSaving]   = useState(false);

  const statusColor = {
    PENDING:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  }[q?.status] || "bg-gray-100 text-gray-600 border-gray-200";

  const handleResubmit = async () => {
    if (!amount) return alert("Please enter a quote amount.");
    setSaving(true);
    try {
      await API.post(`/expert-travel/quote/${expert.id}`, { amount, vendor, remarks });
      alert("Quote resubmitted.");
      setEditing(false);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      q?.status === "REJECTED" ? "border-red-200" :
      q?.status === "APPROVED" ? "border-green-200" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
          {expert.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{expert.fullName}</p>
          <p className="text-xs text-gray-500">
            {expert.designation} · {expert.institute}
            {travel?.modeOfTravel && ` · ${travel.modeOfTravel}`}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
          {q?.status}
        </span>
      </div>

      {/* Quote details */}
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Amount</p>
            <p className="font-bold text-gray-800 text-lg">₹{q?.amount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vendor</p>
            <p className="text-gray-700">{q?.vendor || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Submitted</p>
            <p className="text-gray-700">
              {q?.submittedAt ? new Date(q.submittedAt).toLocaleDateString("en-GB") : "—"}
            </p>
          </div>
        </div>

        {q?.remarks && (
          <p className="text-xs text-gray-500 italic">Remarks: {q.remarks}</p>
        )}

        {q?.status === "REJECTED" && q?.rejectionNote && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            <strong>Rejection reason:</strong> {q.rejectionNote}
          </div>
        )}

        {q?.status === "APPROVED" && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
            ✓ Approved on {q.approvedAt ? new Date(q.approvedAt).toLocaleDateString("en-GB") : "—"}
            {q.approvedBy && ` by ${q.approvedBy}`}
          </div>
        )}

        {/* Re-submit form if rejected */}
        {q?.status === "REJECTED" && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-xs font-medium text-red-700">Resubmit with revised quote:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>New Amount (₹) *</label>
                <input className={inputCls} type="number" min="0"
                  value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Vendor / Agency</label>
                <input className={inputCls}
                  value={vendor} onChange={e => setVendor(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Remarks</label>
                <input className={inputCls}
                  value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleResubmit} disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                {saving ? "Resubmitting…" : "Resubmit Quote"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}