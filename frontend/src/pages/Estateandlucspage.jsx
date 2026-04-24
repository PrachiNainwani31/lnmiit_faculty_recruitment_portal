// pages/Estateandlucspage.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

const BASE    = import.meta.env.VITE_API_URL;
const inputSm = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-300";

/* ══════════════════════════════════════
   ESTATE PAGE
══════════════════════════════════════ */
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
        <h1 className="text-xl font-semibold text-gray-800">Office Handover Confirmation</h1>
        <p className="text-sm text-gray-500 mt-1">Confirm physical office handover for each candidate.</p>
      </div>
      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No office allotments pending handover.</p>
        </div>
      )}
      {records.map(r => <EstateCard key={r.id} record={r} onRefresh={load} />)}
    </div>
  );
}

function EstateCard({ record, onRefresh }) {
  const [date,   setDate]   = useState("");
  const [notes,  setNotes]  = useState(record.roomHandoverNotes || "");
  const [saving, setSaving] = useState(false);
  const c = record.candidate;

  if (record.roomHandedOver) return (
    <div className="bg-white rounded-xl border border-green-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{record.roomBuilding} — Room {record.roomNumber}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
          ✓ Handed over {new Date(record.roomHandoverDate).toLocaleDateString("en-GB")}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xs font-bold">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{record.roomBuilding} — Room {record.roomNumber}</p>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        Allotted by DOFA Office on {new Date(record.roomAllottedAt).toLocaleDateString("en-GB")}
        {record.roomNotes && <p className="text-xs mt-1 text-blue-500">{record.roomNotes}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Handover Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputSm} />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Assests</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Keys handed, inventory checked..." className={inputSm} />
        </div>
      </div>
      <div className="flex justify-end">
        <button disabled={saving} onClick={async () => {
          if (!date) return alert("Please enter handover date");
          setSaving(true);
          try {
            await API.post("/onboarding/estate/confirm", { candidateId: c.id, handoverDate: date, handoverNotes: notes });
            onRefresh();
          } catch { alert("Failed"); }
          finally { setSaving(false); }
        }} className="bg-pink-700 hover:bg-pink-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
          {saving ? "Saving..." : "Confirm Office Handover"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   LUCS PAGE
   Gated: only accessible after
   Establishment uploads joining letter.
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
        <p className="text-sm text-gray-500 mt-1">
          Assign institute email, IT assets, WiFi, and website login credentials.
          Available only after Establishment uploads the joining letter.
        </p>
      </div>
      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="font-medium">No candidates available yet</p>
          <p className="text-xs mt-2">
            This section becomes active after Establishment uploads the joining letter for each candidate.
          </p>
        </div>
      )}
      {records.map(r => <LucsCard key={r.id} record={r} onRefresh={load} />)}
    </div>
  );
}

function LucsCard({ record, onRefresh }) {
  const c = record.candidate;

  const [form, setForm] = useState({
    emailAssigned:    record.lucsEmailAssigned    ?? false,
    emailId:          record.lucsEmailId          ?? "",
    itAssetsIssued:   record.lucsItAssetsIssued   ?? false,
    itAssetsNote:     record.lucsItAssetsNote      ?? "",
    wifiProvided:     record.lucsWifiProvided      ?? false,
    websiteLogin:     record.lucsWebsiteLogin      ?? false,  // ✅ renamed from ERP/LMS
    websiteLoginNote: record.lucsWebsiteLoginNote  ?? "",
    otherDone:        record.lucsOtherDone         ?? false,
    otherNote:        record.lucsOtherNote         ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Gate: locked if joining letter not yet uploaded
  const isLocked    = !record.joiningLetterPath;
  const allCoreDone = form.emailAssigned && form.itAssetsIssued && form.wifiProvided && form.websiteLogin;
  const isComplete  = !!(record.lucsConfirmedAt);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.post("/onboarding/lucs/update", { candidateId: c.id, ...form });
      alert(allCoreDone ? "All items confirmed. Establishment notified." : "Progress saved.");
      onRefresh();
    } catch (err) {
      if (err.response?.data?.gated) {
        alert("Joining letter not yet uploaded by Establishment. LUCS cannot be updated yet.");
      } else {
        alert("Failed to save");
      }
    } finally { setSaving(false); }
  };

  return (
    <div className={`bg-white rounded-xl border p-5 space-y-4 ${isComplete ? "border-green-200" : "border-gray-200"}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
            {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
            <p className="text-xs text-gray-400">{record.department} · Room {record.roomNumber || "—"}</p>
          </div>
        </div>
        {isComplete && (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
            ✓ Complete
          </span>
        )}
        {isLocked && (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
            Awaiting joining letter
          </span>
        )}
      </div>

      {/* Locked state — joining letter not yet uploaded */}
      {isLocked ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 text-center space-y-1">
          <p className="text-sm font-medium text-amber-800">Locked — Joining letter not uploaded yet</p>
          <p className="text-xs text-amber-600">
            Establishment must upload the joining letter before LUCS can assign IT assets.
          </p>
        </div>
      ) : (
        <>
          {/* Joining letter reference link */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-lg">📄</span>
              <div>
                <p className="text-xs font-semibold text-blue-800">Joining Letter</p>
                <p className="text-xs text-blue-500">Uploaded by Establishment</p>
              </div>
            </div>
            <a
              href={`${BASE}/${record.joiningLetterPath}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              View PDF ↗
            </a>
          </div>
          {/* ── Item 1: Institute email ── */}
          <CheckItem checked={form.emailAssigned} onChange={v => set("emailAssigned", v)}
            label="Institute email assigned" savedDone={!!record.lucsEmailAssigned}>
            {form.emailAssigned && (
              <input className={inputSm} placeholder="e.g. asharma@lnmiit.ac.in"
                value={form.emailId} onChange={e => set("emailId", e.target.value)} />
            )}
          </CheckItem>

          {/* ── Item 2: IT assets — with textbox ── */}
          <CheckItem checked={form.itAssetsIssued} onChange={v => set("itAssetsIssued", v)}
            label="IT assets issued" savedDone={!!record.lucsItAssetsIssued}>
            {form.itAssetsIssued && (
              <>
                <p className="text-xs text-gray-400 mb-1">List all items issued:</p>
                <textarea rows={3} className={`${inputSm} resize-none`}
                  placeholder="e.g. Laptop — Dell XPS 15 (SN: 12345), Keyboard, Mouse, Monitor 24&quot;"
                  value={form.itAssetsNote} onChange={e => set("itAssetsNote", e.target.value)} />
              </>
            )}
          </CheckItem>

          {/* ── Item 3: WiFi ── */}
          <CheckItem checked={form.wifiProvided} onChange={v => set("wifiProvided", v)}
            label="WiFi password provided" savedDone={!!record.lucsWifiProvided} />

          {/* ── Item 4: Website login (renamed from ERP/LMS) ── */}
          <CheckItem checked={form.websiteLogin} onChange={v => set("websiteLogin", v)}
            label="Website login credentials provided" savedDone={!!record.lucsWebsiteLogin} />

          {/* ── Item 5: Other — with textbox ── */}
          <CheckItem checked={form.otherDone} onChange={v => set("otherDone", v)}
            label="Other" savedDone={!!record.lucsOtherDone}>
            {form.otherDone && (
              <>
                <p className="text-xs text-gray-400 mb-1">Describe additional items or tasks:</p>
                <textarea rows={3} className={`${inputSm} resize-none`}
                  placeholder=""
                  value={form.otherNote} onChange={e => set("otherNote", e.target.value)} />
              </>
            )}
          </CheckItem>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <button onClick={handleSave} disabled={saving}
              className={`px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition ${
                allCoreDone ? "bg-teal-700 hover:bg-teal-800" : "bg-blue-600 hover:bg-blue-700"
              }`}>
              {saving ? "Saving…" : allCoreDone ? "✓ Confirm All & Notify Establishment" : "Save Progress"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Reusable checkbox row ── */
function CheckItem({ checked, onChange, label, savedDone, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer group">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 accent-teal-600 cursor-pointer" />
        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">{label}</span>
        {savedDone && checked && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
            Saved ✓
          </span>
        )}
      </label>
      {children && <div className="ml-7">{children}</div>}
    </div>
  );
}

export function EstateLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/onboarding/estate/logs")
      .then(r => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Office Handover Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Completed cycles — office handover records.</p>
      </div>
      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No closed cycle records found.</p>
        </div>
      )}
      {records.map(r => {
        const c = r.candidate;
        return (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xs font-bold">
                  {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
                  <p className="text-xs text-gray-400">{r.department} · {r.cycle}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {r.roomNumber && (
                  <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                    Room {r.roomNumber}
                  </span>
                )}
                {r.roomHandedOver ? (
                  <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                    ✓ Handed over {new Date(r.roomHandoverDate).toLocaleDateString("en-GB")}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
                    Not handed over
                  </span>
                )}
              </div>
            </div>
            {r.roomHandoverNotes && (
              <p className="text-xs text-gray-500 mt-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                Notes: {r.roomHandoverNotes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   LUCS LOGS PAGE
══════════════════════════════════════ */
export function LucsLogsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/onboarding/lucs/logs")
      .then(r => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">IT Assignment Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Completed cycles — IT asset records.</p>
      </div>
      {records.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p>No closed cycle records found.</p>
        </div>
      )}
      {records.map(r => {
        const c = r.candidate;
        return (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                  {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
                  <p className="text-xs text-gray-400">{r.department} · {r.cycle}</p>
                </div>
              </div>
              {r.lucsConfirmedAt ? (
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                  ✓ Completed {new Date(r.lucsConfirmedAt).toLocaleDateString("en-GB")}
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                  Incomplete
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Email Assigned", done: r.lucsEmailAssigned, detail: r.lucsEmailId },
                { label: "IT Assets",      done: r.lucsItAssetsIssued, detail: r.lucsItAssetsNote },
                { label: "WiFi",           done: r.lucsWifiProvided },
                { label: "Website Login",  done: r.lucsWebsiteLogin },
              ].map(({ label, done, detail }) => (
                <div key={label} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  <span className={done ? "text-green-600" : "text-gray-300"}>
                    {done ? "✓" : "○"}
                  </span>
                  <div>
                    <p className={done ? "text-gray-700 font-medium" : "text-gray-400"}>{label}</p>
                    {detail && <p className="text-gray-400 mt-0.5">{detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}