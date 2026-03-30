// pages/Establishmentpage.jsx
import { useEffect, useRef, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StatusBadge({ done, label }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
      done
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-amber-100 text-amber-700 border-amber-200"
    }`}>
      {done ? `Done — ${label}` : "Pending"}
    </span>
  );
}

function CandidateRecord({ record, onRefresh }) {
  const [open,        setOpen]        = useState(false);
  const [joiningDate, setJoiningDate] = useState(
    record.joiningDate ? record.joiningDate.split("T")[0] : ""
  );
  const [saving,      setSaving]      = useState(false);

  // MIS + Library form state
  const [misLoginDone,   setMisLoginDone]   = useState(!!record.misLoginDone);
  const [misLoginNote,   setMisLoginNote]   = useState(record.misLoginNote   || "");
  const [libraryDone,    setLibraryDone]    = useState(!!record.libraryDone);
  const [libraryDetails, setLibraryDetails] = useState(record.libraryDetails || "");
  const [mlSaving,       setMlSaving]       = useState(false);

  const offerRef   = useRef();
  const joiningRef = useRef();
  const rfidRef    = useRef();

  const c = record.candidate;

  const upload = async (type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("pdf",         file);
    fd.append("candidateId", c.id);
    try {
      setSaving(true);
      await API.post(
        `/establishment/${type === "offer" ? "offer-letter" : "joining-letter"}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(`${type === "offer" ? "Offer" : "Joining"} letter uploaded.${type === "offer" ? " Candidate notified." : ""}`);
      onRefresh();
    } catch { alert("Upload failed"); }
    finally { setSaving(false); }
  };

  const saveJoiningDate = async () => {
    if (!joiningDate) return alert("Please select a joining date");
    try {
      setSaving(true);
      await API.post("/establishment/joining-date", { candidateId: c.id, joiningDate });
      alert("Joining date saved. Candidate notified.");
      onRefresh();
    } catch { alert("Failed"); }
    finally { setSaving(false); }
  };

  const saveMisLibrary = async () => {
    try {
      setMlSaving(true);
      await API.post("/establishment/mis-library", {
        candidateId:    c.id,
        misLoginDone,   misLoginNote,
        libraryDone,    libraryDetails,
      });
      alert("MIS & Library details saved.");
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    } finally { setMlSaving(false); }
  };

  const uploadRfid = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("pdf",         file);
    fd.append("candidateId", c.id);
    try {
      setSaving(true);
      await API.post("/establishment/rfid-card", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("RFID card uploaded.");
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally { setSaving(false); }
  };

  const sendRfid = async () => {
    if (!window.confirm(`Send RFID card to ${c.fullName} (${c.email})?`)) return;
    try {
      setSaving(true);
      await API.post("/establishment/rfid-send", { candidateId: c.id });
      alert("RFID card sent to candidate.");
      onRefresh();
    } catch { alert("Failed to send"); }
    finally { setSaving(false); }
  };

  const step1Done = !!record.offerLetterPath;
  const step2Done = !!record.joiningDate;
  const step3Done = !!record.joiningLetterPath;
  // ✅ Gate: MIS/Library only after joining letter uploaded
  const step4Done = !!(record.misLoginDone && record.libraryDone);
  const step5Done = !!record.rfidSentToCandidate;

  // ✅ Gate: offer letter only after DOFA Office marks interview complete
  const interviewComplete = !!record.interviewComplete;

  const stepCls = (done, prev) =>
    `flex gap-3 ${!prev ? "opacity-40 pointer-events-none" : ""}`;

  const numCls = (done, prev) =>
    `w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${
      done    ? "bg-green-100 text-green-700 border-green-300"
      : prev  ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200"
    }`;

  const inputCls = "border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-amber-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block";

  return (
    <div className="border-b last:border-0">
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold flex-shrink-0">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{c?.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <StatusBadge done={step1Done} label="Offer sent" />
          {step1Done && <StatusBadge done={step3Done} label="Joining letter" />}
          {step3Done && <StatusBadge done={step4Done} label="MIS & Library" />}
          {step4Done && <StatusBadge done={step5Done} label="RFID sent" />}
        </div>
        <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="px-5 pb-6 bg-gray-50 border-t border-gray-100 space-y-6 pt-5">

          {/* ─ Step 1: Offer letter — gated by interview complete ─ */}
          <div className={stepCls(step1Done, true)}>
            <div className={numCls(step1Done, true)}>{step1Done ? "✓" : "1"}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Offer letter</p>
              {!interviewComplete && !step1Done ? (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  🔒 Locked — DOFA Office must mark interview as complete first
                </div>
              ) : step1Done ? (
                <a href={`${BASE}/${record.offerLetterPath}`} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block">
                  View / download offer letter
                </a>
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
          <div className={stepCls(step2Done, step1Done)}>
            <div className={numCls(step2Done, step1Done)}>{step2Done ? "✓" : "2"}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Joining date
                {step2Done && (
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    {new Date(record.joiningDate).toLocaleDateString("en-GB", {
                      day:"numeric", month:"long", year:"numeric",
                    })}
                  </span>
                )}
              </p>
              <div className="flex gap-2 mt-2">
                <input type="date" value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  className={`${inputCls} flex-1`} />
                <button onClick={saveJoiningDate} disabled={saving}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                  {step2Done ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* ─ Step 3: Joining letter ─ */}
          <div className={stepCls(step3Done, step2Done)}>
            <div className={numCls(step3Done, step2Done)}>{step3Done ? "✓" : "3"}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                Joining letter
                <span className="text-xs text-gray-400 font-normal ml-1">(internal — not sent to candidate)</span>
              </p>
              {step3Done ? (
                <a href={`${BASE}/${record.joiningLetterPath}`} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 block">
                  View / download joining letter
                </a>
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

          {/* ─ Step 4: MIS Login + Library ─ */}
          <div className={stepCls(step4Done, step3Done)}>
            <div className={numCls(step4Done, step3Done)}>{step4Done ? "✓" : "4"}</div>
            <div className="flex-1 space-y-4">
              <p className="text-sm font-medium text-gray-700">MIS Login & Library Details</p>

              {/* MIS Login */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`mis-${c.id}`}
                    checked={misLoginDone}
                    onChange={e => setMisLoginDone(e.target.checked)}
                    className="w-4 h-4 accent-amber-600" />
                  <label htmlFor={`mis-${c.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    MIS Portal Login Assigned
                  </label>
                </div>
                {misLoginDone && (
                  <div>
                    <label className={lbl}>Login URL / Username / Note</label>
                    <input className={inputCls} placeholder="e.g. https://mis.lnmiit.ac.in · username: firstname.dept"
                      value={misLoginNote}
                      onChange={e => setMisLoginNote(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Library */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`lib-${c.id}`}
                    checked={libraryDone}
                    onChange={e => setLibraryDone(e.target.checked)}
                    className="w-4 h-4 accent-amber-600" />
                  <label htmlFor={`lib-${c.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    Library Membership Activated
                  </label>
                </div>
                {libraryDone && (
                  <div>
                    <label className={lbl}>Membership ID / Instructions</label>
                    <input className={inputCls} placeholder="e.g. Membership ID: LIB-2025-042"
                      value={libraryDetails}
                      onChange={e => setLibraryDetails(e.target.value)} />
                  </div>
                )}
              </div>

              <button onClick={saveMisLibrary} disabled={mlSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                {mlSaving ? "Saving…" : "Save MIS & Library"}
              </button>
            </div>
          </div>

          {/* ─ Step 5: RFID Card ─ */}
          <div className={stepCls(step5Done, step3Done)}>
            <div className={numCls(step5Done, step3Done)}>{step5Done ? "✓" : "5"}</div>
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-gray-700">RFID Access Card</p>

              {record.rfidPath ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <a href={`${BASE}/${record.rfidPath}`} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex-1">
                      View uploaded RFID card PDF
                    </a>
                    <input ref={rfidRef} type="file" accept=".pdf" className="hidden"
                      onChange={e => uploadRfid(e.target.files[0])} />
                    <button onClick={() => rfidRef.current.click()} disabled={saving}
                      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-60">
                      Replace PDF
                    </button>
                  </div>
                  {!step5Done ? (
                    <button onClick={sendRfid} disabled={saving}
                      className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                      {saving ? "Sending…" : `Send RFID Card to ${c.fullName}`}
                    </button>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Sent to candidate on {record.rfidSentAt
                        ? new Date(record.rfidSentAt).toLocaleDateString("en-GB")
                        : "—"}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <input ref={rfidRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => uploadRfid(e.target.files[0])} />
                  <button onClick={() => rfidRef.current.click()} disabled={saving}
                    className="border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-white w-full text-center disabled:opacity-60">
                    Upload RFID card PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─ Downstream status (read-only) ─ */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Downstream status (read-only)
            </p>
            {[
              {
                label:  "Room allotment (DOFA Office)",
                done:   !!record.roomNumber,
                detail: record.roomNumber
                  ? `${record.roomBuilding} — Room ${record.roomNumber}`
                  : "Pending",
              },
              {
                label:  "Room handover (Estate)",
                done:   !!record.roomHandedOver,
                detail: record.roomHandedOver
                  ? `Confirmed ${new Date(record.roomHandoverDate).toLocaleDateString("en-GB")}`
                  : "Pending",
              },
              {
                label:  "IT assets & email (LUCS)",
                done:   !!(record.lucsEmailAssigned && record.lucsItAssetsIssued),
                detail: record.lucsEmailAssigned
                  ? `Email: ${record.lucsEmailId || "assigned"}`
                  : "Pending",
              },
            ].map(({ label, done, detail }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{detail}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  done
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
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

  const allRecords = depts.flatMap(d => d.records);
  const total      = allRecords.length;
  const offered    = allRecords.filter(r => r.offerLetterPath).length;
  const rfidSent   = allRecords.filter(r => r.rfidSentToCandidate).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Offer Letters & Joining Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload offer/joining letters, assign MIS login, library details, and RFID cards.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
            {total} selected
          </span>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
            {offered} offered
          </span>
          {rfidSent > 0 && (
            <span className="text-xs bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-full">
              {rfidSent} RFID sent
            </span>
          )}
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
          {records.map(r => (
            <CandidateRecord key={r.id} record={r} onRefresh={load} />
          ))}
        </div>
      ))}
    </div>
  );
}