import { useEffect, useState } from "react";
import {
  approveCycle,
  raiseQuery,
  getDofaDashboard,
  downloadDepartmentResumes,
} from "../../api/dofaApi";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/ui/SummaryCard";
import CommentModal from "../../components/dofa/CommentModal";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDofaDashboard().then(res => setData(res.data));
  }, []);

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
    await raiseQuery(text);
    setShowComment(false);
    alert("Comment sent to HOD");
  };

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

              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  d.status === "SUBMITTED"
                    ? "bg-yellow-100 text-yellow-700"
                    : d.status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {d.status}
              </span>
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
                    onClick={approveCycle}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDept(d.department);
                      setShowComment(true);
                    }}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Raise Query
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* COMMENT MODAL */}
      <CommentModal
        open={showComment}
        onClose={() => setShowComment(false)}
        onSend={handleSendComment}
      />
    </div>
  );
}
