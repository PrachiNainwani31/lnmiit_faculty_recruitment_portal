import { useEffect, useState } from "react";
import API from "../../api/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const inputCls  = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300";
const selectCls = inputCls;

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ExpertCard({ item, onSaved }) {
  const { expert, travel } = item;
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    confirmed:      travel?.confirmed      ?? false,
    contactNumber:  travel?.contactNumber  ?? "",
    presenceStatus: travel?.presenceStatus ?? "Pending",
    onlineLink:     travel?.onlineLink     ?? "",
    modeOfTravel:   travel?.modeOfTravel   ?? "Rail",
    traveller: {
      name:              travel?.traveller?.name             ?? expert.fullName ?? "",
      gender:            travel?.traveller?.gender           ?? "Male",
      age:               travel?.traveller?.age              ?? "",
      mealPreference:    travel?.traveller?.mealPreference   ?? "Veg",
      preferredSeat:     travel?.traveller?.preferredSeat    ?? "Lower",
      journeyType:       travel?.traveller?.journeyType      ?? "Direct",
      onwardFrom:        travel?.traveller?.onwardFrom ? travel.traveller.onwardFrom.slice(0,10) : "",
      onwardTime:        travel?.traveller?.onwardTime       ?? "",
      returnFrom:        travel?.traveller?.returnFrom ? travel.traveller.returnFrom.slice(0,10) : "",
      returnTime:        travel?.traveller?.returnTime       ?? "",
      connections:       travel?.traveller?.connections       ?? [{ from:"", to:"", date:"", time:"" }],
      returnConnections: travel?.traveller?.returnConnections ?? [{ from:"", to:"", date:"", time:"" }],
    }
  });

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT = (k, v) => setForm(f => ({ ...f, traveller: { ...f.traveller, [k]: v } }));

  const updateConn = (type, i, field, value) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    const arr = [...form.traveller[key]];
    arr[i] = { ...arr[i], [field]: value };
    setT(key, arr);
  };
  const addConn = (type) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    setT(key, [...form.traveller[key], { from:"", to:"", date:"", time:"" }]);
  };
  const removeConn = (type, i) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    setT(key, form.traveller[key].filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post(`/expert-travel/confirm/${expert._id}`, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = {
    Online:  "bg-green-100 text-green-700 border-green-200",
    Offline: "bg-blue-100 text-blue-700 border-blue-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
  }[travel?.presenceStatus || "Pending"];

  const initials = expert.fullName?.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase() || "EX";
  const jt = form.traveller.journeyType;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{expert.fullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{expert.designation} · {expert.institute} · {expert.email}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
          {travel?.presenceStatus || "Awaiting confirmation"}
        </span>
        {travel?.confirmed && (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full ml-1">✔ Confirmed</span>
        )}
        <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
              ✅ Saved! {form.presenceStatus === "Offline" ? "Ramswaroop has been notified." : "Email sent."}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.confirmed}
              onChange={e => set("confirmed", e.target.checked)}
              className="w-4 h-4 accent-rose-700" />
            <span className="text-sm font-medium text-gray-700">Mark as Confirmed</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Number">
              <input className={inputCls} value={form.contactNumber}
                onChange={e => set("contactNumber", e.target.value)} placeholder="Expert's contact" />
            </Field>
            <Field label="Presence">
              <div className="flex gap-2">
                {["Online","Offline","Pending"].map(p => (
                  <button key={p} onClick={() => set("presenceStatus", p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                      form.presenceStatus === p
                        ? p === "Online"  ? "bg-green-100 text-green-700 border-green-300"
                        : p === "Offline" ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {form.presenceStatus === "Online" && (
            <Field label="Online Meeting Link">
              <input className={inputCls} type="url" value={form.onlineLink}
                onChange={e => set("onlineLink", e.target.value)} placeholder="https://meet.google.com/..." />
            </Field>
          )}

          {form.presenceStatus === "Offline" && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Travel Details</p>

              <Field label="Mode of Travel">
                <div className="flex gap-2">
                  {["Rail","Air","Own Vehicle"].map(m => (
                    <button key={m} onClick={() => set("modeOfTravel", m)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                        form.modeOfTravel === m
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Field>

              {form.modeOfTravel !== "Own Vehicle" && (
                <>
                  {/* Traveller details */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name of Traveller">
                      <input className={inputCls} value={form.traveller.name}
                        onChange={e => setT("name", e.target.value)} />
                    </Field>
                    <Field label="Gender">
                      <select className={selectCls} value={form.traveller.gender}
                        onChange={e => setT("gender", e.target.value)}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </Field>
                    {form.modeOfTravel === "Rail" && (
                      <Field label="Age (Rail only)">
                        <input className={inputCls} type="number" value={form.traveller.age}
                          onChange={e => setT("age", e.target.value)} placeholder="Age" />
                      </Field>
                    )}
                    <Field label="Meal Preference">
                      <select className={selectCls} value={form.traveller.mealPreference}
                        onChange={e => setT("mealPreference", e.target.value)}>
                        <option>Veg</option><option>Non-veg</option>
                      </select>
                    </Field>
                    {form.modeOfTravel === "Rail" && (
                      <Field label="Preferred Seat">
                        <select className={selectCls} value={form.traveller.preferredSeat}
                          onChange={e => setT("preferredSeat", e.target.value)}>
                          <option>Lower</option><option>Middle</option><option>Upper</option>
                          <option>Side Lower</option><option>Side Upper</option>
                        </select>
                      </Field>
                    )}
                  </div>

                  {/* Journey Type toggle */}
                  <Field label="Journey Type">
                    <div className="flex gap-2">
                      {["Direct","Connecting"].map(t => (
                        <button key={t} onClick={() => setT("journeyType", t)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                            jt === t
                              ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* DIRECT — simple date + time */}
                  {jt === "Direct" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Onward Date">
                        <input className={inputCls} type="date" value={form.traveller.onwardFrom}
                          onChange={e => setT("onwardFrom", e.target.value)} />
                      </Field>
                      <Field label="Onward Time">
                        <input className={inputCls} type="time" value={form.traveller.onwardTime}
                          onChange={e => setT("onwardTime", e.target.value)} />
                      </Field>
                      <Field label="Return Date">
                        <input className={inputCls} type="date" value={form.traveller.returnFrom}
                          onChange={e => setT("returnFrom", e.target.value)} />
                      </Field>
                      <Field label="Return Time">
                        <input className={inputCls} type="time" value={form.traveller.returnTime}
                          onChange={e => setT("returnTime", e.target.value)} />
                      </Field>
                    </div>
                  )}

                  {/* CONNECTING — multiple legs */}
                  {jt === "Connecting" && (
                    <div className="space-y-5">

                      {/* Onward legs */}
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                          Onward Journey Legs
                        </p>
                        {form.traveller.connections.map((leg, i) => (
                          <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">From</label>
                              <input className={inputCls} placeholder="City / Station"
                                value={leg.from} onChange={e => updateConn("onward", i, "from", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">To</label>
                              <input className={inputCls} placeholder="City / Station"
                                value={leg.to} onChange={e => updateConn("onward", i, "to", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">Date</label>
                              <input className={inputCls} type="date"
                                value={leg.date} onChange={e => updateConn("onward", i, "date", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">Time</label>
                              <input className={inputCls} type="time"
                                value={leg.time} onChange={e => updateConn("onward", i, "time", e.target.value)} />
                            </div>
                            {i > 0 && (
                              <button onClick={() => removeConn("onward", i)}
                                className="text-red-500 text-xs hover:underline self-end pb-2">Remove</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addConn("onward")}
                          className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                          + Add Connecting Leg
                        </button>
                      </div>

                      {/* Return legs */}
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                          Return Journey Legs
                        </p>
                        {form.traveller.returnConnections.map((leg, i) => (
                          <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">From</label>
                              <input className={inputCls} placeholder="City / Station"
                                value={leg.from} onChange={e => updateConn("return", i, "from", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">To</label>
                              <input className={inputCls} placeholder="City / Station"
                                value={leg.to} onChange={e => updateConn("return", i, "to", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">Date</label>
                              <input className={inputCls} type="date"
                                value={leg.date} onChange={e => updateConn("return", i, "date", e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-gray-400">Time</label>
                              <input className={inputCls} type="time"
                                value={leg.time} onChange={e => updateConn("return", i, "time", e.target.value)} />
                            </div>
                            {i > 0 && (
                              <button onClick={() => removeConn("return", i)}
                                className="text-red-500 text-xs hover:underline self-end pb-2">Remove</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addConn("return")}
                          className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                          + Add Return Leg
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#6b0f1a] hover:bg-rose-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {saving ? "Saving..." : form.presenceStatus === "Offline" ? "Save & Notify Ramswaroop" : "Save & Send Email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpertConfirmation() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get("/expert-travel")
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading experts...</p>;

  const confirmed = items.filter(i => i.travel?.confirmed).length;
  const pending   = items.filter(i => !i.travel?.confirmed).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">External Expert Confirmation</h1>
          <p className="text-sm text-gray-500 mt-1">Mark attendance and enter travel details for each expert.</p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">{confirmed} confirmed</span>
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">{pending} pending</span>
        </div>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No experts uploaded yet.</div>
      )}

      {items.map(item => (
        <ExpertCard key={item.expert._id} item={item} onSaved={load} />
      ))}
    </div>
  );
}