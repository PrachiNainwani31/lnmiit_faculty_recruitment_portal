import { useState } from "react";

export default function MultiFileUpload({ label, maxFiles = 5, maxMB = 10, onUpload, existingFiles = [] }) {
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, maxFiles);
    setFiles(selected);
    if (onUpload) onUpload(selected);
  };

  const removeFile = (i) => {
    const updated = files.filter((_, idx) => idx !== i);
    setFiles(updated);
    if (onUpload) onUpload(updated);
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <span className="text-xs text-gray-400">PDF · Up to {maxFiles} files</span>
      </div>

      {/* Existing server files */}
      {existingFiles.filter(Boolean).map((f, i) => (
        <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2">
          <span className="text-xs text-green-700 truncate flex-1">{typeof f === "string" ? f.split(/[/\\]/).pop() : f.name}</span>
          <span className="text-xs text-green-500">Saved</span>
        </div>
      ))}

      {/* Newly selected files */}
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          <span className="text-xs text-blue-700 truncate flex-1">{f.name}</span>
          <button onClick={() => removeFile(i)} className="text-red-500 text-xs hover:underline">✕</button>
        </div>
      ))}

      {files.length < maxFiles && (
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition">
          <input
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleChange}
          />
          <span className="text-xs text-blue-600 border border-blue-300 px-3 py-1.5 rounded hover:bg-blue-50">
            + Add {files.length > 0 ? "more" : ""} files
          </span>
          <span className="text-xs text-gray-400">{files.length}/{maxFiles} selected</span>
        </label>
      )}
    </div>
  );
}