// pages/dofa-office/SelectedCandidates.jsx
// ✅ Added: Selected / Waitlisted status tags prominently on each candidate row
// ✅ Added: interviewDone lock with clear error message on update attempt
import { useEffect, useState } from "react";
import API from "../../api/api";
import { useActiveCycle } from "../../hooks/useActiveCycle";

function StatusToggle({ status, onChange, disabled }) {
  const states = ["NOT_SELECTED","SELECTED","WAITLISTED"];
  const idx    = Math.max(states.indexOf(status), 0);
  const cfg = {
    NOT_SELECTED: { label:"Not Selected", cls:"bg-gray-100 text-gray-500 border-gray-200" },
    SELECTED:     { label:"Selected",     cls:"bg-green-100 text-green-700 border-green-200" },
    WAITLISTED:   { label:"Waitlisted",   cls:"bg-amber-100 text-amber-700 border-amber-200" },
  };
  const current = status || "NOT_SELECTED";
  return (
    <button
      onClick={() => !disabled && onChange(states[(idx + 1) % 3])}
      disabled={disabled}
      title={disabled ? "Interview complete — selection locked" : "Click to cycle status"}
      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"
      } ${cfg[current].cls}`}
    >
      {cfg[current].label}
    </button>
  );
}

/* ── Large readable status tag shown on the candidate card ── */
function SelectionTag({ status }) {
  if (!status || status === "NOT_SELECTED") return null;
  const cfg = {
    SELECTED:   { label: "✓ Selected",   cls: "bg-green-100 text-green-800 border-green-300" },
    WAITLISTED: { label: "⟳ Waitlisted", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  }[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function SelectCandidates() {
  const [grouped,       setGrouped]       = useState({});
  const [selections,    setSelections]    = useState({});
  const [extraInfo,     setExtraInfo]     = useState({});
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [published,     setPublished]     = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [dofaApproved,  setDofaApproved]  = useState(false);
  const [activeCycle, setActiveCycle] = useState(null);
 
  useEffect(() => {
   //if (cycle === null || cycle === undefined) return;
  Promise.all([
      API.get(`/hod/candidates`),
      API.get("/selected-candidates"),
      API.get("/cycle/dofa-dashboard").catch(() => ({ data: { departments: [] } })),
    ]).then(([candRes, selRes, dashRes]) => {
      const candidates = Array.isArray(candRes.data)
        ? candRes.data
        : Array.isArray(candRes.data?.candidates)
        ? candRes.data.candidates
        : [];
        if (candidates.length > 0 && candidates[0].cycle) {
    setActiveCycle(candidates[0].cycle);
  }
      const selected = Array.isArray(selRes.data) ? selRes.data : [];
      const depts    = dashRes.data?.departments || [];

      setDofaApproved(depts.some(d =>
        ["APPROVED","INTERVIEW_SET","APPEARED_SUBMITTED"].includes(d.status)
      ));

      const isDone = selected.some(s => s.interviewComplete);
      setInterviewDone(isDone);

      const map = {};
      candidates.forEach(c => {
        const dept = c.department || "Unknown";
        if (!map[dept]) map[dept] = { hodId: c.hodId, candidates: [] };
        map[dept].candidates.push(c);
      });
      setGrouped(map);

      const selMap  = {};
      const infoMap = {};
      selected.forEach(s => {
        const cid = s.candidateId || s.candidate?.id;
        if (cid) {
          selMap[cid]  = s.status || "NOT_SELECTED";
          infoMap[cid] = { designation: s.designation || "", employmentType: s.employmentType || "" };
        }
      });
      setSelections(selMap);
      setExtraInfo(infoMap);
      setPublished(selected.length > 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const setStatus = (candId, status) => {
    if (interviewDone) return;
    setSelections(s => ({ ...s, [candId]: status }));
  };

  const setExtra = (candId, key, val) =>
    setExtraInfo(m => ({ ...m, [candId]: { ...m[candId], [key]: val } }));

  const handlePublish = async () => {
    if (interviewDone) {
      alert("❌ Cannot update — interview already marked complete. Selection is locked.");
      return;
    }
    const payload = [];
    Object.entries(grouped).forEach(([dept, { hodId, candidates }]) => {
      candidates.forEach(c => {
        const info   = extraInfo[c.id] || {};
        const status = selections[c.id] || "NOT_SELECTED";
        payload.push({ candidateId: c.id, status, hodId, department: dept,
          designation: info.designation || "", employmentType: info.employmentType || "" ,waitlistPriority: info.waitlistPriority ? parseInt(info.waitlistPriority) : null,});
      });
    });
    try {
      setSaving(true);
      await API.post("/selected-candidates/publish", { selections: payload });
      setPublished(true);
      alert("Selection published successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleInterviewComplete = async () => {
    if (!window.confirm("Mark interview as complete? Selection will be locked after this.")) return;
    try {
      await API.post("/selected-candidates/interview-complete", { cycle:activeCycle });
      setInterviewDone(true);
    } catch { alert("Failed"); }
  };

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading…</p>;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";
  const selectedCount   = Object.values(selections).filter(v => v === "SELECTED").length;
  const waitlistedCount = Object.values(selections).filter(v => v === "WAITLISTED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Candidate Selection</h1>
          <p className="text-sm text-gray-500 mt-1">Toggle: Not Selected → Selected → Waitlisted</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {/* ✅ Summary tags */}
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
            ✓ {selectedCount} selected
          </span>
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-semibold">
            ⟳ {waitlistedCount} waitlisted
          </span>
          {!interviewDone ? (
            <button onClick={handleInterviewComplete} disabled={!activeCycle}
              className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition font-medium">
              Mark Interview Complete
            </button>
          ) : (
            <span className="text-sm bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-medium">
              ✓ Interview Complete
            </span>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {interviewDone && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-xl shrink-0">🔒</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Selection is locked</p>
            <p className="text-xs text-red-600 mt-0.5">
              Interview complete. Selection cannot be changed. Contact DOFA if corrections needed.
            </p>
          </div>
        </div>
      )}

      {/* Instruction */}
      {!interviewDone && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">ℹ</span>
          <p className="text-xs text-blue-700">
            Click status badge to cycle:
            <span className="mx-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Not Selected</span>→
            <span className="mx-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Selected</span>→
            <span className="mx-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Waitlisted</span>
          </p>
        </div>
      )}

      {!dofaApproved && !interviewDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">⚠ Awaiting DOFA approval before selection is allowed</p>
        </div>
      )}

      {/* Department groups */}
      {Object.entries(grouped).map(([dept, { hodId, candidates }]) => (
        <div key={dept} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{dept}</p>
            <div className="flex gap-3 text-xs">
              <span className="text-green-300 font-semibold">
                ✓ {candidates.filter(c => selections[c.id] === "SELECTED").length} selected
              </span>
              <span className="text-amber-300 font-semibold">
                ⟳ {candidates.filter(c => selections[c.id] === "WAITLISTED").length} waitlisted
              </span>
            </div>
          </div>

          {candidates.map(c => {
            const status     = selections[c.id] || "NOT_SELECTED";
            const info       = extraInfo[c.id]  || {};
            const isSelected   = status === "SELECTED";
            const isWaitlisted = status === "WAITLISTED";
            return (
              <div key={c.id} className="border-b last:border-0">
                <div className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
                    {c.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                  {c.appearedInInterview && (
                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium shrink-0">
                      Appeared
                    </span>
                  )}
                  {/* ✅ Prominent selection tag */}
                  <SelectionTag status={status} />
                  {/* Toggle control */}
                  <StatusToggle
                    status={status}
                    onChange={s => dofaApproved && setStatus(c.id, s)}
                    disabled={!dofaApproved || interviewDone}
                  />
                </div>

                {(isSelected || isWaitlisted) && (
                  <div className={`px-14 pb-4 border-t grid grid-cols-2 gap-3 pt-3 ${
                    isSelected ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                  }`}>
                    <div className="col-span-2 mb-1 flex items-center gap-2">
                      <SelectionTag status={status} />
                      {/* ✅ Show waitlist priority badge next to tag */}
                      {isWaitlisted && info.waitlistPriority && (
                        <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
                          Waitlisted #{info.waitlistPriority}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className={lbl}>Designation / Position Offered</label>
                      <input className={`${inputCls} ${interviewDone ? "bg-gray-100" : ""}`}
                        placeholder="e.g. Assistant Professor"
                        readOnly={interviewDone}
                        value={info.designation || ""}
                        onChange={e => setExtra(c.id, "designation", e.target.value)} />
                    </div>

                    <div>
                      <label className={lbl}>Type of Employment</label>
                      <select className={`${inputCls} ${interviewDone ? "bg-gray-100" : ""}`}
                        disabled={interviewDone}
                        value={info.employmentType || ""}
                        onChange={e => setExtra(c.id, "employmentType", e.target.value)}>
                        <option value="">Select type…</option>
                        <option value="Regular">Regular</option>
                        <option value="Contract">Contract</option>
                        <option value="Visiting">Visiting</option>
                        <option value="Adjunct">Adjunct</option>
                      </select>
                    </div>

                    {/* ✅ Waitlist priority — only for waitlisted */}
                    {isWaitlisted && (
                      <div className="col-span-2">
                        <label className={lbl}>
                          Waitlist Priority
                          <span className="text-gray-400 font-normal normal-case ml-1">
                            (1 = highest priority, will be shown as Waitlisted #1)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="1" max="20"
                            className={`${inputCls} w-24 ${interviewDone ? "bg-gray-100" : ""}`}
                            placeholder="1"
                            readOnly={interviewDone}
                            value={info.waitlistPriority || ""}
                            onChange={e => setExtra(c.id, "waitlistPriority", e.target.value)}
                          />
                          {info.waitlistPriority && (
                            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full font-semibold">
                              Will show as: Waitlisted #{info.waitlistPriority}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex justify-end gap-3 pb-6">
        {interviewDone ? (
          <button
            onClick={() => alert("❌ Interview already complete. Selection is locked.")}
            className="bg-gray-400 cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium">
            🔒 Selection Locked
          </button>
        ) : (
          <button onClick={handlePublish} disabled={saving || !dofaApproved}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
            {saving ? "Publishing…" : published ? "Update Selection" : "Publish Selection"}
          </button>
        )}
      </div>
    </div>
  );
}