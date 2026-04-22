import { useEffect, useState } from "react";
import API from "../api/api";

export default function EstablishmentRoomView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/establishment/records"),
      API.get("/selected-candidates"),
    ]).then(([recRes, selRes]) => {
      const selMap = {};
      (Array.isArray(selRes.data) ? selRes.data : []).forEach(s => {
        const id = s.candidateId || s.candidate?.id;
        if (id) selMap[id] = s.status;
      });
      const all = (recRes.data || []).flatMap(d => d.records || []).map(r => ({
        ...r,
        selectionStatus: selMap[r.candidate?.id] || "SELECTED",
      }));
      setRecords(all);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  const withRooms    = records.filter(r => r.roomNumber);
  const withoutRooms = records.filter(r => !r.roomNumber);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Office Allotment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Office allotments are managed by DOFA Office. This is a read-only view.
        </p>
      </div>

      {/* Allotted */}
      {withRooms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-indigo-600 px-5 py-3">
            <p className="text-white font-medium text-sm">{withRooms.length} Room(s) Allotted</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Candidate","Department","Room","Building","Allotted On","Handover Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withRooms.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.candidate?.fullName}</p>
                      <p className="text-xs text-gray-400">{r.candidate?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.department}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-700 text-base">{r.roomNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.roomBuilding || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.roomAllottedAt
                        ? new Date(r.roomAllottedAt).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.roomHandedOver ? (
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          Handed Over {r.roomHandoverDate
                            ? new Date(r.roomHandoverDate).toLocaleDateString("en-GB")
                            : ""}
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          Pending Handover
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Not yet allotted */}
      {withoutRooms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-500 px-5 py-3">
            <p className="text-white font-medium text-sm">{withoutRooms.length} Candidate(s) Without Office Allotment</p>
          </div>
          <div className="divide-y divide-gray-50">
            {withoutRooms.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{r.candidate?.fullName}</p>
                  <p className="text-xs text-gray-400">{r.department}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                  Not yet allotted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">
          No office allotment data yet.
        </div>
      )}
    </div>
  );
}