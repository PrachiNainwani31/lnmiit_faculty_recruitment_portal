// pages/dofa-office/Expertconfirmation.jsx
// ✅ FIX: TravelStatusPanel only shows quote section for Offline experts
// ✅ FIX: Quote badges only show for Offline experts
import { useEffect, useState } from "react";
import API from "../../api/api";

const BASE      = import.meta.env.VITE_API_URL || "http://localhost:5000";
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

/* ── Live status panel — only shows quote section for Offline experts ── */
function TravelStatusPanel({ travel }) {
  const t          = travel || {};
  const pd         = t.pickupDrop || {};
  const q          = t.quote;
  const isOffline  = t.presenceStatus === "Offline";

  // ✅ FIX: quote only shown when expert is Offline
  const hasAny = (isOffline && q) || t.ticketPath || t.invoicePath || pd.driverName || pd.pickupLocation;
  if (!hasAny) return null;

  const qColor = {
    PENDING:  "bg-amber-50 border-amber-200 text-amber-700",
    APPROVED: "bg-green-50 border-green-200 text-green-700",
    REJECTED: "bg-red-50 border-red-200 text-red-700",
  }[q?.status] || "";

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
        📋 Live Status from Travel Portal
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">

        {/* ✅ Quote — only for Offline */}
        {isOffline && q && (
          <div className={`rounded-lg border px-3 py-2 ${qColor}`}>
            <p className="font-semibold uppercase tracking-wide opacity-70">Quote</p>
            <p className="font-bold text-sm mt-0.5">₹{q.amount}</p>
            <p className="opacity-70">{q.vendor || "—"} · {q.status}</p>
            {q.status === "REJECTED" && q.rejectionNote && (
              <p className="text-red-600 mt-1">❌ {q.rejectionNote}</p>
            )}
          </div>
        )}

        {/* Ticket */}
        <div className={`rounded-lg border px-3 py-2 ${t.ticketPath ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <p className="font-semibold uppercase tracking-wide opacity-70">Ticket</p>
          {t.ticketPath ? (
            <a href={`${BASE}/${t.ticketPath}`} target="_blank" rel="noreferrer"
              className="text-blue-600 hover:underline mt-0.5 block font-medium">📄 View Ticket</a>
          ) : (
            <p className="text-gray-400 mt-0.5">Not uploaded yet</p>
          )}
          {t.ticketUploadedAt && (
            <p className="opacity-60">{new Date(t.ticketUploadedAt).toLocaleDateString("en-GB")}</p>
          )}
        </div>

        {/* Invoice */}
        <div className={`rounded-lg border px-3 py-2 ${t.invoicePath ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <p className="font-semibold uppercase tracking-wide opacity-70">Invoice</p>
          {t.invoicePath ? (
            <a href={`${BASE}/${t.invoicePath}`} target="_blank" rel="noreferrer"
              className="text-blue-600 hover:underline mt-0.5 block font-medium">🧾 View Invoice</a>
          ) : (
            <p className="text-gray-400 mt-0.5">Not uploaded yet</p>
          )}
        </div>

        {/* Pickup */}
        {pd.pickupLocation && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <p className="font-semibold uppercase tracking-wide text-indigo-600 opacity-80">Pickup</p>
            <p className="font-medium text-indigo-800 mt-0.5">{pd.pickupLocation}</p>
            <p className="text-indigo-600 opacity-80">{pd.pickupTime || "—"}</p>
          </div>
        )}

        {/* Drop */}
        {pd.dropLocation && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <p className="font-semibold uppercase tracking-wide text-indigo-600 opacity-80">Drop</p>
            <p className="font-medium text-indigo-800 mt-0.5">{pd.dropLocation}</p>
            <p className="text-indigo-600 opacity-80">{pd.dropTime || "—"}</p>
          </div>
        )}

        {/* Driver */}
        <div className={`rounded-lg border px-3 py-2 ${pd.driverName ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          <p className="font-semibold uppercase tracking-wide opacity-70">Driver</p>
          {pd.driverName ? (
            <>
              <p className="font-medium text-gray-800 mt-0.5">{pd.driverName}</p>
              <p className="text-gray-600">{pd.driverContact}</p>
            </>
          ) : (
            <p className="text-amber-600 mt-0.5 font-medium">Not yet assigned</p>
          )}
        </div>
      </div>
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
      name:              travel?.traveller?.name              ?? expert.fullName ?? "",
      gender:            travel?.traveller?.gender            ?? "Male",
      age:               travel?.traveller?.age               ?? "",
      mealPreference:    travel?.traveller?.mealPreference    ?? "Veg",
      preferredSeat:     travel?.traveller?.preferredSeat     ?? "Lower",
      journeyType:       travel?.traveller?.journeyType       ?? "Direct",
      onwardFrom:        travel?.traveller?.onwardFrom
        ? new Date(travel.traveller.onwardFrom).toISOString().split("T")[0] : "",
      onwardTime:        travel?.traveller?.onwardTime        ?? "",
      onwardFromCity:    travel?.traveller?.onwardFromCity    ?? "",
      onwardToCity:      travel?.traveller?.onwardToCity      ?? "",
      onwardFlightNo:    travel?.traveller?.onwardFlightNo    ?? "",
      returnFrom:        travel?.traveller?.returnFrom
        ? new Date(travel.traveller.returnFrom).toISOString().split("T")[0] : "",
      returnTime:        travel?.traveller?.returnTime        ?? "",
      returnFromCity:    travel?.traveller?.returnFromCity    ?? "",
      returnToCity:      travel?.traveller?.returnToCity      ?? "",
      returnFlightNo:    travel?.traveller?.returnFlightNo    ?? "",
      connections:       travel?.traveller?.connections       ?? [{ from:"", to:"", date:"", time:"", flightNo:"" }],
      returnConnections: travel?.traveller?.returnConnections ?? [{ from:"", to:"", date:"", time:"", flightNo:"" }],
    },
  });

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setT = (k, v) => setForm(f => ({ ...f, traveller: { ...f.traveller, [k]: v } }));

  const updateConn = (type, i, field, value) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    const arr = [...form.traveller[key]];
    arr[i] = { ...arr[i], [field]: value };
    setT(key, arr);
  };
  const addConn    = (type) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    setT(key, [...form.traveller[key], { from:"", to:"", date:"", time:"", flightNo:"" }]);
  };
  const removeConn = (type, i) => {
    const key = type === "onward" ? "connections" : "returnConnections";
    setT(key, form.traveller[key].filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post(`/expert-travel/confirm/${expert.id}`, form);
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

  const initials  = expert.fullName?.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase() || "EX";
  const jt        = form.traveller.journeyType;
  const isAir     = form.modeOfTravel === "Air";
  const isOffline = travel?.presenceStatus === "Offline"; // ✅ used to gate quote badges

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{expert.fullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{expert.designation} · {expert.institute}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
            {travel?.presenceStatus || "Pending"}
          </span>
          {travel?.confirmed && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">✔ Confirmed</span>
          )}
          {travel?.traveller?.age && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Age: {travel.traveller.age}</span>
          )}
          {travel?.pickupDrop?.driverName && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
              🚗 {travel.pickupDrop.driverName}
            </span>
          )}
          {travel?.ticketPath && (
            <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">🎫 Ticket</span>
          )}
          {/* ✅ FIX: quote badges ONLY for Offline experts */}
          {isOffline && travel?.quote?.status === "APPROVED" && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">✓ Quote</span>
          )}
          {isOffline && travel?.quote?.amount && travel?.quote?.status === "PENDING" && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Quote Pending</span>
          )}
        </div>
        <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
              ✅ Saved! {form.presenceStatus === "Offline" ? "Registrar Office has been notified." : ""}
            </div>
          )}

          <TravelStatusPanel travel={travel} />

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
            <div className="bg-white rounded-xl p-4 space-y-4 border border-gray-200">
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
                    <Field label="Age">
                      <input className={inputCls} type="number" min="1" max="120"
                        value={form.traveller.age}
                        onChange={e => setT("age", e.target.value)} placeholder="e.g. 52" />
                    </Field>
                    <Field label="Meal Preference">
                      <select className={selectCls} value={form.traveller.mealPreference}
                        onChange={e => setT("mealPreference", e.target.value)}>
                        <option>Veg</option><option>Non-veg</option>
                      </select>
                    </Field>
                    {form.modeOfTravel === "Rail" && (
                      <Field label="Preferred Berth">
                        <select className={selectCls} value={form.traveller.preferredSeat}
                          onChange={e => setT("preferredSeat", e.target.value)}>
                          <option>Lower</option><option>Middle</option><option>Upper</option>
                          <option>Side Lower</option><option>Side Upper</option>
                        </select>
                      </Field>
                    )}
                    {isAir && (
                      <Field label="Seat Preference (Flight)">
                        <select className={selectCls} value={form.traveller.preferredSeat}
                          onChange={e => setT("preferredSeat", e.target.value)}>
                          <option>Window</option><option>Middle</option><option>Aisle</option>
                          <option>No preference</option>
                        </select>
                      </Field>
                    )}
                  </div>

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

                  {jt === "Direct" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Onward Journey</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="From">
                          <input className={inputCls} value={form.traveller.onwardFromCity}
                            onChange={e => setT("onwardFromCity", e.target.value)} placeholder="e.g. Delhi (DEL)" />
                        </Field>
                        <Field label="To">
                          <input className={inputCls} value={form.traveller.onwardToCity}
                            onChange={e => setT("onwardToCity", e.target.value)} placeholder="e.g. Jaipur (JAI)" />
                        </Field>
                        <Field label="Date">
                          <input className={inputCls} type="date" value={form.traveller.onwardFrom}
                            onChange={e => setT("onwardFrom", e.target.value)} />
                        </Field>
                        <Field label="Time">
                          <input className={inputCls} type="time" value={form.traveller.onwardTime}
                            onChange={e => setT("onwardTime", e.target.value)} />
                        </Field>
                        {(isAir || form.modeOfTravel === "Rail") && (
                          <Field label={isAir ? "Flight No." : "Train No."}>
                            <input className={inputCls} value={form.traveller.onwardFlightNo}
                              onChange={e => setT("onwardFlightNo", e.target.value)}
                              placeholder={isAir ? "e.g. 6E 5033 (A321)" : "e.g. 12956"} />
                          </Field>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mt-2">Return Journey</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="From">
                          <input className={inputCls} value={form.traveller.returnFromCity}
                            onChange={e => setT("returnFromCity", e.target.value)} placeholder="e.g. Jaipur (JAI)" />
                        </Field>
                        <Field label="To">
                          <input className={inputCls} value={form.traveller.returnToCity}
                            onChange={e => setT("returnToCity", e.target.value)} placeholder="e.g. Delhi (DEL)" />
                        </Field>
                        <Field label="Date">
                          <input className={inputCls} type="date" value={form.traveller.returnFrom}
                            onChange={e => setT("returnFrom", e.target.value)} />
                        </Field>
                        <Field label="Time">
                          <input className={inputCls} type="time" value={form.traveller.returnTime}
                            onChange={e => setT("returnTime", e.target.value)} />
                        </Field>
                        {(isAir || form.modeOfTravel === "Rail") && (
                          <Field label={isAir ? "Return Flight No." : "Return Train No."}>
                            <input className={inputCls} value={form.traveller.returnFlightNo}
                              onChange={e => setT("returnFlightNo", e.target.value)}
                              placeholder={isAir ? "e.g. 6E 2376" : "e.g. 12955"} />
                          </Field>
                        )}
                      </div>
                    </div>
                  )}

                  {jt === "Connecting" && (
                    <div className="space-y-5">
                      {["onward","return"].map(type => (
                        <div key={type}>
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                            {type === "onward" ? "Onward" : "Return"} Legs
                          </p>
                          {form.traveller[type === "onward" ? "connections" : "returnConnections"].map((leg, i) => (
                            <div key={i} className="grid grid-cols-3 gap-2 mb-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                              {["from","to"].map(f => (
                                <div key={f} className="flex flex-col gap-1">
                                  <label className="text-xs text-gray-400 capitalize">{f}</label>
                                  <input className={inputCls} placeholder="City"
                                    value={leg[f]} onChange={e => updateConn(type, i, f, e.target.value)} />
                                </div>
                              ))}
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Date</label>
                                <input className={inputCls} type="date" value={leg.date}
                                  onChange={e => updateConn(type, i, "date", e.target.value)} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Time</label>
                                <input className={inputCls} type="time" value={leg.time}
                                  onChange={e => updateConn(type, i, "time", e.target.value)} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">{isAir ? "Flight No." : "Train No."}</label>
                                <input className={inputCls} value={leg.flightNo || ""}
                                  onChange={e => updateConn(type, i, "flightNo", e.target.value)} />
                              </div>
                              {i > 0 && (
                                <button onClick={() => removeConn(type, i)}
                                  className="text-red-500 text-xs hover:underline self-end pb-2">Remove</button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addConn(type)}
                            className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                            + Add Leg
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#6b0f1a] hover:bg-rose-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {saving ? "Saving..." : form.presenceStatus === "Offline" ? "Save & Notify Registrar Office" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpertConfirmation() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get("/expert-travel")
      .then(res => {
        const map = {};
        res.data.forEach(({ expert, travel }) => {
          const groupKey = expert.uploadedBy?.role === "HOD"
            ? `${expert.uploadedBy.department || "HOD"} Department`
            : expert.department || "Manual Entry";
          if (!map[groupKey]) map[groupKey] = { isHod: expert.uploadedBy?.role === "HOD", items: [] };
          map[groupKey].items.push({ expert, travel });
        });
        setGrouped(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading experts…</p>;

  const allItems  = Object.values(grouped).flatMap(g => g.items);
  const confirmed = allItems.filter(i => i.travel?.confirmed).length;
  const pending   = allItems.filter(i => !i.travel?.confirmed).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">External Expert Confirmation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mark attendance and enter travel details. Live status from Travel Portal shown below.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">{confirmed} confirmed</span>
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">{pending} pending</span>
        </div>
      </div>

      {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([groupKey, { isHod, items }]) => (
        <div key={groupKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className={`px-5 py-3 flex items-center justify-between ${isHod ? "bg-[#6b0f1a]" : "bg-indigo-600"}`}>
            <div>
              <p className="text-white font-medium text-sm">{groupKey}</p>
              <p className="text-white/50 text-xs mt-0.5">{isHod ? "HOD uploaded" : "Added by DOFA"}</p>
            </div>
            <span className="text-white/60 text-xs">
              {items.filter(i => i.travel?.confirmed).length}/{items.length} confirmed
            </span>
          </div>
          {items.map(item => (
            <ExpertCard key={item.expert.id} item={item} onSaved={load} />
          ))}
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No experts uploaded yet.</div>
      )}
    </div>
  );
}