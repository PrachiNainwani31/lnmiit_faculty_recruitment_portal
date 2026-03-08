import { useEffect, useState } from "react";
import API from "../../api/api";

export default function CandidateResumeUpload({ isFrozen }) {
  const [file, setFile] = useState(null);      // selected file
  const [uploaded, setUploaded] = useState(null); // server file
  const [loading, setLoading] = useState(false);

  /* ===============================
     FETCH UPLOADED ZIP
  =============================== */
  const fetchResumes = async () => {
    try {
      const res = await API.get("/hod/candidates/resumes");
      setUploaded(res.data?.[0] || null);
    } catch (err) {
      console.error("Failed to fetch resumes");
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  /* ===============================
     UPLOAD ZIP
  =============================== */
  const handleUpload = async () => {
    if (!file) {
      alert("Please select ZIP file");
      return;
    }

    const formData = new FormData();
    formData.append("zip", file);

    try {
      setLoading(true);
      await API.post("/hod/candidates/resumes", formData);

      alert("ZIP uploaded successfully");
      setFile(null);
      fetchResumes();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     DELETE ZIP
  =============================== */
  const handleDelete = async () => {
    if (!window.confirm("Delete uploaded ZIP file?")) return;

    try {
      await API.delete("/hod/candidates/resumes/resumes.zip");
      setUploaded(null);
      setFile(null);
      alert("ZIP deleted successfully");
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-semibold mb-2">
        Upload Candidate CVs (ZIP)
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Upload a single ZIP file containing all candidate resumes.
      </p>

      {!isFrozen && (
        <div className="space-y-4">

          {/* FILE INPUT ALWAYS VISIBLE */}
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files[0])}
          />

          {/* BUTTON LOGIC */}

          {/* If NO file uploaded on server */}
          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded"
            >
              {loading ? "Uploading..." : "Upload ZIP"}
            </button>
          )}

          {/* If file already uploaded */}
          {uploaded && (
            <div className="flex gap-4">

              {/* Delete always visible */}
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-6 py-2 rounded"
              >
                Delete ZIP
              </button>

              {/* Upload only when new file selected */}
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded"
                >
                  Replace ZIP
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SHOW EXISTING FILE */}
      {uploaded && (
        <div className="mt-6 border rounded-lg p-4 bg-gray-50 flex items-center gap-3">
          <div className="text-3xl">📄</div>

          <a
            href={uploaded.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {uploaded.name}
          </a>
        </div>
      )}
    </div>
  );
}
