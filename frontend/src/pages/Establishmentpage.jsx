import { useEffect, useRef, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── SELECTED / WAITLISTED tag ── */
function SelectionTag({ status }) {
  if (!status || status === "NOT_SELECTED") return null;
  const cfg = {
    SELECTED:   { label: "✓ Selected",   cls: "bg-green-100 text-green-800 border-green-300" },
    WAITLISTED: { label: "⟳ Waitlisted", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  }[status];
  if (!cfg) return null;
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

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
  const [misLoginDone,   setMisLoginDone]   = useState(!!record.misUsername);
  const [misLoginNote,   setMisLoginNote]   = useState(record.misUsername   || "");
  const [libraryDone,    setLibraryDone]    = useState(!!record.libraryMemberId);
  const [libraryDetails, setLibraryDetails] = useState(record.libraryMemberId || "");
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
        candidateId: c.id, misLoginDone, misLoginNote, libraryDone, libraryDetails,
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
    fd.append("pdf", file); fd.append("candidateId", c.id);
    try {
      setSaving(true);
      await API.post("/establishment/rfid-card", fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("RFID card uploaded.");
      onRefresh();
    } catch (err) { alert(err.response?.data?.message || "Upload failed"); }
    finally { setSaving(false); }
  };

  const sendRfid = async () => {
    if (!window.confirm(`Send RFID card to ${c.fullName} (${c.email})?`)) return;
    try {
      setSaving(true);
      await API.post("/establishment/rfid-send", { candidateId: c.id });
      alert("RFID card sent to candidate."); onRefresh();
    } catch { alert("Failed to send"); }
    finally { setSaving(false); }
  };

  const step1Done = !!record.offerLetterPath;
  const step2Done = !!record.joiningDate;
  const step3Done = !!record.joiningLetterPath;
  const step4Done = !!(record.misUsername && record.libraryMemberId);
  const step5Done = !!record.rfidSentToCandidate;
  const interviewComplete = !!record.interviewComplete;

  const stepCls = (done, prev) => `flex gap-3 ${!prev ? "opacity-40 pointer-events-none" : ""}`;
  const numCls  = (done, prev) =>
    `w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${
      done   ? "bg-green-100 text-green-700 border-green-300"
      : prev ? "bg-blue-100  text-blue-700  border-blue-300"
             : "bg-gray-100  text-gray-400  border-gray-200"
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">{c?.email}</p>
        </div>

        {/*SELECTED / WAITLISTED tag */}
        <SelectionTag status={record.selectionStatus} />
          {record.selectionStatus === "WAITLISTED" && record.waitlistPriority && (
            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
              Waitlist #{record.waitlistPriority}
            </span>
          )}

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

          {/* Step 1: Offer letter */}
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

          {/* Step 2: Joining date — editable, shows candidate's preference */}
          <div className={stepCls(step2Done, step1Done)}>
            <div className={numCls(step2Done, step1Done)}>{step2Done ? "✓" : "2"}</div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Joining date
                {step2Done && (
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    {new Date(record.joiningDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </p>

              {/* ✅ Show candidate's preferred joining date if set */}
              {record.candidatePreferredJoiningDate && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-blue-500 text-xs">📅</span>
                  <p className="text-xs text-blue-700">
                    Candidate's preference:{" "}
                    <strong>
                      {new Date(record.candidatePreferredJoiningDate).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </strong>
                    {!joiningDate && (
                      <button
                        onClick={() =>
                          setJoiningDate(record.candidatePreferredJoiningDate.split("T")[0])
                        }
                        className="ml-2 underline text-blue-600 hover:text-blue-800"
                      >
                        Use this date
                      </button>
                    )}
                  </p>
                </div>
              )}

              {/* ✅ Always editable by Establishment */}
              <div className="flex gap-2">
                <input type="date" value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  className={`${inputCls} flex-1`} />
                <button onClick={saveJoiningDate} disabled={saving || !step1Done}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                  {step2Done ? "Update" : "Save"}
                </button>
                <button
                  onClick={async () => {
                    const reason = window.prompt("Reason candidate did not join (optional):");
                    if (reason === null) return; // cancelled
                    try {
                      setSaving(true);
                      await API.post("/establishment/not-joined", { candidateId: c.id, reason });
                      alert("Marked as not joined. All parties notified.");
                      onRefresh();
                    } catch (err) {
                      alert(err.response?.data?.message || "Failed");
                    } finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-4 py-1.5 rounded-lg text-sm disabled:opacity-60"
                >
                  ✗ Did Not Join
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Joining letter */}
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

          {/* Step 4: MIS + Library */}
          <div className={stepCls(step4Done, step3Done)}>
            <div className={numCls(step4Done, step3Done)}>{step4Done ? "✓" : "4"}</div>
            <div className="flex-1 space-y-4">
              <p className="text-sm font-medium text-gray-700">MIS Login & Library Details</p>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`mis-${c.id}`} checked={misLoginDone}
                    onChange={e => setMisLoginDone(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                  <label htmlFor={`mis-${c.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    MIS Portal Login Assigned
                  </label>
                </div>
                {misLoginDone && (
                  <div>
                    <label className={lbl}>Login URL / Username / Note</label>
                    <input className={inputCls} placeholder="e.g. https://mis.lnmiit.ac.in · username: firstname.dept"
                      value={misLoginNote} onChange={e => setMisLoginNote(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`lib-${c.id}`} checked={libraryDone}
                    onChange={e => setLibraryDone(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                  <label htmlFor={`lib-${c.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                    Library Membership Activated
                  </label>
                </div>
                {libraryDone && (
                  <div>
                    <label className={lbl}>Membership ID / Instructions</label>
                    <input className={inputCls} placeholder="e.g. Membership ID: LIB-2025-042"
                      value={libraryDetails} onChange={e => setLibraryDetails(e.target.value)} />
                  </div>
                )}
              </div>
              <button onClick={saveMisLibrary} disabled={mlSaving}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
                {mlSaving ? "Saving…" : "Save MIS & Library"}
              </button>
            </div>
          </div>

          {/* Step 5: RFID */}
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

          {/* Downstream read-only */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Downstream status (read-only)</p>
            {[
              { label: "Room allotment (DOFA Office)", done: !!record.roomNumber,
                detail: record.roomNumber ? `${record.roomBuilding} — Room ${record.roomNumber}` : "Pending" },
              { label: "Room handover (Estate)",        done: !!record.roomHandedOver,
                detail: record.roomHandedOver ? `Confirmed ${new Date(record.roomHandoverDate).toLocaleDateString("en-GB")}` : "Pending" },
              { label: "IT assets & email (LUCS)",      done: !!record.lucsConfirmedById, detail:record.lucsItAssetsIssued?
                "Confirmed by LUCS" :"Pending" },
            ].map(({ label, done, detail }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{detail}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  done ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>{done ? "Done" : "Pending"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {step5Done && !record.joiningComplete && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-800">All steps completed</p>
              <p className="text-xs text-green-600 mt-0.5">
                Mark joining as complete to freeze this record and notify HOD, DOFA, and DOFA Office.
              </p>
            </div>
            <button
              onClick={async () => {
                if (!window.confirm(`Mark joining complete for ${c.fullName}? This will freeze the record.`)) return;
                try {
                  setSaving(true);
                  await API.post("/establishment/joining-complete", { candidateId: c.id });
                  alert("Joining marked complete. All parties notified.");
                  onRefresh();
                } catch (err) {
                  alert(err.response?.data?.message || "Failed");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="shrink-0 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition"
            >
              ✓ Mark Joining Complete
            </button>
          </div>
        </div>
      )}

      {/* ✅ Already complete — frozen banner */}
      {record.joiningComplete && (
        <div className="border-t border-gray-100 pt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-green-600 text-lg">🔒</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Joining Complete — Record Frozen</p>
              {record.joiningCompletedAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Completed on {new Date(record.joiningCompletedAt).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EstablishmentPage() {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [interviewDone, setInterviewDone] = useState(false);

  const load = () => {
    // Fetch both records and selection status together
    Promise.all([
      API.get("/establishment/records"),
      API.get("/selected-candidates"),
    ])
      .then(([recRes, selRes]) => {
        const selData = Array.isArray(selRes.data) ? selRes.data : [];
        setInterviewDone(selData.some(s => s.interviewComplete));
        // Build a map: candidateId → selectionStatus
        const selMap = {};
        (Array.isArray(selRes.data) ? selRes.data : []).forEach(s => {
          const id = s.candidateId || s.candidate?.id;
          if (id) selMap[id] = {
            status:          s.status,
            waitlistPriority: s.waitlistPriority || null,  // ← add
          };
        });

        // Merge selectionStatus into each record
        const merged = (recRes.data || []).map(dept => ({
          ...dept,
          records: (dept.records || []).map(r => ({
            ...r,
            selectionStatus: selMap[r.candidate?.id]?.status || "NOT_SELECTED",
            waitlistPriority: selMap[r.candidate?.id]?.waitlistPriority || null,
          })),
        }));

        setDepts(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading...</p>;

  const allRecords  = depts.flatMap(d => d.records);
  const total       = allRecords.length;
  const waitlisted  = allRecords.filter(r => r.selectionStatus === "WAITLISTED").length;
  const offered     = allRecords.filter(r => r.offerLetterPath).length;
  const rfidSent    = allRecords.filter(r => r.rfidSentToCandidate).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Offer Letters & Joining Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload offer/joining letters, assign MIS login, library details, and RFID cards.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
            {total - waitlisted} selected
          </span>
          {waitlisted > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
              {waitlisted} waitlisted
            </span>
          )}
          <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full">
            {offered} offers sent
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
          {interviewDone ? (
            <>
              <p className="text-gray-600 font-medium">Interview process is complete</p>
              <p className="text-sm text-gray-400 mt-2">
                No candidates were selected in this cycle. The recruitment cycle has concluded.
              </p>
            </>
          ) : (
            <p>No selected candidates yet. DOFA Office needs to publish the selection first.</p>
          )}
        </div>
      )}

      {depts.map(({ department, records }) => (
        <div key={department} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-amber-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{department}</p>
            <div className="flex gap-3 text-xs">
              <span className="text-green-200 font-semibold">
                ✓ {records.filter(r => r.selectionStatus === "SELECTED").length} selected
              </span>
              {records.some(r => r.selectionStatus === "WAITLISTED") && (
                <span className="text-amber-200 font-semibold">
                  ⟳ {records.filter(r => r.selectionStatus === "WAITLISTED").length} waitlisted
                </span>
              )}        
              <button
                onClick={async () => {
                  if (!window.confirm("Close this cycle permanently? No further edits will be allowed by anyone.")) return;
                  // Get hodId from first record
                  const hodId = depts[0]?.records[0]?.hodId;
                  if (!hodId) return alert("No active cycle found");
                  await API.post("/establishment/close-cycle", { hodId });
                  alert("Cycle closed.");
                  load();
                }}
                className="text-xs bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium"
              >
                🔒 Close Cycle
              </button>
            </div>
          </div>
          {records.map(r => (
            <CandidateRecord key={r.id} record={r} onRefresh={load} />
          ))}
        </div>
      ))}
    </div>
  );
}
