import { useEffect, useRef, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StatusBadge({ done, label }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
      done ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
    }`}>
      {done ? `Done — ${label}` : `Pending`}
    </span>
  );
}

function CandidateRecord({ record, onRefresh }) {
  const [open,        setOpen]        = useState(false);
  const [joiningDate, setJoiningDate] = useState(record.joiningDate ? record.joiningDate.split("T")[0] : "");
  const [saving,      setSaving]      = useState(false);
  const offerRef   = useRef();
  const joiningRef = useRef();
  const c = record.candidate;

  const upload = async (type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("pdf",         file);
    fd.append("candidateId", c._id);
    try {
      setSaving(true);
      await API.post(`/establishment/${type === "offer" ? "offer-letter" : "joining-letter"}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`${type === "offer" ? "Offer" : "Joining"} letter uploaded. Candidate notified.`);
      onRefresh();
    } catch { alert("Upload failed"); }
    finally { setSaving(false); }
  };

  const saveJoiningDate = async () => {
    if (!joiningDate) return alert("Please select a joining date");
    try {
      setSaving(true);
      await API.post("/establishment/joining-date", { candidateId: c._id, joiningDate });
      alert("Joining date saved.");
      onRefresh();
    } catch { alert("Failed"); }
    finally { setSaving(false); }
  };

  const step1Done = !!record.offerLetterPath;
  const step2Done = !!record.joiningDate;
  const step3Done = !!record.joiningLetterPath;

  /* Room/LUCS/Estate — show status only, no actions */
  const roomAllotted   = !!record.roomNumber;
  const roomHandedOver = !!record.roomHandedOver;
  const lucsComplete   = !!(record.lucs?.emailAssigned && record.lucs?.itAssetsIssued);

  return (
    <div className="border-b last:border-0">
      {/* Summary row */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}>
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold flex-shrink-0">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{c?.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <StatusBadge done={step1Done} label="Offer sent" />
          {step1Done && <StatusBadge done={step3Done} label="Joining letter sent" />}
        </div>
        <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100 space-y-5 pt-4">

          {/* ─ Step 1: Offer letter ─ */}
          <div className="flex gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${step1Done ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-100 text-blue-700 border-blue-300"}`}>
              {step1Done ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Offer letter</p>
              {step1Done ? (
                <a href={`${BASE}/${record.offerLetterPath}`} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block">View / download offer letter</a>
              ) : (
                <>
                  <input ref={offerRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => upload("offer", e.target.files[0])} />
                  <button onClick={() => offerRef.current.click()} disabled={saving}
                    className="mt-2 border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-white w-full text-center disabled:opacity-60">
                    Upload offer letter PDF — candidate will be notified
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─ Step 2: Joining date ─ */}
          <div className={`flex gap-3 ${!step1Done ? "opacity-40 pointer-events-none" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${step2Done ? "bg-green-100 text-green-700 border-green-300" : step1Done ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
              {step2Done ? "✓" : "2"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Joining date
                {step2Done && <span className="text-xs text-gray-500 font-normal ml-2">
                  {new Date(record.joiningDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
                </span>}
              </p>
              <div className="flex gap-2 mt-2">
                <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1" />
                <button onClick={saveJoiningDate} disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                  {step2Done ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* ─ Step 3: Joining letter ─ */}
          <div className={`flex gap-3 ${!step2Done ? "opacity-40 pointer-events-none" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${step3Done ? "bg-green-100 text-green-700 border-green-300" : step2Done ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
              {step3Done ? "✓" : "3"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Joining letter</p>
              {step3Done ? (
                <a href={`${BASE}/${record.joiningLetterPath}`} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block">View / download joining letter</a>
              ) : (
                <>
                  <input ref={joiningRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => upload("joining", e.target.files[0])} />
                  <button onClick={() => joiningRef.current.click()} disabled={saving}
                    className="mt-2 border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-white w-full text-center disabled:opacity-60">
                    Upload joining letter PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─ Status only: Room / Estate / LUCS ─ */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Downstream status (read-only)</p>
            {[
              { label:"Room allotment (DOFA Office)", done:roomAllotted,   detail: roomAllotted ? `${record.roomBuilding} — Room ${record.roomNumber}` : "Pending" },
              { label:"Room handover (Estate)",       done:roomHandedOver, detail: roomHandedOver ? `Confirmed ${new Date(record.roomHandoverDate).toLocaleDateString("en-GB")}` : "Pending" },
              { label:"IT assets & email (LUCS)",     done:lucsComplete,   detail: lucsComplete ? `Email: ${record.lucs?.emailId || "assigned"}` : "Pending" },
            ].map(({ label, done, detail }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{detail}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${done ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                  {done ? "Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EstablishmentPage() {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get("/establishment/records")
      .then(r => setDepts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  const total    = depts.flatMap(d => d.records).length;
  const offered  = depts.flatMap(d => d.records).filter(r => r.offerLetterPath).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Offer Letters & Joining Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Upload offer and joining letters. Room allotment is handled by DOFA Office.</p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">{total} selected</span>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">{offered} offered</span>
        </div>
      </div>

      {depts.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No selected candidates yet. DOFA Office needs to publish the selection first.</p>
        </div>
      )}

      {depts.map(({ department, records }) => (
        <div key={department} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-amber-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{department}</p>
            <span className="text-amber-100 text-xs">
              {records.filter(r => r.offerLetterPath).length}/{records.length} offers sent
            </span>
          </div>
          {records.map(r => <CandidateRecord key={r._id} record={r} onRefresh={load} />)}
        </div>
      ))}
    </div>
  );
}