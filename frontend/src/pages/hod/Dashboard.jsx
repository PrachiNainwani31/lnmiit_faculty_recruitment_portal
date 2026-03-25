import { useEffect, useState } from "react";
import { getHodCounts } from "../../api/hodApi";
import FinalSubmissionCard from "../../components/hod/FinalSubmissionCard";
import { submitToDofa } from "../../api/hodApi";
import { useOutletContext } from "react-router-dom";
import SelectionStatusPanel from "../../components/SelectionStatusPanel";

export default function Dashboard() {
  const [counts, setCounts] = useState({
    candidates: 0,
    experts: 0,
  });
  const { isFrozen} = useOutletContext();

  const fetchCounts = async () => {
    const res = await getHodCounts();
    setCounts(res.data);
  };

  useEffect(() => {
    fetchCounts();

    // 🔁 Listen to global refresh events
    window.addEventListener("hod-refresh", fetchCounts);
    return () =>
      window.removeEventListener("hod-refresh", fetchCounts);
  }, []);

  return (
    
    <div className="space-y-6">
      {(counts.candidates > 0 || counts.experts > 0) && (
        <FinalSubmissionCard
          locked={isFrozen}
          counts={counts}
          onSubmit={async () => {
            if (!window.confirm("Once submitted, data will be frozen. Continue?")) return;
            await submitToDofa();
            alert("Submitted to DoFA successfully. Data is now locked.");
            fetchCounts();
          }}
        />
      )}
      {/* Stat Cards */}
       <div className="grid grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded shadow">
        <p className="text-sm text-gray-500">Candidates</p>
        <p className="text-3xl font-bold">{counts.candidates}</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <p className="text-sm text-gray-500">Experts</p>
        <p className="text-3xl font-bold">{counts.experts}</p>
      </div>
    </div>

      {/* Overview */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-semibold text-lg mb-2">Overview</h3>
        <p className="text-gray-600">
          Welcome to the HOD Management Portal. Use the sidebar to manage
          candidates and experts. Upload candidate data via CSV or add
          experts manually.
        </p>
      </div>
      <SelectionStatusPanel role="HOD" />
    </div>
  );
}
