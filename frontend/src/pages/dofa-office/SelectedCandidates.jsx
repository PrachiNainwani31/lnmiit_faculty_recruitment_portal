import { useEffect, useState } from "react";
import API from "../../api/api";
import CYCLE from "../../config/activeCycle";

export default function SelectCandidates() {
  const [grouped,    setGrouped]    = useState({});
  const [selections, setSelections] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [published,  setPublished]  = useState(false);
  const [interviewDone,  setInterviewDone]  = useState(false);
  const [dofaApproved,   setDofaApproved]   = useState(false);
  const [cycleStatus,    setCycleStatus]    = useState("DRAFT");

  /* Manual expert form */
  const [showExpertForm, setShowExpertForm] = useState(false);
  const [expertForm, setExpertForm] = useState({
    fullName:"", designation:"", department:"", institute:"", email:"", phone:""
  });
  const [addingExpert, setAddingExpert] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get(`/hod/candidates/${CYCLE}`),
      API.get("/selected-candidates"),
      API.get("/cycle/dofa-dashboard").catch(() => ({ data: { departments: [] } })),
    ]).then(([candRes, selRes, dashRes]) => {
      // Check if at least one department is APPROVED by DOFA
      const depts = dashRes.data?.departments || [];
      const anyApproved = depts.some(d => d.status === "APPROVED");
      setDofaApproved(anyApproved);
      setCycleStatus(anyApproved ? "APPROVED" : depts.some(d => d.status === "SUBMITTED") ? "SUBMITTED" : "DRAFT");
      // Group candidates by department
      const map = {};
      candRes.data.forEach(c => {
        const dept = c.department || "Unknown";
        if (!map[dept]) map[dept] = { hodId: c.hod, candidates: [] };
        map[dept].candidates.push(c);
      });
      setGrouped(map);

      // Pre-fill existing selections
      const selMap = {};
      selRes.data.forEach(s => {
        selMap[s.candidate.id || s.candidate] = s.status;
      });
      setSelections(selMap);
      setPublished(selRes.data.length > 0);
      setInterviewDone(selRes.data.some(s => s.interviewComplete));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (candId, hodId, dept) => {
    setSelections(s => ({
      ...s,
      [candId]: s[candId] === "SELECTED" ? "NOT_SELECTED" : "SELECTED",
    }));
  };

  const handlePublish = async () => {
    const payload = [];
    Object.entries(grouped).forEach(([dept, { hodId, candidates }]) => {
      candidates.forEach(c => {
        payload.push({
          candidateId: c.id,
          status:      selections[c.id] === "SELECTED" ? "SELECTED" : "NOT_SELECTED",
          hodId,
          department:  dept,
        });
      });
    });

    try {
      setSaving(true);
      await API.post("/selected-candidates/publish", { selections: payload });
      setPublished(true);
      alert("Selection published. Visible to DOFA, HOD, and Establishment.");
    } catch {
      alert("Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const handleInterviewComplete = async () => {
    if (!window.confirm("Mark interview as complete? This will notify DOFA and HODs.")) return;
    try {
      await API.post("/selected-candidates/interview-complete", { cycle: CYCLE });
      setInterviewDone(true);
      alert("Interview marked complete. Notifications sent.");
    } catch {
      alert("Failed");
    }
  };

  const handleAddExpert = async () => {
    const { fullName, email } = expertForm;
    if (!fullName || !email) return alert("Full name and email are required");
    try {
      setAddingExpert(true);
      await API.post("/selected-candidates/manual-expert", expertForm);
      alert(`Expert ${fullName} added successfully.`);
      setExpertForm({ fullName:"", designation:"", department:"", institute:"", email:"", phone:"" });
      setShowExpertForm(false);
    } catch {
      alert("Failed to add expert");
    } finally {
      setAddingExpert(false);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";
  const lbl      = "text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Candidate Selection</h1>
          <p className="text-sm text-gray-500 mt-1">Select candidates. Published selection visible to DOFA, HOD, and Establishment.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExpertForm(v => !v)}
            className="text-sm border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition">
            + Add Expert Manually
          </button>
          {!interviewDone && (
            <button
              onClick={handleInterviewComplete}
              className="text-sm bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition">
              Mark Interview Complete
            </button>
          )}
          {interviewDone && (
            <span className="text-sm bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg font-medium">
              Interview Complete
            </span>
          )}
        </div>
      </div>

      {/* Manual expert form */}
      {showExpertForm && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5 space-y-4">
          <p className="text-sm font-medium text-gray-700">Add Expert Manually</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key:"fullName",    label:"Full Name"    },
              { key:"designation", label:"Designation"  },
              { key:"department",  label:"Department"   },
              { key:"institute",   label:"Institute"    },
              { key:"email",       label:"Email"        },
              { key:"phone",       label:"Phone Number" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={lbl}>{label}</label>
                <input className={inputCls} placeholder={label}
                  value={expertForm[key]}
                  onChange={e => setExpertForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowExpertForm(false)}
              className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAddExpert} disabled={addingExpert}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg disabled:opacity-60">
              {addingExpert ? "Adding..." : "Add Expert"}
            </button>
          </div>
        </div>
      )}

      {/* Lock banner if DOFA hasn't approved yet */}
      {!dofaApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-600 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Awaiting DOFA approval</p>
            <p className="text-xs text-amber-600 mt-1">
              Candidate selection is locked until DOFA approves at least one department submission.
              Current cycle status: <strong>{cycleStatus}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Department-wise candidate selection */}
      {Object.entries(grouped).map(([dept, { hodId, candidates }]) => (
        <div key={dept} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{dept}</p>
            <span className="text-indigo-200 text-xs">
              {candidates.filter(c => selections[c.id] === "SELECTED").length} selected
            </span>
          </div>

          {candidates.map(c => {
            const isSelected = selections[c.id] === "SELECTED";
            return (
              <div key={c.id}
                className="flex items-center gap-4 px-5 py-3 border-b last:border-0 hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => dofaApproved && toggle(c.id, hodId, dept)}
                  disabled={!dofaApproved}
                  className="w-4 h-4 accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                  {c.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  isSelected
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {isSelected ? "Selected" : "Not selected"}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex justify-end gap-3 pb-6">
        <button
          onClick={handlePublish}
          disabled={saving || !dofaApproved}
          title={!dofaApproved ? "Awaiting DOFA approval" : ""}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition">
          {saving ? "Publishing..." : published ? "Update Selection" : "Publish Selection"}
        </button>
      </div>
    </div>
  );
}