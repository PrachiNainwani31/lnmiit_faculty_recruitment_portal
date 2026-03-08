import { useState, useEffect } from "react";
import { saveCandidateStats, getCandidateStats } from "../../api/candidateApi";

export default function CandidateStatsCard({ cycle, onSaved }) {
  const [form, setForm] = useState({
    totalApplications: "",
    dlscShortlisted: "",
    ilscShortlisted: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getCandidateStats(cycle);
      if (res.data) {
        setForm(res.data);
        onSaved(res.data.ilscShortlisted);
      }
    } catch {}
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    await saveCandidateStats({
      cycle,
      ...form,
    });
    setLoading(false);
    onSaved(form.ilscShortlisted);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-1">
        Candidate Application Details
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter the application and shortlisting numbers
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          name="totalApplications"
          placeholder="Total Applications Received"
          className="border rounded px-3 py-2"
          value={form.totalApplications}
          onChange={handleChange}
        />

        <input
          type="number"
          name="dlscShortlisted"
          placeholder="Shortlisted in DLSC"
          className="border rounded px-3 py-2"
          value={form.dlscShortlisted}
          onChange={handleChange}
        />

        <input
          type="number"
          name="ilscShortlisted"
          placeholder="Shortlisted in ILSC"
          className="border rounded px-3 py-2"
          value={form.ilscShortlisted}
          onChange={handleChange}
        />
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Proceed to Next Step"}
        </button>
      </div>
    </div>
  );
}
