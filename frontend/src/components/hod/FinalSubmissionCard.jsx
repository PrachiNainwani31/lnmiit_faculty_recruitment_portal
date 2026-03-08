import { AlertTriangle, CheckCircle } from "lucide-react";

export default function FinalSubmissionCard({
  locked,
  counts,
  onSubmit,
}) {
  return (
    <div
      className={`rounded-lg p-6 shadow-md text-white ${
        locked
          ? "bg-gray-500"
          : "bg-gradient-to-r from-indigo-600 to-purple-600"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">
          Final Submission to DoFA
        </h3>
      </div>

      <p className="text-sm opacity-90 mb-6">
        Complete your submission – this action cannot be undone.
      </p>

      {/* Counts */}
      <div className="bg-white/10 rounded-md p-4 mb-6 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300" />
          <span>
            Candidates uploaded:{" "}
            <b>{counts.candidates}</b>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-300" />
          <span>
            Experts added:{" "}
            <b>{counts.experts}</b>
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="text-right">
        <button
          onClick={onSubmit}
          disabled={locked}
          className={`px-6 py-2 rounded-md font-medium transition ${
            locked
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-white text-indigo-700 hover:bg-gray-100"
          }`}
        >
          {locked
            ? "Submission Locked"
            : "Submit Everything to DoFA"}
        </button>
      </div>

      {/* Locked Message */}
      {locked && (
        <p className="text-sm mt-4 opacity-80">
          This cycle has been submitted to DoFA and is now locked.
        </p>
      )}
    </div>
  );
}
