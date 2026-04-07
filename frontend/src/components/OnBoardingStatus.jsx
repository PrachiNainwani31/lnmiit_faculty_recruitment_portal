// components/OnBoardingStatus.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function OnboardingStatus() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/candidate/onboarding")
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data?.selected) return null;

  const r = data.record;

  // LUCS detail string
  const lucsEmailDone = r?.lucsEmailAssigned && r?.lucsItAssetsIssued;
  const lucsDetail = lucsEmailDone
    ? [
        r.lucsEmailId          ? `Email: ${r.lucsEmailId}`           : null,
        r.lucsItAssetsNote     ? `Assets: ${r.lucsItAssetsNote}`     : null,
        r.lucsWebsiteLogin     ? "Website login provided"            : null,
        r.lucsWebsiteLoginNote ? r.lucsWebsiteLoginNote              : null,
        r.lucsOtherNote        ? `Other: ${r.lucsOtherNote}`         : null,
      ].filter(Boolean).join(" · ")
    : "LUCS team will assign institute email, IT assets, WiFi and portal login";

  const steps = [
    {
      label:  "Selected for position",
      done:   true,
      // ✅ Show designation + employmentType from selection record
      detail: [
        data.designation     || "Faculty Position",
        data.employmentType  ? `(${data.employmentType})` : null,
        data.department      ? `· ${data.department}`     : null,
      ].filter(Boolean).join(" "),
      color: "green",
    },
    {
      label:     "Offer letter",
      done:      !!r?.offerLetterPath,
      detail:    r?.offerLetterPath ? null : "Establishment will upload your offer letter shortly",
      link:      r?.offerLetterPath ? `${BASE}/${r.offerLetterPath}` : null,
      linkLabel: "Download offer letter",
      color:     "blue",
    },
    {
      label:  "Joining date",
      done:   !!r?.joiningDate,
      detail: r?.joiningDate
        ? `Report on ${new Date(r.joiningDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}`
        : "Establishment will confirm your joining date",
      color:  "blue",
    },
    // ✅ Joining letter intentionally excluded — internal document only
    {
      label:  "Room allotment",
      done:   !!r?.roomNumber,
      detail: r?.roomNumber
        ? `${r.roomBuilding} — Room ${r.roomNumber}${r.roomNotes ? ` · ${r.roomNotes}` : ""}`
        : "DOFA Office will allot your accommodation",
      color:  "indigo",
    },
    {
      label:  "Room handover",
      done:   !!r?.roomHandedOver,
      detail: r?.roomHandedOver
        ? `Handed over on ${new Date(r.roomHandoverDate).toLocaleDateString("en-GB")}`
        : "Estate section will hand over room keys",
      color:  "pink",
    },
    {
      label:  "IT assets & institute email",
      done:   lucsEmailDone,
      // ✅ Show all LUCS textbox answers to candidate
      detail: lucsEmailDone
        ? [
            r?.lucsEmailId          ? `Email: ${r.lucsEmailId}`                   : null,
            r?.lucsItAssetsNote     ? `Assets issued: ${r.lucsItAssetsNote}`      : null,
            r?.lucsWifiProvided     ? "WiFi access provided"                       : null,
            r?.lucsWebsiteLogin     ? "Website login credentials provided"         : null,
            r?.lucsWebsiteLoginNote ? r.lucsWebsiteLoginNote                       : null,
            r?.lucsOtherNote        ? `Other: ${r.lucsOtherNote}`                 : null,
          ].filter(Boolean).join(" · ")
        : "LUCS team will assign institute email, IT assets, WiFi and portal login",
      color:  "teal",
    },
    {
      label:  "MIS portal login",
      done:   !!r?.misUsername,
      // ✅ Candidate sees full details including note
      detail: r?.misUsername
        ? (r.misUsername || "MIS login assigned — check your email for credentials")
        : "Establishment will provide your MIS login credentials",
      color:  "teal",
    },
    {
      label:  "Library membership",
      done:   !!r?.libraryMemberId,
      // ✅ Candidate sees full library details
      detail: r?.libraryMemberId
        ? (r.libraryMemberId || "Library access activated")
        : "Establishment will provide library membership details",
      color:  "teal",
    },
    {
      // ✅ RFID: candidate can download once sent
      label:     "RFID access card",
      done:      !!r?.rfidSentToCandidate,
      detail:    r?.rfidSentToCandidate ? null : "Establishment will send your RFID access card",
      link:      r?.rfidSentToCandidate && r?.rfidPath ? `${BASE}/${r.rfidPath}` : null,
      linkLabel: "Download RFID card",
      color:     "teal",
    },
  ];

  const colorCls = {
    green:  "bg-green-100 text-green-700 border-green-300",
    blue:   "bg-blue-100 text-blue-700 border-blue-300",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300",
    pink:   "bg-pink-100 text-pink-700 border-pink-300",
    teal:   "bg-teal-100 text-teal-700 border-teal-300",
  };

  const firstPending = steps.findIndex(s => !s.done);
  const doneCount    = steps.filter(s => s.done).length;

  return (
    <div className="bg-white p-6 rounded-xl shadow border-2 border-green-200 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">🎉</div>
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-green-800">You have been selected!</h2>
          <p className="text-xs text-green-600 mt-0.5">
            {data.designation && <span className="font-medium">{data.designation}</span>}
            {data.employmentType && <span className="text-green-500"> · {data.employmentType}</span>}
            {data.department && <span> · {data.department}</span>}
          </p>
        </div>
        {/* Progress bar */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 mb-1">{doneCount}/{steps.length} steps done</p>
          <div className="w-32 bg-gray-200 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isActive = !step.done && i === firstPending;
          const cls      = colorCls[step.color];
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border mt-0.5 ${
                step.done  ? cls
                : isActive ? "bg-blue-100 text-blue-700 border-blue-300"
                           : "bg-gray-100 text-gray-400 border-gray-200"
              }`}>
                {step.done ? "✓" : i + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.done || isActive ? "text-gray-800" : "text-gray-400"}`}>
                  {step.label}
                </p>
                {step.link ? (
                  <a href={step.link} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-0.5 block">
                    {step.linkLabel}
                  </a>
                ) : step.detail ? (
                  <p className={`text-xs mt-0.5 ${step.done ? "text-gray-500" : isActive ? "text-blue-500" : "text-gray-400"}`}>
                    {step.detail}
                  </p>
                ) : null}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${
                step.done  ? cls
                : isActive ? "bg-blue-50 text-blue-600 border-blue-200"
                           : "bg-gray-100 text-gray-400 border-gray-200"
              }`}>
                {step.done ? "Done" : isActive ? "In progress" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}