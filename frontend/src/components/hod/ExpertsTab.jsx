import { useEffect, useState } from "react";
import { addExpert, getExperts } from "../../api/hodApi";

export default function ExpertsTab({ refreshCounts, isFrozen }) {
  const [experts, setExperts] = useState([]);
  const [form, setForm] = useState({
    srNo: "",
    fullName: "",
    designation: "",
    department: "",
    institute: "",
    email: "",
  });

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    const res = await getExperts();
    setExperts(res.data);
    refreshCounts();
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addExpert(form);
    setForm({
      srNo: "",
      fullName: "",
      designation: "",
      department: "",
      institute: "",
      email: "",
    });
    fetchExperts();
  };

  return (
    <div className="space-y-6">

      {isFrozen && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
          This session is frozen. Expert editing is disabled until DoFA sends it back.
        </div>
      )}

      {/* Add Expert Form */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Add External Expert</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="srNo"
            value={form.srNo}
            onChange={handleChange}
            placeholder="Sr. No."
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Full Name (with Salutation)"
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Designation"
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <input
            name="institute"
            value={form.institute}
            onChange={handleChange}
            placeholder="Institute"
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded"
            required
            disabled={isFrozen}
          />

          <button
            type="submit"
            disabled={isFrozen}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Expert
          </button>
        </form>
      </div>

      {/* Experts Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Sr. No.</th>
              <th className="px-3 py-2">Full Name</th>
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Department</th>
              <th className="px-3 py-2">Institute</th>
              <th className="px-3 py-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {experts.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2">{e.srNo}</td>
                <td className="px-3 py-2">{e.fullName}</td>
                <td className="px-3 py-2">{e.designation}</td>
                <td className="px-3 py-2">{e.department}</td>
                <td className="px-3 py-2">{e.institute}</td>
                <td className="px-3 py-2">{e.email}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {experts.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No experts added yet</p>
        )}
      </div>
    </div>
  );
}
