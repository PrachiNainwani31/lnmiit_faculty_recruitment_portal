import { useEffect, useState } from "react";
import {
  raiseQuery,
  getDofaDashboard,
  downloadDepartmentResumes,
  approveCycle
} from "../../api/dofaApi";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/ui/SummaryCard";
import CommentModal from "../../components/dofa/CommentModal";
import SelectionStatusPanel from "../../components/Selectionstatuspanel";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedHodId, setSelectedHodId] = useState(null);
  const navigate = useNavigate();

  const load = () =>
  getDofaDashboard().then(res => setData(res.data)).catch(console.error);

  useEffect(() => { load(); }, []);

  if (!data)
    return (
      <div className="p-10 text-center text-gray-500">
        Loading dashboard...
      </div>
    );

  const handleDownload = async (dept) => {
    try {
      const res = await downloadDepartmentResumes(dept);
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${dept}_resumes.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No resumes uploaded for this department");
    }
  };

  const handleSendComment = async (text) => {
    await raiseQuery(text,selectedHodId);
    setShowComment(false);
    alert("Comment sent to HOD");
  };

  const stageLabel = (status) => ({
    "DRAFT":     { label:"Draft",     color:"bg-gray-100 text-gray-600 border-gray-200" },
    "SUBMITTED": { label:"Submitted", color:"bg-yellow-100 text-yellow-700 border-yellow-200" },
    "QUERY":     { label:"Query sent",color:"bg-red-100 text-red-700 border-red-200"    },
    "APPROVED":  { label:"Approved",  color:"bg-green-100 text-green-700 border-green-200" },
  }[status] || { label: status, color:"bg-gray-100 text-gray-500 border-gray-200" });

  return (
    <div className="space-y-8">

      {/* PAGE TITLE */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          DOFA Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Review department submissions and take action
        </p>
      </div>

      {/* SUMMARY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Pending" value={data.summary.pending} />
        <SummaryCard title="Total Candidates" value={data.summary.totalCandidates} />
        <SummaryCard title="Total Experts" value={data.summary.totalExperts} />
        <SummaryCard title="Approved" value={data.summary.approved} />
      </div>

      {/* DEPARTMENT CARDS */}
      <div className="space-y-6">
        {data.departments?.map(d => (
          <div
            key={d.department}
            className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {d.department}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  HOD: {d.hodEmail}
                </p>
              </div>

              <div className="flex items-center gap-0 mb-5 overflow-x-auto">
                {[
                  { key:"DRAFT",     label:"Draft"     },
                  { key:"SUBMITTED", label:"Submitted" },
                  { key:"QUERY",     label:"Query"     },
                  { key:"APPROVED",  label:"Approved"  },
                ].map((stage, i, arr) => {
                  const statuses = ["DRAFT","SUBMITTED","QUERY","APPROVED"];
                  const currentIdx = statuses.indexOf(d.status);
                  const stageIdx   = statuses.indexOf(stage.key);
                  const isDone     = stageIdx < currentIdx;
                  const isCurrent  = stageIdx === currentIdx;
                  return (
                    <div key={stage.key} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${
                          isDone    ? "bg-green-100 text-green-700 border-green-300" :
                          isCurrent ? "bg-blue-100 text-blue-700 border-blue-300" :
                                      "bg-gray-100 text-gray-400 border-gray-200"
                        }`}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <p className={`text-xs mt-1 whitespace-nowrap ${isCurrent ? "text-blue-600 font-medium" : isDone ? "text-green-600" : "text-gray-400"}`}>
                          {stage.label}
                        </p>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`h-0.5 w-12 mx-1 mb-4 ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-6">
              <div>
                <p className="text-gray-400">Position</p>
                <p className="font-medium">{d.position}</p>
              </div>

              <div>
                <p className="text-gray-400">Candidates</p>
                <p className="font-medium">{d.candidates}</p>
              </div>

              <div>
                <p className="text-gray-400">Experts</p>
                <p className="font-medium">{d.experts}</p>
              </div>

              <div>
                <p className="text-gray-400">Submitted</p>
                <p className="font-medium">
                  {d.submittedDate
                    ? new Date(d.submittedDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3">

              <button
                onClick={() => navigate(`/dofa/candidates?dept=${d.department}`)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                View Candidates
              </button>

              <button
                onClick={() => navigate(`/dofa/experts?dept=${d.department}`)}
                className="px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 transition"
              >
                View Experts
              </button>

              <button
                onClick={() => handleDownload(d.department)}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Download Resumes
              </button>

              {d.status === "SUBMITTED" && (
                <>
                  <button
                    onClick={() => {
                      setSelectedDept(d.department);
                      setSelectedHodId(d.hodId);
                      setShowComment(true);
                    }}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Raise Query
                  </button>
                </>
              )}
              {d.status === "SUBMITTED" && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Approve ${d.department} submission?`)) return;
                      try {
                        await approveCycle(d.hodId);
                        load();
                      } catch { alert("Failed to approve"); }
                    }}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                    Approve Submission
                  </button>
                )}
                {d.status === "QUERY" && (
                  <span className="px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md">
                    Awaiting HOD response to query
                  </span>
                )}
                {d.status === "APPROVED" && (
                  <span className="px-4 py-2 text-sm bg-green-50 text-green-600 border border-green-200 rounded-md font-medium">
                    Submission approved
                  </span>
                )}
            </div>
          </div>
        ))}
      </div>
        <SelectionStatusPanel role="DOFA" />
      {/* COMMENT MODAL */}
      <CommentModal
        open={showComment}
        onClose={() => setShowComment(false)}
        onSend={handleSendComment}
      />
    </div>
  );
}
