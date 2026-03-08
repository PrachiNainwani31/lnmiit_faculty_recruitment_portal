import { useEffect, useState } from "react";
import { getAllExperts } from "../../api/dofaApi";
import API from "../../api/api";

export default function DofaExperts() {
  const [groupedExperts, setGroupedExperts] = useState({});
  const [sendingHod, setSendingHod] = useState(null);

  useEffect(() => {
    getAllExperts().then(res => {
      const experts = res.data;

      const grouped = {};

      experts.forEach(e => {
        if (!e.uploadedBy) return;

        const hodId = e.uploadedBy._id;

        if (!grouped[hodId]) {
          grouped[hodId] = {
            hodName: e.uploadedBy.name,
            department: e.uploadedBy.department,
            experts: []
          };
        }

        grouped[hodId].experts.push(e);
      });

      setGroupedExperts(grouped);
    });
  }, []);

  const handleSendAll = async (hodId) => {
    if (!window.confirm("Send email to all experts of this HOD?")) return;

    try {
      setSendingHod(hodId);
      await API.post(`/email/experts/hod/${hodId}`);
      alert("Emails sent successfully");
    } catch (err) {
      alert("Failed to send emails");
    } finally {
      setSendingHod(null);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">
        Experts Uploaded by HODs
      </h2>

      {Object.keys(groupedExperts).map(hodId => (
        <div key={hodId} className="bg-white rounded shadow p-6">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {groupedExperts[hodId].department} HOD
            </h3>

            <button
              onClick={() => handleSendAll(hodId)}
              disabled={sendingHod === hodId}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              {sendingHod === hodId ? "Sending..." : "Send Email to All"}
            </button>
          </div>

          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Designation</th>
                <th className="border p-2">Department</th>
              </tr>
            </thead>

            <tbody>
              {groupedExperts[hodId].experts.map((e, i) => (
                <tr key={e._id}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{e.fullName}</td>
                  <td className="border p-2">{e.email}</td>
                  <td className="border p-2">{e.designation}</td>
                  <td className="border p-2">{e.department}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      ))}

      {Object.keys(groupedExperts).length === 0 && (
        <p className="text-center text-gray-500">
          No experts uploaded
        </p>
      )}
    </div>
  );
}
