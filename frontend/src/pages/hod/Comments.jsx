import { useEffect, useState } from "react";
import API from "../../api/api";

export default function HodComments() {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments (DOFA ↔ HOD)</h2>

      <div className="bg-white p-6 rounded shadow space-y-4 max-h-96 overflow-y-auto">
        {comments.map((c) => (
          <div
            key={c._id}
            className={`p-3 rounded ${
              c.fromRole === "HOD"
                ? "bg-blue-50 text-blue-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <p className="text-xs font-semibold">
              {c.fromRole} • {new Date(c.createdAt).toLocaleString()}
            </p>
            <p>{c.message}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply to DOFA..."
          className="flex-1 border p-2 rounded"
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
