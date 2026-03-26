import { useState, useEffect } from "react";
import { uploadCandidates, getCandidates, deleteCandidate, deleteAllCandidates } from "../../api/hodApi";

export default function CandidatesTab({ refreshCounts, isFrozen }) {
  const [file, setFile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const res = await getCandidates();
    setCandidates(res.data);
    refreshCounts();
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select CSV file");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    await uploadCandidates(formData);
    window.dispatchEvent(new Event("hod-refresh"));
    setLoading(false);

    setFile(null);
    fetchCandidates();
  };

  return (
    <div className="space-y-6">

      {isFrozen && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
          🔒 This session is frozen. Editing is disabled until DoFA sends it back.
        </div>
      )}

      <div className="flex justify-end mb-3">
        <button
          disabled={isFrozen}
          onClick={async () => {
            const confirm = window.prompt(
              "This will delete ALL candidates of Session 2026-27.\nType DELETE to confirm."
            );
            if (confirm === "DELETE") {
              await deleteAllCandidates();
              fetchCandidates();
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear All for 2026–27
        </button>
      </div>

      {/* Upload Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold text-lg mb-1">Upload Candidates CSV</h3>
        <p className="text-sm text-gray-500 mb-4">
          CSV should include: Sr No, Name, Email, Phone, Qualification, Specialization, Reviewer Observation, ILSC Comments
        </p>

        <div className={`border-2 border-dashed rounded-lg p-8 text-center 
          ${isFrozen ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"}`}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
            id="csvUpload"
            disabled={isFrozen}
          />
          <label htmlFor="csvUpload" className="cursor-pointer">
            {file ? file.name : "Drop CSV here or click to upload"}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || isFrozen}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Sr. No.</th>
              <th className="px-3 py-2">Full Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Qualification</th>
              <th className="px-3 py-2">Specialization</th>
              <th className="px-3 py-2">Reviewer Observation</th>
              <th className="px-3 py-2">ILSC Comments</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.srNo}</td>
                <td className="px-3 py-2">{c.fullName}</td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{c.phone}</td>
                <td className="px-3 py-2">{c.qualification}</td>
                <td className="px-3 py-2">{c.specialization}</td>
                <td className="px-3 py-2">{c.reviewerObservation}</td>
                <td className="px-3 py-2">{c.ilscComments}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    disabled={isFrozen}
                    onClick={async () => {
                      if (window.confirm("Delete this candidate from 2026–27?")) {
                        await deleteCandidate(c.id);
                        fetchCandidates();
                      }
                    }}
                    className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No candidates uploaded yet</p>
        )}
      </div>
    </div>
  );
}
