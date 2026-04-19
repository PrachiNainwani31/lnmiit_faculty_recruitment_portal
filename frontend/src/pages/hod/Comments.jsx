import { useEffect, useState } from "react";
import API from "../../api/api";
export default function HodComments() {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [myDept, setMyDept] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setMyDept(user.department || "");
  }, []);

  const fetchComments = async () => {
  const res = await API.get("/comments");
  setComments(res.data);
};

  useEffect(() => {    
    fetchComments();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    await API.post("/comments", { message });
    setMessage("");
    fetchComments();
  };

  const senderLabel = (c) => {
  if (c.fromRole === "HOD") {
    const dept = (c.fromDepartment || myDept || "").trim();
    return dept ? `${dept} HOD` : "HOD";
  }
  return c.fromRole;
};

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-gray-800">Comments (DOFA ↔ HOD)</h2>
      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm">
        <span className="text-indigo-700">
          Ready to submit everything to DoFA?
        </span>
        <a
          href="/hod"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
        >
          Go to Dashboard → Submit
        </a>
      </div>

      <div className="bg-white rounded-xl shadow p-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No comments yet.</p>
        )}
        {comments.map((c) => {

          return (
            <div
              key={c.id}
              className={`p-3 rounded-lg border ${
                c.fromRole === "HOD"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <p className="text-xs font-semibold mb-1">
                {senderLabel(c)} · {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="text-sm">{c.message}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your reply to DOFA..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}