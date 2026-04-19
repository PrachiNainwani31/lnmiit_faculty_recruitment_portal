// components/hod/CandidateUploadCard.jsx
import { useState } from "react";
import {
  downloadCandidateTemplate,
  uploadCandidatesCSV,
} from "../../api/candidateApi";

// All 11 CSV columns — shown as a hint so HOD knows what to fill
const CSV_COLUMNS = [
  { name: "Sr. No.",               required: true  },
  { name: "Full Name",             required: true  },
  { name: "Primary Email",         required: true  },
  { name: "Secondary Email",       required: false },
  { name: "Phone No.",             required: false },
  { name: "Qualification",         required: true  },
  { name: "Specialization",        required: true  },
  { name: "Applied Position",      required: true  },
  { name: "Recommended Position",  required: true  },
  { name: "DLSC Recommendation",   required: false },
  { name: "ILSC Recommendation",   required: false },
  { name: "DLSC Remarks",          required: false },
  { name: "ILSC Remarks",          required: false },
];

export default function CandidateUploadCard({
  cycle,
  ilscCount,
  isFrozen,
  onClearAll,
  onUploaded,
}) {
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCols, setShowCols] = useState(false);

  /* ── Download template ── */
  const handleDownload = async () => {
    try {
      const res = await downloadCandidateTemplate(cycle);
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `ILSC_Candidates_${cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Failed to download template");
    }
  };

  /* ── Upload CSV ── */
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file",  file);
    formData.append("cycle", cycle);

    try {
      setLoading(true);
      await uploadCandidatesCSV(formData);
      alert("Candidates uploaded successfully");
      setFile(null);
      onUploaded();
    } catch (err) {
      alert(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "CSV upload failed. Please check file format and row count."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Upload Candidate Data</h3>
          <p className="text-sm text-gray-500">
            Template must contain exactly <b>{ilscCount}</b> candidates
          </p>
        </div>

        {!isFrozen && (
          <button
            onClick={onClearAll}
            className="text-sm text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Column reference ── */}
      <div className="mb-4">
        <button
          onClick={() => setShowCols(v => !v)}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          {showCols ? "▲ Hide" : "▼ Show"} CSV column reference (13 columns)
        </button>

        {showCols && (
          <div className="mt-2 bg-gray-50 border rounded p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CSV_COLUMNS.map(col => (
              <div key={col.name} className="flex items-center gap-1 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  col.required ? "bg-red-400" : "bg-gray-300"
                }`} />
                <span className="font-mono text-gray-700">{col.name}</span>
                {!col.required && (
                  <span className="text-gray-400 italic">(optional)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 1: Download template ── */}
      <div className="bg-blue-50 border rounded p-4 flex justify-between items-center mb-4">
        <div>
          <p className="font-medium text-sm">Step 1: Download Template</p>
          <p className="text-xs text-gray-500">
            Pre-filled with {ilscCount} rows · 13 columns
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isFrozen}
          className={`px-4 py-2 rounded text-sm text-white ${
            isFrozen
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Download Template
        </button>
      </div>

      {/* ── Step 2: Upload filled CSV ── */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition ${
          isFrozen ? "opacity-40" : "hover:bg-gray-50"
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          disabled={isFrozen}
          className="hidden"
          id="csvUpload"
        />
        <label
          htmlFor="csvUpload"
          className={`cursor-pointer text-sm ${isFrozen ? "text-gray-400" : "text-gray-600"}`}
        >
          {file ? (
            <span className="text-blue-700 font-medium">📄 {file.name}</span>
          ) : (
            "Drop CSV here or click to browse"
          )}
        </label>
      </div>

      {/* ── Upload button ── */}
      <div className="text-right">
        <button
          onClick={handleUpload}
          disabled={isFrozen || loading}
          className={`px-6 py-2 rounded text-sm text-white ${
            isFrozen || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Uploading…" : "Upload CSV"}
        </button>
      </div>

      {isFrozen && (
        <p className="mt-3 text-xs text-red-500">
          Cycle is frozen. Upload disabled.
        </p>
      )}
    </div>
  );
}