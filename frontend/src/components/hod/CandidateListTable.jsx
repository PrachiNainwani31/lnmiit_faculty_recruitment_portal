import { useEffect, useState } from "react";
import {
  getCandidatesByCycle,
  deleteCandidateById,
  clearCandidateStats
} from "../../api/candidateApi";

export default function CandidateListTable({ cycle, isFrozen ,onChange}) {
  const [candidates, setCandidates] = useState([]);

  const fetchCandidates = async () => {
    const res = await getCandidatesByCycle(cycle);
    setCandidates(res.data);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await deleteCandidateById(id);
    window.dispatchEvent(new Event("hod-refresh"));
    await fetchCandidates();
    onChange();
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL candidates and reset?")) return;

    await clearCandidateStats(cycle);
    window.dispatchEvent(new Event("hod-refresh"));
    onChange?.(); // moves UI back to step-1
  };

  return (
    
    <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Candidate List</h3>

            {!isFrozen && (
              <button
                onClick={async () => {
                  if (!window.confirm("Delete all candidates?")) return;
                  await clearCandidateStats(cycle);
                  onChange(); //  refresh parent
                }}
                className="text-sm text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Sr</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Phone</th>
              <th className="border px-2 py-1">Qualification</th>
              <th className="border px-2 py-1">Specialization</th>
              <th className="border px-2 py-1">Reviewer Obs.</th>
              <th className="border px-2 py-1">ILSC Comments</th>
              {!isFrozen && <th className="border px-2 py-1">Action</th>}
            </tr>
          </thead>

          <tbody>
            {candidates.map((c, index) => (
            <tr key={c._id}>
              <td className="border px-2 py-1">{index+1}</td>
                <td className="border px-2 py-1">{c.fullName}</td>
                <td className="border px-2 py-1">{c.email}</td>
                <td className="border px-2 py-1">{c.phone}</td>
                <td className="border px-2 py-1">{c.qualification}</td>
                <td className="border px-2 py-1">{c.specialization}</td>
                <td className="border px-2 py-1">
                  {c.reviewerObservation}
                </td>
                <td className="border px-2 py-1">
                  {c.ilscComments}
                </td>

                {!isFrozen && (
                  <td className="border px-2 py-1 text-center">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            No candidates uploaded yet
          </p>
        )}
      </div>
    </div>
  );
}
