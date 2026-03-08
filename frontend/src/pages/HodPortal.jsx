import { useState, useEffect } from "react";
import CandidatesTab from "../components/hod/CandidatesTab";
import ExpertsTab from "../components/hod/ExpertsTab";
import { getCandidates, getExperts } from "../api/hodApi";
import { getCurrentCycle, submitToDofa } from "../api/cycleApi";
import NotificationBell from "../components/notifications/NotificationBell";

export default function HodPortal() {
  const [tab, setTab] = useState("candidates");
  const [candidateCount, setCandidateCount] = useState(0);
  const [expertCount, setExpertCount] = useState(0);
  const [cycle, setCycle] = useState(null);

  useEffect(() => {
    fetchCycle();
    fetchCounts();
  }, []);

  const fetchCycle = async () => {
    const res = await getCurrentCycle();
    setCycle(res.data);
  };

  const fetchCounts = async () => {
    const c = await getCandidates();
    const e = await getExperts();
    setCandidateCount(c.data.length);
    setExpertCount(e.data.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          
          {/* Left: Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HOD Portal</h1>
          </div>

          {/* Right: Notifications + Status + Action */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {cycle && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold
                ${cycle.status === "DRAFT" && "bg-yellow-100 text-yellow-700"}
                ${cycle.status === "SUBMITTED" && "bg-blue-100 text-blue-700"}
                ${cycle.status === "QUERY" && "bg-red-100 text-red-700"}
                ${cycle.status === "APPROVED" && "bg-green-100 text-green-700"}`}
              >
                Session 2026–27 : {cycle.status}
              </span>
            )}

            {(cycle?.status === "DRAFT" || cycle?.status === "QUERY") && (
              <button
                onClick={async () => {
                  await submitToDofa();
                  window.dispatchEvent(new Event("notify-refresh"));
                  fetchCycle();
                  alert("Submitted to DoFA. Editing frozen.");
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Submit to DoFA
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-10 border-b mb-6">
          <button
            onClick={() => setTab("candidates")}
            className={`pb-2 flex items-center gap-2 ${
              tab === "candidates"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-500"
            }`}
          >
            Candidates
            <span className="bg-gray-200 text-xs px-2 rounded-full">
              {candidateCount}
            </span>
          </button>

          <button
            onClick={() => setTab("experts")}
            className={`pb-2 flex items-center gap-2 ${
              tab === "experts"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-500"
            }`}
          >
            Experts
            <span className="bg-gray-200 text-xs px-2 rounded-full">
              {expertCount}
            </span>
          </button>
        </div>

        {tab === "candidates" ? (
          <CandidatesTab
            refreshCounts={fetchCounts}
            isFrozen={cycle?.isFrozen}
          />
        ) : (
          <ExpertsTab
            refreshCounts={fetchCounts}
            isFrozen={cycle?.isFrozen}
          />
        )}
      </main>
    </div>
  );
}
