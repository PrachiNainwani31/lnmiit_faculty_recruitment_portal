import { useEffect, useState } from "react";
import {
  getExperts,
  uploadExpertsCSV,
  clearExperts,
} from "../../api/hodApi";
import { useOutletContext } from "react-router-dom";

export default function Experts() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isFrozen } = useOutletContext();

  /* ---------------- Fetch Experts ---------------- */
  const fetchExperts = async () => {
    try {
      setLoading(true);
      const res = await getExperts();
      setExperts(res.data);
    } catch (err) {
      console.error("Failed to fetch experts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  /* ---------------- Upload CSV ---------------- */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await uploadExpertsCSV(file);
      alert("Experts uploaded successfully");
      fetchExperts();
      window.dispatchEvent(new Event("hod-refresh"));
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  /* ---------------- Download Template ---------------- */
  const downloadTemplate = () => {
    const headers = [
      "Sr. No.",
      "Full Name (with Salutation)",
      "Designation",
      "Department",
      "Institute",
      "Email",
      "Specialization",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + headers.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experts_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleClear = async () => {
  if (!window.confirm("Delete ALL experts?")) return;

  try {
    await clearExperts();
    alert("All experts deleted");
    fetchExperts();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to delete");
  }
};

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
  <input disabled={isFrozen}
    type="file"
    accept=".csv"
    onChange={handleUpload}
    className="border p-2 rounded"
  />

  <button disabled={isFrozen}
    onClick={downloadTemplate}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Download Template
  </button>

  <button disabled={isFrozen}
    onClick={handleClear}
    className="bg-red-600 text-white px-4 py-2 rounded"
  >
    Delete All Experts
  </button>
</div>

      {/* Experts Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Designation</th>
              <th className="border p-2">Department</th>
              <th className="border p-2">Institute</th>
            </tr>
          </thead>
          <tbody>
            {experts.map((exp) => (
              <tr key={exp.id}>
                <td className="border p-2">{exp.fullName}</td>
                <td className="border p-2">{exp.email}</td>
                <td className="border p-2">{exp.designation}</td>
                <td className="border p-2">{exp.department}</td>
                <td className="border p-2">{exp.institute}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
