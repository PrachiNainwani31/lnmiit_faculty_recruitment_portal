// components/hod/CandidateResumeUpload.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";

export default function CandidateResumeUpload({ isFrozen }) {
  const [file,         setFile]         = useState(null);
  const [uploaded,     setUploaded]     = useState(null);   // { name, url, originalName }
  const [loading,      setLoading]      = useState(false);
  const [replacing,    setReplacing]    = useState(false);
  const [originalName, setOriginalName] = useState("");     // tracks the user's filename

  const fetchResumes = async () => {
    try {
      const res = await API.get("/hod/candidates/resumes");
      const item = res.data?.[0] || null;
      if (item) {
        setUploaded(item);
        // Restore saved original name from localStorage if available
        const saved = localStorage.getItem("resumeOriginalName");
        if (saved) setOriginalName(saved);
        else       setOriginalName(item.name); // fallback to server name
      }
    } catch {
      setUploaded(null);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setOriginalName(f.name); // ← capture user's real filename
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a ZIP file");
    const formData = new FormData();
    formData.append("zip", file);
    try {
      setLoading(true);
      await API.post("/hod/candidates/resumes", formData);
      // Persist the original filename so it survives page reload
      localStorage.setItem("resumeOriginalName", file.name);
      alert("ZIP uploaded successfully");
      setFile(null);
      setReplacing(false);
      fetchResumes();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete uploaded ZIP file?")) return;
    try {
      await API.delete("/hod/candidates/resumes/resumes.zip");
      localStorage.removeItem("resumeOriginalName");
      setUploaded(null);
      setFile(null);
      setOriginalName("");
      setReplacing(false);
    } catch {
      alert("Failed to delete file");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Upload Candidate CVs (ZIP)</h3>
      <p className="text-sm text-gray-500 mb-5">
        Upload a single ZIP file containing all candidate resumes.
      </p>

      {!isFrozen && (
        <>
          {/* ── No file uploaded yet ── */}
          {!uploaded && (
            <div className="space-y-3">
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {file && (
                <p className="text-xs text-gray-500">Selected: <span className="font-medium text-gray-700">{file.name}</span></p>
              )}
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
              >
                {loading ? "Uploading…" : "Upload ZIP"}
              </button>
            </div>
          )}

          {/* ── File already uploaded ── */}
          {uploaded && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                <span className="text-3xl">📦</span>
                <div className="flex-1">
                  {/* ✅ Plain text — no link */}
                  <p className="font-medium text-sm text-gray-800">
                    {originalName || uploaded.name}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">✓ Uploaded successfully</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setReplacing(v => !v); setFile(null); }}
                    className="text-xs border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    {replacing ? "Cancel" : "Replace ZIP"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Delete ZIP
                  </button>
                </div>
              </div>

              {replacing && (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-wrap">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white file:border file:border-gray-300 hover:file:bg-gray-50"
                  />
                  {file && (
                    <p className="text-xs text-gray-500 w-full">New file: <span className="font-medium text-gray-700">{file.name}</span></p>
                  )}
                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                  >
                    {loading ? "Uploading…" : "Upload New ZIP"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Frozen — plain text display only */}
      {isFrozen && uploaded && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
          <span className="text-3xl">📦</span>
          <p className="font-medium text-sm text-gray-700">
            {originalName || uploaded.name}
          </p>
        </div>
      )}

      {isFrozen && !uploaded && (
        <p className="text-sm text-gray-400 italic">No ZIP uploaded. (Cycle is frozen)</p>
      )}
    </div>
  );
}