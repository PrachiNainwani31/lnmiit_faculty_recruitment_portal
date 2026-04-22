import { useEffect, useState } from "react";
import API from "../../api/api";

export default function RoomAllotmentPage() {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
  API.get("/establishment/records")
    .then(r => {
      // Filter out closed cycle records from each dept
      const filtered = (r.data || []).map(dept => ({
        ...dept,
        records: (dept.records || []).filter(rec => !rec.isCycleClosedFlag),
      })).filter(dept => dept.records.length > 0); // remove empty depts
      setDepts(filtered);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
};

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Office Allotment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Allot offices to selected candidates. Candidate, HOD, DOFA, Estate, and LUCS will be notified.
        </p>
      </div>

      {depts.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No selected candidates yet. Publish selection from the Select Candidates page first.</p>
        </div>
      )}

      {depts.map(({ department, records }) => (
        <div key={department} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{department}</p>
            <span className="text-blue-200 text-xs">{records.length} candidate(s)</span>
          </div>
          {records.map(r => <RoomCard key={r.id} record={r} onRefresh={load} />)}
        </div>
      ))}
    </div>
  );
}

function RoomCard({ record, onRefresh }) {
  const c = record.candidate;
  const [form, setForm] = useState({
    roomBuilding: record.roomBuilding || "",
    roomNumber:   record.roomNumber   || "",
    roomNotes:    record.roomNotes    || "",
  });
  const [saving, setSaving] = useState(false);

  const allotted = !!record.roomNumber;

  const handleSave = async () => {
    if (!form.roomBuilding || !form.roomNumber)
      return alert("Please enter building and room number");
    try {
      setSaving(true);
      await API.post("/establishment/allot-room", {
        candidateId:  c.id,
        ...form,
      });
      alert("Office allotted. Candidate, Estate, and LUCS have been notified.");
      onRefresh();
    } catch { alert("Failed to allot office"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";

  return (
    <div className="border-b last:border-0 px-5 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{c?.email}</p>
        </div>
        {allotted ? (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
            {record.roomBuilding} — Room {record.roomNumber}
          </span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            Not allotted
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">Building / Block</label>
          <input className={inputCls} placeholder="e.g. BH1 / GH / Guest House"
            value={form.roomBuilding}
            onChange={e => setForm(f => ({ ...f, roomBuilding: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">Room Number</label>
          <input className={inputCls} placeholder="e.g. A-204"
            value={form.roomNumber}
            onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">Notes (optional)</label>
          <input className={inputCls} placeholder="Keys at Estate office..."
            value={form.roomNotes}
            onChange={e => setForm(f => ({ ...f, roomNotes: e.target.value }))} />
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
          {saving ? "Saving..." : allotted ? "Update Office" : "Allot Office & Notify All"}
        </button>
      </div>
    </div>
  );
}