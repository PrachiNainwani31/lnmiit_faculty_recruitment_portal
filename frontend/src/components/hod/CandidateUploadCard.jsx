import { useState } from "react";
import {
  downloadCandidateTemplate,
  uploadCandidatesCSV,
} from "../../api/candidateApi";

export default function CandidateUploadCard({
  cycle,
  ilscCount,
  isFrozen,
  onClearAll,
  onUploaded,
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- Download CSV ---------------- */
  const handleDownload = async () => {
    try {
      const res = await downloadCandidateTemplate(cycle);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ILSC_Candidates_${cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download template");
    }
  };

  /* ---------------- Upload CSV ---------------- */
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("cycle", cycle);

    try {
      setLoading(true);
      await uploadCandidatesCSV(formData);

      alert("Candidates uploaded successfully");
      setFile(null);
      onUploaded(); // move to list step
    } catch (err) {
      alert(
        err.response?.data?.msg ||
          "CSV upload failed. Please check file format and row count."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Upload Candidate Data</h3>
          <p className="text-sm text-gray-500">
            Template must contain exactly{" "}
            <b>{ilscCount}</b> candidates
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

      {/* Step 1 */}
      <div className="bg-blue-50 border rounded p-4 flex justify-between items-center mb-4">
        <div>
          <p className="font-medium">Step 1: Download Template</p>
          <p className="text-sm text-gray-500">
            CSV will contain {ilscCount} rows
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={isFrozen}
          className={`px-4 py-2 rounded text-white ${
            isFrozen
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Download Template
        </button>
      </div>

      {/* Step 2 */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={isFrozen}
          className="hidden"
          id="csvUpload"
        />

        <label
          htmlFor="csvUpload"
          className={`cursor-pointer ${
            isFrozen ? "text-gray-400" : ""
          }`}
        >
          {file ? file.name : "Drop CSV here or click to browse"}
        </label>
      </div>

      {/* Upload Button */}
      <div className="text-right">
        <button
          onClick={handleUpload}
          disabled={isFrozen || loading}
          className={`px-6 py-2 rounded text-white ${
            isFrozen || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {isFrozen && (
        <p className="mt-3 text-sm text-red-500">
          Cycle is frozen. Upload disabled.
        </p>
      )}
    </div>
  );
}
