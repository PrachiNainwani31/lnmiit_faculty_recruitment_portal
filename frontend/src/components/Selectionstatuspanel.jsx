// components/Selectionstatuspanel.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SelectionStatusPanel({ role }) {
  const [depts,   setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/establishment/records").catch(() => ({ data: [] })),
      API.get("/selected-candidates").catch(()   => ({ data: [] })),
    ]).then(([recRes, selRes]) => {
      // Build selection map: candidateId → selected record (with designation/employmentType)
      const selMap = {};
      selRes.data.forEach(s => {
        const id = s.candidate?.id || s.candidateId;
        selMap[id] = s;
      });

      const deptMap = {};
      recRes.data.forEach(({ department, records }) => {
        if (!records?.length) return;
        deptMap[department] = records.map(r => ({
          ...r,
          // ✅ Merge designation + employmentType from selection record
          designation:       selMap[r.candidate?.id]?.designation     || "",
          employmentType:    selMap[r.candidate?.id]?.employmentType  || "",
          selectionStatus:   selMap[r.candidate?.id]?.status          || "SELECTED",
          interviewComplete: selMap[r.candidate?.id]?.interviewComplete || false,
        }));
      });

      setDepts(Object.entries(deptMap));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading selection status…</p>;
  if (depts.length === 0) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Selected Candidates — Onboarding Status</h2>
        <p className="text-sm text-gray-500 mt-1">Post-interview selection and joining tracker.</p>
      </div>
      {depts.map(([dept, records]) => (
        <div key={dept} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
            <p className="text-white font-medium text-sm">{dept}</p>
            <span className="text-indigo-200 text-xs">{records.length} selected</span>
          </div>
          {records.map(r => <CandidateStatusRow key={r.id} record={r} role={role} />)}
        </div>
      ))}
    </div>
  );
}

function CandidateStatusRow({ record, role }) {
  const [open, setOpen] = useState(false);
  const c = record.candidate;

  const lucsEmailDone = !!(record.lucsEmailAssigned && record.lucsItAssetsIssued);
  const lucsDetail = lucsEmailDone
    ? [
        record.lucsEmailId          ? `Email: ${record.lucsEmailId}`        : null,
        record.lucsItAssetsNote     ? record.lucsItAssetsNote               : null,
        record.lucsWebsiteLogin     ? "Website login provided"              : null,
        record.lucsWebsiteLoginNote ? record.lucsWebsiteLoginNote           : null,
        record.lucsOtherNote        ? `Other: ${record.lucsOtherNote}`      : null,
      ].filter(Boolean).join(" · ")
    : null;

  const steps = [
    {
      label:  "Offer letter",
      done:   !!record.offerLetterPath,
      link:   record.offerLetterPath ? `${BASE}/${record.offerLetterPath}` : null,
    },
    {
      label:  "Joining date",
      done:   !!record.joiningDate,
      detail: record.joiningDate ? new Date(record.joiningDate).toLocaleDateString("en-GB") : null,
    },
    {
      // Joining letter — visible to all internal roles
      label:  "Joining letter",
      done:   !!record.joiningLetterPath,
      link:   record.joiningLetterPath ? `${BASE}/${record.joiningLetterPath}` : null,
    },
    {
      // ✅ MIS login — status only for internal roles (details visible to candidate only)
      label:  "MIS login",
      done:   !!record.misLoginDone,
      detail: record.misLoginDone ? "Sent to candidate" : null,
    },
    {
      // ✅ Library — status only for internal roles
      label:  "Library card",
      done:   !!record.libraryDone,
      detail: record.libraryDone ? "Sent to candidate" : null,
    },
    {
      // ✅ RFID — status only for internal roles
      label:  "RFID card",
      done:   !!record.rfidSentToCandidate,
      detail: record.rfidSentToCandidate ? "Sent to candidate" : null,
    },
    {
      label:  "Room allotted",
      done:   !!record.roomNumber,
      detail: record.roomNumber ? `${record.roomBuilding} — ${record.roomNumber}` : null,
    },
    {
      label:  "Room handover",
      done:   !!record.roomHandedOver,
      detail: record.roomHandedOver ? new Date(record.roomHandoverDate).toLocaleDateString("en-GB") : null,
    },
    {
      // ✅ LUCS: show all textbox answers for internal roles
      label:  "IT assets / email",
      done:   lucsEmailDone,
      detail: lucsDetail,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === steps.length;

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
          {c?.fullName?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{c?.fullName}</p>
          {/* ✅ Show designation + employmentType */}
          <p className="text-xs text-gray-400">
            {record.designation
              ? <span className="text-indigo-600 font-medium">{record.designation}</span>
              : <span>{c?.email}</span>
            }
            {record.employmentType &&
              <span className="text-gray-400"> · {record.employmentType}</span>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500">{doneCount}/{steps.length}</span>
          {allDone && (
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
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
                s.done ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${
                  s.done ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  {s.done ? "✓" : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">{s.label}</p>
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline">View document</a>
                  ) : s.detail ? (
                    <p className="text-xs text-gray-500 truncate" title={s.detail}>{s.detail}</p>
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