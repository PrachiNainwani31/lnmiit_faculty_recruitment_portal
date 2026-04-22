import { useEffect, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* KEEP SAME */
function SelectionTag({ status }) {
  if (!status) return null;

  const cfg = {
    SELECTED: "bg-green-100 text-green-700 border-green-200",
    WAITLISTED: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${cfg[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

export default function SelectionStatusPanel({ role,cycle }) {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  Promise.all([
    API.get("/establishment/records").catch(() => ({ data: [] })),
    // API.get(cycle ? `/selected-candidates?cycle=${cycle}` : "/selected-candidates").catch(() => ({ data: [] })),
    API.get("/selected-candidates").catch(() => ({ data: [] })), 
  ]).then(([recRes, selRes]) => {
    const selMap = {};
    selRes.data.forEach(s => {
      const id = s.candidate?.id || s.candidateId;
      if (id) selMap[id] = s;
    });

    const deptMap = {};
    recRes.data.forEach(({ department, records }) => {
      if (!records?.length) return;
      if (role === "HOD" && user.department && department !== user.department) return;
      
      // Filter out closed cycle records
      const activeRecords = records.filter(r => !r.isCycleClosedFlag);
      if (!activeRecords.length) return;  // skip dept if all records are from closed cycles

      deptMap[department] = activeRecords.map(r => ({
        ...r,
        designation:       r.designation      || "",
        employmentType:    r.employmentType    || "",
        selectionStatus:   r.selectionStatus  || null,
        waitlistPriority:  r.waitlistPriority || null,
        interviewComplete: r.interviewComplete || false,
        notJoined:         !!r.notJoined,
        notJoinedReason:   r.notJoinedReason  || "",
      }));
    });

    setDepts(Object.entries(deptMap));
  }).catch(console.error)
    .finally(() => setLoading(false));
}, [cycle]);

  if (loading) return <p className="text-gray-400 text-sm">Loading selection status…</p>;
  if (depts.length === 0) return null;

  return (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Selected Candidates — Onboarding Status
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        Post-interview selection and joining tracker.
      </p>
    </div>

    {depts.map(([dept, records]) => {
  const selectedCount   = records.filter(r => r.selectionStatus === "SELECTED").length;
  const waitlistedCount = records.filter(r => r.selectionStatus === "WAITLISTED").length;
  const firstRecord = records[0]; // ← get cycle info from first record

  return (
    <div key={dept} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-medium text-sm">{dept}</p>
          {/* ✅ Show cycle info */}
          {firstRecord?.cycle && (
            <p className="text-indigo-200 text-xs mt-0.5">
              {firstRecord.cycle}
              {/* parse academicYear and cycleNumber from cycle string e.g. "2026-27-C2" */}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-semibold">
              {selectedCount} selected
            </span>
          )}
          {waitlistedCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
              {waitlistedCount} waitlisted
            </span>
          )}
        </div>
      </div>
      {records.map(r => (
        <CandidateStatusRow key={r.id} record={r} role={role} />
      ))}
    </div>
  );
})}
  </div>
);
} 
/* MOVED OUTSIDE — ONLY CHANGE */
function CandidateStatusRow({ record, role }) {
  const [open, setOpen] = useState(false);
  const c = record.candidate;

  const lucsEmailDone = !!(record.lucsEmailAssigned && record.lucsItAssetsIssued);
  const lucsDetail = lucsEmailDone
    ? [
        record.lucsEmailId ? `Email: ${record.lucsEmailId}` : null,
        record.lucsItAssetsNote ? record.lucsItAssetsNote : null,
        record.lucsWebsiteLogin ? "Website login provided" : null,
        record.lucsWebsiteLoginNote ? record.lucsWebsiteLoginNote : null,
        record.lucsOtherNote ? `Other: ${record.lucsOtherNote}` : null,
      ].filter(Boolean).join(" · ")
    : null;

  const steps = [
    {
      label: "Offer letter",
      done: !!record.offerLetterPath,
      link: record.offerLetterPath ? `${BASE}/${record.offerLetterPath}` : null,
    },
    {
      label:  "Joining date",
      done:   !!record.joiningDate || !!record.notJoined,
      detail: record.notJoined
        ? `✗ Did Not Join${record.notJoinedReason ? ` — ${record.notJoinedReason}` : ""}`
        : record.joiningDate
          ? new Date(record.joiningDate).toLocaleDateString("en-GB")
          : null,
      notJoined: !!record.notJoined,   // ← flag for styling
    },
    {
      label: "MIS login",
      done: !!record.misProvidedAt,
      detail: record.misProvidedAt ? "Credentials provided" : null,
    },
    {
      label: "Library card",
      done: !!record.libraryDoneAt,
      detail: record.libraryDoneAt
        ? `ID: ${record.libraryMemberId || "assigned"}`
        : null,
    },
    {
      label: "RFID card",
      done: !!record.rfidSentToCandidate,
      detail: record.rfidSentToCandidate ? "Sent to candidate" : null,
    },
    {
      label: "Office allotted",
      done: !!record.roomNumber,
      detail: record.roomNumber ? `Room ${record.roomNumber}` : null,
    },
    {
      label: "Office handover",
      done: !!record.roomHandedOver,
      detail: record.roomHandedOver
        ? new Date(record.roomHandoverDate).toLocaleDateString("en-GB")
        : null,
    },
    {
      label: "IT assets (LUCS)",
      done: !!record.lucsConfirmedById,
      detail: record.lucsConfirmedById ? "Confirmed" : null,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <div className="border-b last:border-0">
      <div
        className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
          {c?.fullName?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          <p className="text-xs text-gray-400">
            {record.designation
              ? <span className="text-indigo-600 font-medium">{record.designation}</span>
              : <span>{c?.email}</span>}
            {record.employmentType &&
              <span className="text-gray-400"> · {record.employmentType}</span>}
          </p>
        </div>

        <SelectionTag status={record.selectionStatus} />
        {record.selectionStatus === "WAITLISTED" && record.waitlistPriority && (
          <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            Waitlist #{record.waitlistPriority}
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{doneCount}/{steps.length}</span>
          {allDone && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
        </div>

        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3 mt-3">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border ${
                s.notJoined ? "bg-red-50 border-red-200"
                : s.done    ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  s.notJoined ? "bg-red-100 text-red-700"
                  : s.done    ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                }`}>
                  {s.notJoined ? "✗" : s.done ? "✓" : i + 1}
                </span>
                <div>
                  <p className={`text-xs font-medium ${s.notJoined ? "text-red-700" : ""}`}>{s.label}</p>
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600">View document</a>
                  ) : s.detail ? (
                    <p className={`text-xs ${s.notJoined ? "text-red-500" : "text-gray-500"}`}>{s.detail}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Pending</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}