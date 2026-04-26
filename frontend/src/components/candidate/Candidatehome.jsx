// components/candidate/CandidateHome.jsx
import OnboardingStatus from "../OnBoardingStatus";

export default function Candidatehome({ application = {}, onOpenForm }) {
  const isSubmitted = application?.status === "SUBMITTED";
   const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = application?.name || user?.name || "";
  const firstName = displayName.split(" ").find(p => 
    !["Dr.", "Dr", "Prof.", "Prof", "Mr.", "Mr", "Ms.", "Ms", "Mrs.", "Mrs"].includes(p)
  ) || displayName;
  return (
    <div className="flex-1 p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">LNMIIT Faculty Recruitment & Onboarding Portal</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Application card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">My Document</h2>
              <p className="text-xs text-gray-400 mt-0.5">Open Document Submission Form and Submit</p>
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
            {isSubmitted ? "View Submitted Application" : "Open Document Submission Form →"}
          </button>
        </div>

        {/* Selection status card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">Selection and Onboarding</h2>
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