import { useEffect, useState } from "react";
import API from "../../api/api";

export default function DofaComments() {
  const [hods,     setHods]     = useState([]);
  const [hodId,    setHodId]    = useState("");
  const [comments, setComments] = useState([]);
  const [message,  setMessage]  = useState("");

  // Load HOD list once
  useEffect(() => {
  API.get("/registration/users")
    .then(res => {
      const all = Array.isArray(res.data) ? res.data : [];
      setHods(all.filter(u => u.role === "HOD" && u.department));
    })
    .catch(console.error);
}, []);

  const fetchComments = async (hid = hodId) => {
    if (!hid) return;
    const res = await API.get(`/comments?hodId=${hid}`);
    setComments(Array.isArray(res.data) ? res.data : []);
  };

  const handleHodChange = (e) => {
    setHodId(e.target.value);
    setComments([]);
    fetchComments(e.target.value);
  };

  const handleSend = async () => {
    if (!message.trim() || !hodId) return;
    await API.post("/comments", { message, targetHodId: hodId });
    setMessage("");
    fetchComments();
  };

  const senderLabel = (c) => {
    if (c.fromRole === "HOD")
      return c.fromDepartment?.trim() ? `${c.fromDepartment.trim()} HOD` : "HOD";
    return c.fromRole;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments (DOFA ↔ HOD)</h2>

      {/* HOD selector */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">
          Select HOD Department
        </label>
        <select
          value={hodId}
          onChange={handleHodChange}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-red-300"
        >
          <option value="">— Select a department —</option>
          {hods.map(h => (
            <option key={h.id} value={h.id}>
              {h.department} ({h.name})
            </option>
          ))}
        </select>
      </div>

      {/* Comments thread */}
      <div className="bg-white p-6 rounded shadow space-y-4 max-h-96 overflow-y-auto">
        {!hodId && (
          <p className="text-gray-400 text-sm text-center py-8">
            Select a department above to view comments
          </p>
        )}
        {hodId && comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No comments yet</p>
        )}
        {comments.map(c => (
          <div key={c.id}
            className={`p-3 rounded ${
              c.fromRole === "DOFA" || c.fromRole === "DOFA_OFFICE"
                ? "bg-red-50 text-red-800"
                : "bg-blue-50 text-blue-800"
            }`}
          >
            <p className="text-xs font-semibold">
              {senderLabel(c)} • {new Date(c.createdAt).toLocaleString()}
            </p>
            <p className="text-sm mt-0.5">{c.message}</p>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="flex gap-4">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={hodId ? "Send comment to HOD..." : "Select a HOD first"}
          disabled={!hodId}
          className="flex-1 border p-2 rounded text-sm disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!hodId || !message.trim()}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}