import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getCandidatesByDepartment } from "../../api/dofaApi";
import API from "../../api/api";

export default function DofaCandidates() {
  const [params] = useSearchParams();
  const dept = params.get("dept");
  const [candidates, setCandidates] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    if (!dept) {
      setCandidates([]);
      return;
    }

    getCandidatesByDepartment(dept)
      .then(res => setCandidates(res.data))
      .catch(console.error);
  }, [dept]);

  /* =========================
     Send Single Candidate Email
  ========================== */
  const handleSendSingle = async (id) => {
    try {
      setLoadingId(id);
      await API.post(`/email/candidates/${id}`);
      alert("Email sent successfully");
    } catch (err) {
      alert("Failed to send email");
    } finally {
      setLoadingId(null);
    }
  };

  /* =========================
     Send Email To All (Department)
  ========================== */
  const handleSendAll = async () => {
    if (!window.confirm("Send email to ALL candidates?")) return;

    try {
      setSendingAll(true);
      await API.post(`/email/candidates/department/${dept}`);
      alert("Emails sent to all candidates");
    } catch (err) {
      alert("Failed to send emails");
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Candidates {dept ? `– ${dept}` : ""}
        </h2>

        {candidates.length > 0 && (
          <button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            {sendingAll ? "Sending..." : "Send Email to All"}
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Sr</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Qualification</th>
              <th className="border p-2">Specialization</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((c, i) => (
              <tr key={c._id}>
                <td className="border p-2">{i + 1}</td>
                <td className="border p-2">{c.fullName}</td>
                <td className="border p-2">{c.email}</td>
                <td className="border p-2">{c.qualification}</td>
                <td className="border p-2">{c.specialization}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleSendSingle(c._id)}
                    disabled={loadingId === c._id}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    {loadingId === c._id ? "Sending..." : "Send Email"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="p-4 text-center text-gray-500">
            No candidates uploaded
          </p>
        )}
      </div>
    </div>
  );
}
