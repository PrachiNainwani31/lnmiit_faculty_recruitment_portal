import { useState, useEffect } from "react";
import API from "../../api/api";

const DEFAULT_TEMPLATE = (candidate = {}) => `Dear ${candidate.name || "Candidate"},

Greetings from the LNM Institute of Information Technology, Jaipur.

Based on your application for the faculty position, we are pleased to inform you that you have been shortlisted for an interview for the Assistant Professor position in physical mode scheduled for April 6-7, 2026. You are requested to report to the institute at 9:00 AM on April 6 (Monday) for the teaching presentation, for which the details shall be shared by the HoD, CCE Department, in a separate email. This would be followed by the interview with the selection panel, starting from 9:00 AM on April 7 (Tuesday). You need to present your research work (research presentation), highlighting the main contributions in your PhD work and post-doctoral work, if any. Kindly note that you have only 15-20 minutes for the research presentation, and thus, include only the highlights of your research contributions. You may also include one or two slides describing yourself and your research plan for the next five years. This will be followed by interaction with the members of the selection panel.

You are requested to present for this faculty selection process from April 6-7, 2026, and need to do the following:

1. Fill the form and upload the required documents on the following link: https://forms.gle/Bxbsdw4vdJ5cEjG77. If you face any issues in filling the form, send an email to ashish.sharma@lnmiit.ac.in with a copy to me at asst-dean.faculty@lnmiit.ac.in. The deadline to fill the form is March 13, 2026.

2. Kindly arrange to send three letters of reference, directly from your referees to asst-dean.faculty@lnmiit.ac.in with a copy to ashish.sharma@lnmiit.ac.in by March 15, 2026.

3. You would be reimbursed for train fare by the AC-III tier from the place of your residence/work to Jaipur and back by the shortest route.

With Regards,
DOFA
The LNM Institute of Information Technology, Jaipur`;

export default function InterviewEmailTemplate() {
  const [candidates, setCandidates] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [subject,    setSubject]     = useState("Interview Invitation — Assistant Professor Position | LNMIIT");
  const [body,       setBody]        = useState(DEFAULT_TEMPLATE());
  const [preview,    setPreview]     = useState(false);
  const [sending,    setSending]     = useState(false);
  const [sent,       setSent]        = useState({});

  useEffect(() => {
    API.get("/hod/candidates/2025-26")
      .then(res => setCandidates(res.data))
      .catch(console.error);
  }, []);

  const handleSelectCandidate = (c) => {
    setSelected(c);
    setBody(DEFAULT_TEMPLATE({ name: c.fullName }));
    setSent(s => ({ ...s }));
  };

  const handleSend = async () => {
    if (!selected) return alert("Please select a candidate first");
    if (!window.confirm(`Send interview invitation to ${selected.fullName} (${selected.email})?`)) return;

    try {
      setSending(true);
      await API.post("/email/send-interview-invite", {
        candidateId: selected._id,
        subject,
        body,
      });
      setSent(s => ({ ...s, [selected._id]: true }));
      alert(`Email sent to ${selected.email}`);
    } catch {
      alert("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Interview Invitation Email</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a candidate, edit the email, preview and send.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* ── Candidate list ── */}
        <div className="bg-white rounded-xl shadow border border-gray-100">
          <div className="px-4 py-3 border-b font-medium text-sm text-gray-700">
            Select Candidate
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {candidates.length === 0 && (
              <p className="p-4 text-sm text-gray-400 text-center">No candidates found</p>
            )}
            {candidates.map(c => (
              <div key={c._id}
                onClick={() => handleSelectCandidate(c)}
                className={`px-4 py-3 cursor-pointer border-b hover:bg-gray-50 transition ${
                  selected?._id === c._id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                }`}>
                <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                {sent[c._id] && (
                  <span className="text-xs text-green-600 font-medium">✔ Sent</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Email editor + preview ── */}
        <div className="col-span-2 bg-white rounded-xl shadow border border-gray-100 flex flex-col">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(false)}
                className={`text-sm px-4 py-1.5 rounded-lg border transition ${
                  !preview ? "bg-gray-800 text-white border-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}>
                Edit
              </button>
              <button
                onClick={() => setPreview(true)}
                className={`text-sm px-4 py-1.5 rounded-lg border transition ${
                  preview ? "bg-gray-800 text-white border-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}>
                Preview
              </button>
            </div>

            {selected && (
              <div className="text-xs text-gray-500">
                To: <span className="font-medium text-gray-700">{selected.email}</span>
              </div>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col gap-4">

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Subject</label>
              {preview ? (
                <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{subject}</p>
              ) : (
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              )}
            </div>

            {/* Body */}
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Email Body</label>
              {preview ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[360px] font-mono">
                  {body}
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={18}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <button
                onClick={() => {
                  if (selected) setBody(DEFAULT_TEMPLATE({ name: selected.fullName }));
                  else setBody(DEFAULT_TEMPLATE());
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline">
                Reset to default
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([`Subject: ${subject}\n\n${body}`], { type:"text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "interview_invitation.txt"; a.click();
                  }}
                  className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
                  Download
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !selected}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}