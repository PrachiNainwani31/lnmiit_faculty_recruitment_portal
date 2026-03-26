import { useEffect, useRef, useState } from "react";
import API from "../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function DirectorPage() {
  const [orders,      setOrders]      = useState([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate,   setOrderDate]   = useState("");
  const [file,        setFile]        = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const fileRef = useRef();

  const load = () =>
    API.get("/director/all").then(r => setOrders(r.data)).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!file || !orderNumber || !orderDate)
      return alert("Please fill all fields and upload a PDF");

    const fd = new FormData();
    fd.append("pdf",         file);
    fd.append("orderNumber", orderNumber);
    fd.append("orderDate",   orderDate);

    try {
      setSubmitting(true);
      await API.post("/director/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Office order uploaded and DOFA notified.");
      setFile(null);
      setOrderNumber("");
      setOrderDate("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Upload Interview Panel Office Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload the signed PDF and select the office order date. Once submitted, this entry is locked and cannot be modified. Visible to DOFA, DOFA Office, and HODs.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-sm font-medium text-gray-700">Upload Office Order</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Order Number</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. DIR/2026/045"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Office Order Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">PDF File</label>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden"
            onChange={e => setFile(e.target.files[0])} />
          <div
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-400 bg-gray-50"
            }`}>
            {file ? (
              <>
                <p className="text-green-600 font-medium text-sm">File selected</p>
                <p className="text-green-500 text-sm mt-1">{file.name}</p>
                <p className="text-gray-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm">Click to upload or drag and drop</p>
                <p className="text-gray-400 text-xs mt-1">PDF only · Max 10 MB</p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#6b0f1a] hover:bg-rose-900 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition">
            {submitting ? "Uploading..." : "Submit Office Order"}
          </button>
        </div>
      </div>

      {/* Previous orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-4">Previous Orders</p>
        {orders.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No orders uploaded yet.</p>
        )}
        {orders.map((o, i) => (
          <div key={o.id}
            className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">{o.orderNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(o.orderDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`${BASE}/${o.pdfPath}`}
                target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 hover:underline">
                View PDF
              </a>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                i === 0
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}>
                {i === 0 ? "Latest" : "Archived"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}