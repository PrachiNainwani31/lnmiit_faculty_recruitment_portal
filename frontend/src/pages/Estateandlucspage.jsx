/* ══════════════════════════════════════
   EstatePage.jsx
══════════════════════════════════════ */
import { useEffect, useState } from "react";
import API from "../api/api";

export function EstatePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => API.get("/onboarding/estate")
    .then(r => setRecords(r.data)).catch(console.error)
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Room Handover Confirmation</h1>
        <p className="text-sm text-gray-500 mt-1">Confirm physical room handover for each candidate.</p>
      </div>

      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No room allotments pending handover.</p>
        </div>
      )}

      {records.map(r => (
        <EstateCard key={r.id} record={r} onRefresh={load} />
      ))}
    </div>
  );
}

function EstateCard({ record, onRefresh }) {
  const [date,    setDate]    = useState("");
  const [time,    setTime]    = useState("");
  const [notes,   setNotes]   = useState(record.roomHandoverNotes || "");
  const [saving,  setSaving]  = useState(false);
  const c = record.candidate;

  if (record.roomHandedOver) return (
    <div className="bg-white rounded-xl border border-green-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{record.roomBuilding} — Room {record.roomNumber}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
          Handed over on {new Date(record.roomHandoverDate).toLocaleDateString("en-GB")}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xs font-semibold">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{record.roomBuilding} — Room {record.roomNumber}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        <p>Allotted by DOFA Office on {new Date(record.roomAllottedAt).toLocaleDateString("en-GB")}</p>
        {record.roomNotes && <p className="text-xs mt-1 text-blue-500">{record.roomNotes}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Handover Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Handover Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
      </div>

      <div><label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Notes</label>
        <textarea rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Keys handed, inventory checked..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" /></div>

      <div className="flex justify-end">
        <button disabled={saving} onClick={async () => {
          if (!date) return alert("Please enter handover date");
          setSaving(true);
          try {
            await API.post("/onboarding/estate/confirm", {
              candidateId:   c.id,
              handoverDate:  date,
              handoverNotes: notes,
            });
            onRefresh();
          } catch { alert("Failed"); }
          finally { setSaving(false); }
        }} className="bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
          {saving ? "Saving..." : "Confirm Room Handover"}
        </button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════
   LucsPage.jsx
══════════════════════════════════════ */
export function LucsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => API.get("/onboarding/lucs")
    .then(r => setRecords(r.data)).catch(console.error)
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">IT Asset Assignment</h1>
        <p className="text-sm text-gray-500 mt-1">Assign institute email, IT assets, WiFi, and portal login. Confirm each item.</p>
      </div>

      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No candidates pending IT asset assignment.</p>
          <p className="text-xs mt-2">Available after Estate confirms room handover.</p>
        </div>
      )}

      {records.map(r => <LucsCard key={r.id} record={r} onRefresh={load} />)}
    </div>
  );
}

function LucsCard({ record, onRefresh }) {
  const c = record.candidate;
  const l = record.lucs || {};
  const [form, setForm] = useState({
    emailAssigned:   l.emailAssigned   ?? false,
    emailId:         l.emailId         ?? "",
    itAssetsIssued:  l.itAssetsIssued  ?? false,
    wifiProvided:    l.wifiProvided    ?? false,
    portalLoginDone: l.portalLoginDone ?? false,
  });
  const [saving, setSaving] = useState(false);

  const allDone = form.emailAssigned && form.itAssetsIssued && form.wifiProvided && form.portalLoginDone;

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post("/onboarding/lucs/update", { candidateId: c.id, ...form });
      alert(allDone ? "All items confirmed. Establishment notified." : "Progress saved.");
      onRefresh();
    } catch { alert("Failed"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-semibold">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{record.department} · Room {record.roomNumber}</p>
        </div>
      </div>

      {[
        { key:"emailAssigned",   label:"Institute email assigned",    hasInput: true,   inputKey:"emailId", placeholder:"asharma@lnmiit.ac.in" },
        { key:"itAssetsIssued",  label:"IT assets issued (laptop, keyboard, mouse)" },
        { key:"wifiProvided",    label:"WiFi password provided"       },
        { key:"portalLoginDone", label:"ERP / LMS portal login done"  },
      ].map(({ key, label, hasInput, inputKey, placeholder }) => (
        <div key={key} className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
              className="w-4 h-4 accent-teal-600" />
            <span className="text-sm text-gray-700">{label}</span>
            {form[key] && l[key] && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full ml-auto">Done</span>
            )}
          </label>
          {hasInput && form[key] && (
            <input className={inputCls} placeholder={placeholder}
              value={form[inputKey]} onChange={e => setForm(f => ({ ...f, [inputKey]: e.target.value }))} />
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition ${
            allDone ? "bg-teal-700 hover:bg-teal-800" : "bg-blue-600 hover:bg-blue-700"
          }`}>
          {saving ? "Saving..." : allDone ? "Confirm All & Notify Establishment" : "Save Progress"}
        </button>
      </div>
    </div>
  );
}