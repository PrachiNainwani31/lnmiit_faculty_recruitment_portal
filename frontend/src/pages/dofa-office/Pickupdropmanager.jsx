import { useEffect, useState } from "react";
import API from "../../api/api";

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300";
const inputErrCls = "w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-300 bg-red-50";

function formatDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${h12}:${minutes} ${ampm}, ${day}`;
}

export default function PickupDropManager() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [forms,   setForms]   = useState({});
  const [errors,  setErrors]  = useState({});
  const [rawDT,   setRawDT]   = useState({});

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

  const setRaw = (expertId, k, v) => {
    setRawDT(r => {
      const updated = { ...r, [expertId]: { ...(r[expertId] || {}), [k]: v } };
      // Auto-compute formatted string when both date and time are set
      const dt = updated[expertId];
      if (k === "pickupDate" || k === "pickupTime") {
        const pDate = k === "pickupDate" ? v : dt?.pickupDate;
        const pTime = k === "pickupTime" ? v : dt?.pickupTime;
        if (pDate && pTime) {
          setForms(f => ({ ...f, [expertId]: { ...f[expertId], pickupLocation: f[expertId]?.pickupLocation || "", pickupTime: formatDateTime(pDate, pTime) } }));
        }
      }
      if (k === "dropDate" || k === "dropTime") {
        const dDate = k === "dropDate" ? v : dt?.dropDate;
        const dTime = k === "dropTime" ? v : dt?.dropTime;
        if (dDate && dTime) {
          setForms(f => ({ ...f, [expertId]: { ...f[expertId], dropTime: formatDateTime(dDate, dTime) } }));
        }
      }
      return updated;
    });
    // Clear errors on change
    setErrors(e => ({ ...e, [expertId]: { ...(e[expertId] || {}), [k]: null } }));
  };

  const validate = (expertId) => {
    const f = forms[expertId] || {};
    const dt = rawDT[expertId] || {};
    const errs = {};

    if (!f.pickupLocation?.trim()) errs.pickupLocation = "Pickup location is required";
    if (!dt.pickupDate) errs.pickupDate = "Pickup date is required";
    if (!dt.pickupTime) errs.pickupTimeRaw = "Pickup time is required";
    if (!f.dropLocation?.trim()) errs.dropLocation = "Drop location is required";
    if (!dt.dropDate) errs.dropDate = "Drop date is required";
    if (!dt.dropTime) errs.dropTimeRaw = "Drop time is required";

    // Drop must be after pickup
    if (dt.pickupDate && dt.pickupTime && dt.dropDate && dt.dropTime) {
      const pickup = new Date(`${dt.pickupDate}T${dt.pickupTime}`);
      const drop   = new Date(`${dt.dropDate}T${dt.dropTime}`);
      if (drop <= pickup) errs.dropDate = "Drop date/time must be after pickup";
    }

    setErrors(e => ({ ...e, [expertId]: errs }));
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (expertId) => {
    if (!validate(expertId)) return;
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

            {(() => {
                const errs = errors[expert.id] || {};
                const dt   = rawDT[expert.id]  || {};
                return (
                  <div className="space-y-4">
                    {/* Pickup */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Pickup Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Pickup Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            className={errs.pickupLocation ? inputErrCls : inputCls}
                            placeholder="e.g. Jaipur Railway Station"
                            value={f.pickupLocation || ""}
                            onChange={e => { setF(expert.id, "pickupLocation", e.target.value); setErrors(er => ({ ...er, [expert.id]: { ...(er[expert.id]||{}), pickupLocation: null } })); }}
                          />
                          {errs.pickupLocation && <p className="text-xs text-red-500 mt-0.5">{errs.pickupLocation}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Pickup Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            className={errs.pickupDate ? inputErrCls : inputCls}
                            value={dt.pickupDate || ""}
                            onChange={e => setRaw(expert.id, "pickupDate", e.target.value)}
                          />
                          {errs.pickupDate && <p className="text-xs text-red-500 mt-0.5">{errs.pickupDate}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Pickup Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            className={errs.pickupTimeRaw ? inputErrCls : inputCls}
                            value={dt.pickupTime || ""}
                            onChange={e => setRaw(expert.id, "pickupTime", e.target.value)}
                          />
                          {errs.pickupTimeRaw && <p className="text-xs text-red-500 mt-0.5">{errs.pickupTimeRaw}</p>}
                        </div>
                        {f.pickupTime && (
                          <div className="flex flex-col gap-1 justify-end">
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Formatted</p>
                            <p className="text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg px-3 py-2">
                            {f.pickupTime}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drop */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Drop Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Drop Location <span className="text-red-500">*</span>
                          </label>
                          <input
                            className={errs.dropLocation ? inputErrCls : inputCls}
                            placeholder="e.g. LNMIIT Campus"
                            value={f.dropLocation || ""}
                            onChange={e => { setF(expert.id, "dropLocation", e.target.value); setErrors(er => ({ ...er, [expert.id]: { ...(er[expert.id]||{}), dropLocation: null } })); }}
                          />
                          {errs.dropLocation && <p className="text-xs text-red-500 mt-0.5">{errs.dropLocation}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Drop Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            className={errs.dropDate ? inputErrCls : inputCls}
                            value={dt.dropDate || ""}
                            min={dt.pickupDate || ""}
                            onChange={e => setRaw(expert.id, "dropDate", e.target.value)}
                          />
                          {errs.dropDate && <p className="text-xs text-red-500 mt-0.5">{errs.dropDate}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Drop Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            className={errs.dropTimeRaw ? inputErrCls : inputCls}
                            value={dt.dropTime || ""}
                            onChange={e => setRaw(expert.id, "dropTime", e.target.value)}
                          />
                          {errs.dropTimeRaw && <p className="text-xs text-red-500 mt-0.5">{errs.dropTimeRaw}</p>}
                        </div>
                        {f.dropTime && (
                          <div className="flex flex-col gap-1 justify-end">
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Formatted</p>
                            <p className="text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg px-3 py-2">
                              {f.dropTime}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            <div className="px-5 pb-4 flex justify-end">
              <button onClick={() => handleSave(expert.id)} disabled={saving === expert.id}
                className="bg-[#6b0f1a] hover:bg-rose-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                {saving === expert.id ? "Saving..." : "Save & Notify Registrar Office"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}