import { useEffect, useRef, useState } from "react";
import API from "../../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TravelTickets() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const fileRefs = useRef({});

  const load = () => {
    API.get("/expert-travel")
      .then(res => setItems(res.data.filter(i => i.travel?.quote?.status === "APPROVED")))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (expertId) => {
    const file = fileRefs.current[expertId]?.files[0];
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("ticket", file);

    try {
      setUploading(expertId);
      await API.post(`/expert-travel/ticket/${expertId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Ticket uploaded successfully");
      load();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  if (items.length === 0) return (
    <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
      <p className="text-4xl mb-3">🎫</p>
      <p>No approved quotes yet. Tickets can be uploaded once a quote is approved.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Tickets</h2>

      {items.map(({ expert, travel }) => (
        <div key={expert._id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-800">{expert.fullName}</p>
              <p className="text-xs text-gray-400">{expert.institute} · {travel.modeOfTravel}</p>
            </div>
            {travel.ticketPath ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
                Uploaded
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                Pending
              </span>
            )}
          </div>

          {travel.ticketPath ? (
            <div className="flex items-center gap-3">
              <a
                href={`${BASE}/${travel.ticketPath}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                📄 View Ticket
              </a>
              <span className="text-xs text-gray-400">
                Uploaded on {new Date(travel.ticketUploadedAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,image/*"
                ref={el => fileRefs.current[expert._id] = el}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 flex-1"
              />
              <button
                onClick={() => handleUpload(expert._id)}
                disabled={uploading === expert._id}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {uploading === expert._id ? "Uploading..." : "Upload Ticket"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}