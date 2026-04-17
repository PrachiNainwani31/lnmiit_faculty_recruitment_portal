// components/candidate/CandidateHome.jsx
import OnboardingStatus from "../OnBoardingStatus";

export default function Candidatehome({ application = {}, onOpenForm }) {
  const isSubmitted = application?.status === "SUBMITTED";

  return (
    <div className="flex-1 p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome{application?.name ? `, ${application.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">LNMIIT Recruitment & Onboarding Portal</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Application card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">📋</div>
            <div>
              <h2 className="font-semibold text-gray-800">My Application</h2>
              <p className="text-xs text-gray-400 mt-0.5">Fill in your details and submit</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            isSubmitted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSubmitted ? "bg-green-500" : "bg-amber-500"}`} />
            {isSubmitted ? "Submitted" : "Draft — Not submitted yet"}
          </div>

          {isSubmitted && (
            <p className="text-xs text-gray-400">
              Your application has been submitted and is under review.
            </p>
          )}

          <button onClick={onOpenForm}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
              isSubmitted
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}>
            {isSubmitted ? "View Submitted Application" : "Open Application Form →"}
          </button>
        </div>

        {/* Selection status card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-xl flex-shrink-0">🎓</div>
            <div>
              <h2 className="font-semibold text-gray-800">Selection & Onboarding</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track your selection and onboarding progress</p>
            </div>
          </div>

          {!isSubmitted ? (
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              Submit your application first to be considered for selection.
            </p>
          ) : (
            <p className="text-xs bg-green-50 text-green-700 p-3 rounded-lg">
              Your application is under review. Check below for selection result.
            </p>
          )}
        </div>
      </div>

      {/* Onboarding status — only visible if selected */}
      <OnboardingStatus />
    </div>
  );
}