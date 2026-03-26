import { useEffect, useState } from "react";
import API from "../../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TravelQuotes() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/expert-travel")
      .then(res => setItems(res.data.filter(i => i.travel?.quote)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  if (items.length === 0) return (
    <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
      <p className="text-4xl mb-3">💰</p>
      <p>No quotes submitted yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Quotes</h2>

      {items.map(({ expert, travel }) => {
        const q = travel.quote;
        const statusColor = {
          PENDING:  "bg-yellow-100 text-yellow-700 border-yellow-200",
          APPROVED: "bg-green-100 text-green-700 border-green-200",
          REJECTED: "bg-red-100 text-red-700 border-red-200",
        }[q.status] || "bg-gray-100 text-gray-600 border-gray-200";

        return (
          <div key={expert.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{expert.fullName}</p>
                <p className="text-xs text-gray-400">{expert.institute} · {travel.modeOfTravel}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
                {q.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Amount</p>
                <p className="font-semibold text-gray-800">₹{q.amount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Vendor</p>
                <p className="text-gray-700">{q.vendor || "—"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Submitted</p>
                <p className="text-gray-700">
                  {q.submittedAt ? new Date(q.submittedAt).toLocaleDateString("en-GB") : "—"}
                </p>
              </div>
            </div>

            {q.status === "REJECTED" && q.rejectionNote && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                Rejection reason: {q.rejectionNote}
              </div>
            )}

            {q.status === "APPROVED" && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                Approved on {q.approvedAt ? new Date(q.approvedAt).toLocaleDateString("en-GB") : "—"} by {q.approvedBy}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}