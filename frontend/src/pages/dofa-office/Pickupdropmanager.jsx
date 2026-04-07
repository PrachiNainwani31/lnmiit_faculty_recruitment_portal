import { useEffect, useState } from "react";
import API from "../../api/api";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300";

export default function PickupDropManager() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [forms,   setForms]   = useState({});

  const load = () => {
    API.get("/expert-travel")
      .then(res => {
        const offline = res.data.filter(i => i.travel?.presenceStatus === "Offline");
        setItems(offline);
        const initialForms = {};
        offline.forEach(i => {
          initialForms[i.expert.id] = {
            pickupLocation: i.travel?.pickupDrop?.pickupLocation || "",
            pickupTime:     i.travel?.pickupDrop?.pickupTime     || "",
            dropLocation:   i.travel?.pickupDrop?.dropLocation   || "",
            dropTime:       i.travel?.pickupDrop?.dropTime       || "",
          };
        });
        setForms(initialForms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setF = (expertId, k, v) =>
    setForms(f => ({ ...f, [expertId]: { ...f[expertId], [k]: v } }));

  const handleSave = async (expertId) => {
    setSaving(expertId);
    try {
      await API.post(`/expert-travel/pickup/${expertId}`, forms[expertId]);
      alert("Pickup/drop details saved. Registrar Office has been notified.");
      load();
    } catch (err) {
      alert("Failed to save");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Pickup / Drop-off Management</h1>
        <p className="text-sm text-gray-500 mt-1">Enter station/airport pickup details for offline experts. Registrar Office will be notified to arrange cabs.</p>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          No offline experts confirmed yet.
        </div>
      )}

      {items.map(({ expert, travel }) => {
        const f = forms[expert.id] || {};
        const pd = travel?.pickupDrop;
        return (
          <div key={expert.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                {expert.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{expert.fullName}</p>
                <p className="text-xs text-gray-400">{expert.institute} · {travel?.modeOfTravel}</p>
              </div>
              {pd?.driverName && (
                <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                  Driver: {pd.driverName} · {pd.driverContact}
                </span>
              )}
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pickup Location</label>
                  <input className={inputCls} placeholder="e.g. Jaipur Railway Station"
                    value={f.pickupLocation || ""} onChange={e => setF(expert.id, "pickupLocation", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pickup Time</label>
                  <input className={inputCls} placeholder="e.g. 10:00 AM, 11 Apr 2026"
                    value={f.pickupTime || ""} onChange={e => setF(expert.id, "pickupTime", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Drop Location</label>
                  <input className={inputCls} placeholder="e.g. LNMIIT Campus"
                    value={f.dropLocation || ""} onChange={e => setF(expert.id, "dropLocation", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Drop Time</label>
                  <input className={inputCls} placeholder="e.g. 11:30 AM"
                    value={f.dropTime || ""} onChange={e => setF(expert.id, "dropTime", e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => handleSave(expert.id)} disabled={saving === expert.id}
                  className="bg-[#6b0f1a] hover:bg-rose-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                  {saving === expert.id ? "Saving..." : "Save & Notify Registrar Office"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}