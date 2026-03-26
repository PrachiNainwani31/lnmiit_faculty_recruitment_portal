import { useEffect, useState } from "react";
import API from "../../api/api";

export default function QuoteApproval() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [saving,  setSaving]  = useState(null);

  const load = () => {
    API.get("/expert-travel")
      .then(res => setItems(res.data.filter(i => i.travel?.quote)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDecision = async (expertId, status) => {
    setSaving(expertId + status);
    try {
      await API.post(`/expert-travel/quote/${expertId}/approve`, {
        status,
        rejectionNote: remarks[expertId] || "",
      });
      alert(`Quote ${status.toLowerCase()}.`);
      load();
    } catch { alert("Failed"); } finally { setSaving(null); }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Travel Quote Approval</h1>
        <p className="text-sm text-gray-500 mt-1">Review quotes submitted by Mr. Ramswaroop Sharma.</p>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No quotes submitted yet.</div>
      )}

      {items.map(({ expert, travel }) => {
        const q = travel.quote;
        const statusColor =
          q.status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200"
          : q.status === "REJECTED" ? "bg-red-100 text-red-700 border-red-200"
          : "bg-amber-100 text-amber-700 border-amber-200";

        return (
          <div key={expert.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{expert.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{expert.institute} · {travel.modeOfTravel}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>{q.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4 text-sm">
              <div><p className="text-xs text-gray-400">Amount</p><p className="font-semibold text-gray-800">₹{q.amount}</p></div>
              <div><p className="text-xs text-gray-400">Vendor</p><p className="text-gray-700">{q.vendor}</p></div>
              <div><p className="text-xs text-gray-400">Remarks</p><p className="text-gray-700">{q.remarks || "—"}</p></div>
            </div>

            {q.status === "PENDING" && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Rejection Note (if rejecting)</label>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-rose-300"
                    placeholder="Optional reason..."
                    value={remarks[expert.id] || ""}
                    onChange={e => setRemarks(r => ({...r, [expert.id]: e.target.value}))}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(expert.id, "APPROVED")}
                    disabled={!!saving}
                    className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition">
                    ✔ Approve Quote
                  </button>
                  <button
                    onClick={() => handleDecision(expert.id, "REJECTED")}
                    disabled={!!saving}
                    className="bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-60 transition">
                    ✗ Reject Quote
                  </button>
                </div>
              </div>
            )}

            {q.status !== "PENDING" && (
              <p className="text-xs text-gray-400">
                {q.status === "APPROVED" ? `✔ Approved by ${q.approvedBy}` : `✗ Rejected — ${q.rejectionNote || "No reason"}`}
                {q.approvedAt ? ` on ${new Date(q.approvedAt).toLocaleDateString()}` : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}