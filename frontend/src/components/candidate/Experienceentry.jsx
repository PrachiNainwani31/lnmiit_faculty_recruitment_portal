// components/candidate/ExperienceEntry.jsx
import { useRef } from "react";
import API from "../../api/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Experienceentry({ exp, index,displayNumber, onChange, onRemove, isReadOnly, total, onCertUpload,hideNatureOfWork=false }) {
  const certRef = useRef();

  const uploadCert = (file)=>onCertUpload?.(file);

  const inputCls = `border p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-red-300 ${isReadOnly ? "bg-gray-50 text-gray-500" : ""}`;
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-600">Experience {displayNumber ?? index + 1}</p>
        <div className="flex items-center gap-3">
          {/* Ongoing / Past toggle */}
          {!isReadOnly && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 text-xs">
              <button type="button"
                onClick={() => onChange(index, "ongoing", false)}
                className={`px-3 py-1 rounded-md transition font-medium ${!exp.ongoing ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                Past
              </button>
              <button type="button"
                onClick={() => onChange(index, "ongoing", true)}
                className={`px-3 py-1 rounded-md transition font-medium ${exp.ongoing ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                Ongoing
              </button>
            </div>
          )}
          {isReadOnly && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exp.ongoing ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {exp.ongoing ? "Ongoing" : "Past"}
            </span>
          )}
          {!isReadOnly && total > 1 && (
            <button onClick={() => onRemove(index)} className="text-red-500 text-xs hover:underline">
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Organization/Institute</label>
          <input value={exp.organization || ""} placeholder="Organization/Institute" className={inputCls}
            disabled={isReadOnly} onChange={e => onChange(index, "organization", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Designation</label>
          <input value={exp.designation || ""} placeholder="Designation" className={inputCls}
            disabled={isReadOnly} onChange={e => onChange(index, "designation", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Department</label>
          <input value={exp.department || ""} placeholder="Department" className={inputCls}
            disabled={isReadOnly} onChange={e => onChange(index, "department", e.target.value)} />
        </div>
        {!hideNatureOfWork && (
          <div className="col-span-2">
            <label className={labelCls}>Nature of Work</label>
            <input value={exp.natureOfWork || ""} placeholder="Describe nature of work"
              className={inputCls} disabled={isReadOnly}
              onChange={e => onChange(index, "natureOfWork", e.target.value)} />
          </div>
        )}
        <div>
          <label className={labelCls}>{exp.ongoing ? "Start Date" : "From Date"}</label>
          <input type="date" value={exp.fromDate?.split("T")[0] || ""} className={inputCls}
            disabled={isReadOnly} onChange={e => onChange(index, "fromDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>To Date</label>
          {exp.ongoing ? (
            <div className="border p-2 rounded text-sm bg-green-50 text-green-700 font-medium">
              Till Date (Ongoing)
            </div>
          ) : (
            <input type="date" value={exp.toDate?.split("T")[0] || ""} className={inputCls}
              disabled={isReadOnly} onChange={e => onChange(index, "toDate", e.target.value)} />
          )}
        </div>
      </div>

      {/* Certificate — always at bottom */}
      <div className="pt-2 border-t border-gray-200">
        <label className={labelCls}>Experience Certificate</label>
        {exp.certificate ? (
          <div className="flex items-center gap-2">
            <a href={`${BASE_URL}/${exp.certificate}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline">View uploaded certificate</a>
            {!isReadOnly && (
              <>
                <input ref={certRef} type="file" accept=".pdf,.jpg,.png" className="hidden"
                  onChange={e => uploadCert(e.target.files[0])} />
                <button onClick={() => certRef.current.click()}
                  className="text-xs text-gray-500 border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-100">
                  Replace
                </button>
              </>
            )}
          </div>
        ) : isReadOnly ? (
          <p className="text-xs text-gray-400">No certificate uploaded</p>
        ) : (
          <>
            <input ref={certRef} type="file" accept=".pdf,.jpg,.png" className="hidden"
              onChange={e => uploadCert(e.target.files[0])} />
            <button onClick={() => certRef.current.click()}
              className="border border-dashed border-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-white w-full text-center">
              Upload certificate (PDF / image)
            </button>
          </>
        )}
      </div>
    </div>
  );
}