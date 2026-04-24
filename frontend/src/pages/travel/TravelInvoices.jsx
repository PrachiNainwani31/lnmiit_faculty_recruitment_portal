import { useEffect, useRef, useState } from "react";
import API from "../../api/api";

const BASE = import.meta.env.VITE_API_URL;

export default function TravelInvoices() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading, setUploading] = useState(null);
  const fileRefs = useRef({});

  const load = () => {
    API.get("/expert-travel")
      .then(res => setItems(res.data.filter(i => i.travel?.ticketPath)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (expertId) => {
    const file = fileRefs.current[expertId]?.files[0];
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("invoice", file);

    try {
      setUploading(expertId);
      await API.post(`/expert-travel/invoice/${expertId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Invoice uploaded successfully");
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
      <p>No tickets uploaded yet. Invoices can be added after ticket upload.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Invoices</h2>

      {items.map(({ expert, travel }) => (
        <div key={expert.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-gray-800">{expert.fullName}</p>
              <p className="text-xs text-gray-400">{expert.institute} · {travel.modeOfTravel}</p>
            </div>
            {travel.invoicePath ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
                Uploaded
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">
                Pending
              </span>
            )}
          </div>

          {travel.invoicePath ? (
            <div className="flex items-center gap-3">
              <a
                href={`${BASE}/${travel.invoicePath}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                📄 View Invoice
              </a>
              <span className="text-xs text-gray-400">
                Uploaded on {new Date(travel.invoiceUploadedAt).toLocaleDateString("en-GB")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,image/*"
                ref={el => fileRefs.current[expert.id] = el}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 flex-1"
              />
              <button
                onClick={() => handleUpload(expert.id)}
                disabled={uploading === expert.id}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {uploading === expert.id ? "Uploading..." : "Upload Invoice"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}