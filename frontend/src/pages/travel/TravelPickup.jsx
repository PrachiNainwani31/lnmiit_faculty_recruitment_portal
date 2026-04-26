import { useEffect, useState } from "react";
import API from "../../api/api";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";

export default function TravelPickup() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverForms, setDriverForms] = useState({});
  const [saving, setSaving] = useState(null);

  const load = () => {
    API.get("/expert-travel")
      .then(res => {
        const filtered = res.data.filter(i => i.travel?.pickupDrop?.enteredByDofa);
        setItems(filtered);
        // pre-fill driver forms with existing data
        const forms = {};
        filtered.forEach(({ expert, travel }) => {
          forms[expert.id] = {
            driverName:    travel.pickupDrop?.driverName    || "",
            driverContact: travel.pickupDrop?.driverContact || "",
          };
        });
        setDriverForms(forms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSaveDriver = async (expertId) => {
    const form = driverForms[expertId];
    if (!form?.driverName || !form?.driverContact) {
      return alert("Please enter both driver name and contact");
    }
    try {
      setSaving(expertId);
      await API.post(`/expert-travel/driver/${expertId}`, form);
      alert("Driver info saved and DoFA notified");
      load();
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  if (items.length === 0) return (
    <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
      
      <p>No pickup/drop-off details from DoFA Office yet.</p>
      <p className="text-xs mt-2">Details will appear here once DoFA Office enters them.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Pickup / Drop-off</h2>
      {items.map(({ expert, travel }) => {
        const pd = travel.pickupDrop;
        const form = driverForms[expert.id] || {};
        const driverSaved = pd?.driverName && pd?.driverContact;

        return (
          <div key={expert.id} className="bg-white rounded-xl shadow p-5 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{expert.fullName}</p>
                <p className="text-xs text-gray-400">{expert.institute} · {travel.modeOfTravel}</p>
              </div>
              {driverSaved ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
                  Driver Assigned
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                  Driver Pending
                </span>
              )}
            </div>

            {/* DoFA's pickup/drop details */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">Pickup</p>
                <p className="font-medium text-blue-800">{pd.pickupLocation || "—"}</p>
                <p className="text-blue-600 text-xs mt-0.5">{pd.pickupTime || ""}</p>
              </div>
              <div>
                <p className="text-xs text-blue-400 uppercase tracking-wide mb-1">Drop-off</p>
                <p className="font-medium text-blue-800">{pd.dropLocation || "—"}</p>
                <p className="text-blue-600 text-xs mt-0.5">{pd.dropTime || ""}</p>
              </div>
            </div>

            {/* Driver info entry */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Enter Driver Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Driver Name</label>
                  <input
                    className={inputCls}
                    placeholder="Driver full name"
                    value={form.driverName || ""}
                    onChange={e => setDriverForms(f => ({
                      ...f,
                      [expert.id]: { ...f[expert.id], driverName: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contact Number</label>
                  <input
                    className={inputCls}
                    placeholder="Driver contact"
                    value={form.driverContact || ""}
                    onChange={e => setDriverForms(f => ({
                      ...f,
                      [expert.id]: { ...f[expert.id], driverContact: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <button
                onClick={() => handleSaveDriver(expert.id)}
                disabled={saving === expert.id}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg disabled:opacity-60"
              >
                {saving === expert.id ? "Saving..." : "Save & Notify DoFA"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}