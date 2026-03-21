import { useEffect, useState, useRef } from "react";
import API from "../../api/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300";

function Step({ num, label, status, children }) {
  const [open, setOpen] = useState(status === "active");
  const color = status === "done"   ? "bg-green-100 text-green-700 border-green-300"
              : status === "active" ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200";
  return (
    <div className="flex gap-3 pb-2">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${color} shrink-0`}>
          {status === "done" ? "✓" : num}
        </div>
        <div className="flex-1 w-px bg-gray-200 mt-1" />
      </div>
      <div className="flex-1 pb-4">
        <div
          className={`flex items-center justify-between cursor-pointer ${status === "pending" ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => status !== "pending" && setOpen(o => !o)}
        >
          <p className={`text-sm font-medium ${status === "done" ? "text-green-700" : status === "active" ? "text-blue-700" : "text-gray-400"}`}>
            {label}
          </p>
          {status !== "pending" && (
            <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
          )}
        </div>
        {open && status !== "pending" && (
          <div className="mt-3">{children}</div>
        )}
      </div>
    </div>
  );
}

function ExpertWorkflow({ item, onRefresh }) {
  const { expert, travel } = item;
  const [open, setOpen] = useState(false);

  const [quote,  setQuote]  = useState({ amount: travel?.quote?.amount || "", vendor: travel?.quote?.vendor || "", remarks: travel?.quote?.remarks || "" });
  const [driver, setDriver] = useState({ driverName: travel?.pickupDrop?.driverName || "", driverContact: travel?.pickupDrop?.driverContact || "" });
  const [savingQ, setSavingQ] = useState(false);
  const [savingD, setSavingD] = useState(false);
  const ticketRef  = useRef();
  const invoiceRef = useRef();
  const [upTicket,  setUpTicket]  = useState(false);
  const [upInvoice, setUpInvoice] = useState(false);

  const qs         = travel?.quote?.status;
  const hasTicket  = !!travel?.ticketPath;
  const hasInvoice = !!travel?.invoicePath;
  const hasPickup  = !!travel?.pickupDrop?.pickupLocation;
  const hasDriver  = !!travel?.pickupDrop?.driverName;
  const mode       = travel?.modeOfTravel;
  const isOwnVehicle = mode === "Own Vehicle";

  const overallBadge =
    isOwnVehicle && hasDriver ? { label: "Complete", cls: "bg-green-100 text-green-700 border-green-200" }
    : isOwnVehicle            ? { label: "Own Vehicle", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" }
    : hasDriver               ? { label: "Complete", cls: "bg-green-100 text-green-700 border-green-200" }
    : hasTicket               ? { label: "Ticket Booked", cls: "bg-teal-100 text-teal-700 border-teal-200" }
    : qs === "APPROVED"       ? { label: "Quote Approved", cls: "bg-green-100 text-green-700 border-green-200" }
    : qs === "PENDING"        ? { label: "Quote Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    : qs === "REJECTED"       ? { label: "Quote Rejected", cls: "bg-red-100 text-red-700 border-red-200" }
    : { label: "Awaiting Quote", cls: "bg-gray-100 text-gray-500 border-gray-200" };

  const submitQuote = async () => {
    if (!quote.amount || !quote.vendor) return alert("Amount and vendor are required");
    setSavingQ(true);
    try {
      await API.post(`/expert-travel/quote/${expert._id}`, quote);
      alert("Quote submitted. DOFA has been notified.");
      onRefresh();
    } catch { alert("Failed"); } finally { setSavingQ(false); }
  };

  const uploadFile = async (type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append(type, file);
    type === "ticket" ? setUpTicket(true) : setUpInvoice(true);
    try {
      await API.post(`/expert-travel/${type}/${expert._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded.`);
      onRefresh();
    } catch { alert("Upload failed"); } finally {
      type === "ticket" ? setUpTicket(false) : setUpInvoice(false);
    }
  };

  const saveDriver = async () => {
    if (!driver.driverName || !driver.driverContact) return alert("Driver name and contact required");
    setSavingD(true);
    try {
      await API.post(`/expert-travel/driver/${expert._id}`, driver);
      alert("Driver info saved. DOFA has been notified.");
      onRefresh();
    } catch { alert("Failed"); } finally { setSavingD(false); }
  };

  const initials = expert.fullName?.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100"
        onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm">{expert.fullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {expert.institute} · {mode || "Mode TBD"}
            {travel?.traveller?.onwardFrom ? ` · ${new Date(travel.traveller.onwardFrom).toLocaleDateString("en-GB")}` : ""}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${overallBadge.cls}`}>{overallBadge.label}</span>
        <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="px-5 py-5">

          {/* Travel details banner — Rail/Air only */}
          {travel?.traveller && !isOwnVehicle && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm mb-5 space-y-0.5">
              <p className="font-medium text-blue-800">Travel Details from DOFA Office</p>
              <p className="text-blue-600 text-xs">
                {travel.traveller.name} · {travel.traveller.gender}
                {travel.traveller.age ? ` · Age ${travel.traveller.age}` : ""}
                {" · "}Meal: {travel.traveller.mealPreference}
                {travel.traveller.preferredSeat ? ` · Seat: ${travel.traveller.preferredSeat}` : ""}
              </p>
              <p className="text-blue-600 text-xs">
                Onward: {travel.traveller.onwardFrom ? new Date(travel.traveller.onwardFrom).toDateString() : "—"} → {travel.traveller.onwardTo ? new Date(travel.traveller.onwardTo).toDateString() : "—"}
              </p>
              <p className="text-blue-600 text-xs">
                Return: {travel.traveller.returnFrom ? new Date(travel.traveller.returnFrom).toDateString() : "—"} → {travel.traveller.returnTo ? new Date(travel.traveller.returnTo).toDateString() : "—"}
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════
              OWN VEHICLE — simplified flow
              Only pickup/drop + driver info needed
          ══════════════════════════════════════ */}
          {isOwnVehicle ? (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
                <p className="font-medium">Own Vehicle — no booking required</p>
                <p className="text-xs mt-1 text-indigo-500">
                  No quote, ticket, or invoice needed. Pickup/drop-off details will appear once entered by DOFA Office.
                </p>
              </div>

              {/* Pickup details from DOFA */}
              <Step num={1} label="Pickup / Drop-off Details (from DOFA Office)"
                status={hasPickup ? "done" : "active"}>
                {hasPickup ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-0.5">
                    <p>Pickup: {travel.pickupDrop.pickupLocation} at {travel.pickupDrop.pickupTime}</p>
                    <p>Drop: {travel.pickupDrop.dropLocation} at {travel.pickupDrop.dropTime}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Waiting for DOFA Office to enter pickup/drop-off details...</p>
                )}
              </Step>

              {/* Driver info */}
              <Step num={2} label="Enter Driver Info"
                status={hasDriver ? "done" : hasPickup ? "active" : "pending"}>
                {hasDriver ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                    Driver: {travel.pickupDrop.driverName} · {travel.pickupDrop.driverContact}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Driver Name</label>
                        <input className={inputCls} placeholder="Full name"
                          value={driver.driverName} onChange={e => setDriver(d => ({ ...d, driverName: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Contact Number</label>
                        <input className={inputCls} placeholder="Phone"
                          value={driver.driverContact} onChange={e => setDriver(d => ({ ...d, driverContact: e.target.value }))} />
                      </div>
                    </div>
                    <button onClick={saveDriver} disabled={savingD}
                      className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition">
                      {savingD ? "Saving..." : "Save Driver Info"}
                    </button>
                  </div>
                )}
              </Step>
            </div>

          ) : (
            /* ══════════════════════════════════════
               RAIL / AIR — full workflow
            ══════════════════════════════════════ */
            <>
              <Step num={1} label="Submit Quote" status={qs ? "done" : "active"}>
                {qs && qs !== "REJECTED" ? (
                  <div className={`rounded-lg px-4 py-3 text-sm border ${
                    qs === "APPROVED" ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    ₹{travel.quote.amount} · {travel.quote.vendor}
                    {qs === "APPROVED" && " · ✔ Approved"}
                    {qs === "PENDING"  && " · Awaiting DOFA approval"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {qs === "REJECTED" && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                        Rejected: {travel?.quote?.rejectionNote || "No reason given"}. Please resubmit.
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Amount (₹)</label>
                        <input className={inputCls} type="number" placeholder="e.g. 4500"
                          value={quote.amount} onChange={e => setQuote(q => ({ ...q, amount: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Vendor / Agency</label>
                        <input className={inputCls} placeholder="Vendor name"
                          value={quote.vendor} onChange={e => setQuote(q => ({ ...q, vendor: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Remarks</label>
                      <input className={inputCls} placeholder="Optional notes"
                        value={quote.remarks} onChange={e => setQuote(q => ({ ...q, remarks: e.target.value }))} />
                    </div>
                    <button onClick={submitQuote} disabled={savingQ}
                      className="bg-[#0c2340] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-60 transition">
                      {savingQ ? "Submitting..." : "Submit Quote → Notify DOFA"}
                    </button>
                  </div>
                )}
              </Step>

              <Step num={2} label="Awaiting DOFA Approval"
                status={qs === "APPROVED" ? "done" : qs === "PENDING" ? "active" : "pending"}>
                <p className="text-sm text-amber-700">Quote is under review by DOFA/ADoFA. You'll be notified once approved.</p>
              </Step>

              <Step num={3} label="Upload Ticket"
                status={hasTicket ? "done" : qs === "APPROVED" ? "active" : "pending"}>
                {hasTicket ? (
                  <a href={`${BASE_URL}/${travel.ticketPath}`} target="_blank" rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline">📄 View Uploaded Ticket</a>
                ) : (
                  <div>
                    <input ref={ticketRef} type="file" accept=".pdf,image/*" className="hidden"
                      onChange={e => uploadFile("ticket", e.target.files[0])} />
                    <button onClick={() => ticketRef.current.click()} disabled={upTicket}
                      className="border border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 w-full text-center disabled:opacity-60">
                      {upTicket ? "Uploading..." : "Click to upload ticket (PDF / image)"}
                    </button>
                  </div>
                )}
              </Step>

              <Step num={4} label="Upload Invoice"
                status={hasInvoice ? "done" : hasTicket ? "active" : "pending"}>
                {hasInvoice ? (
                  <a href={`${BASE_URL}/${travel.invoicePath}`} target="_blank" rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline">📄 View Invoice</a>
                ) : (
                  <div>
                    <input ref={invoiceRef} type="file" accept=".pdf" className="hidden"
                      onChange={e => uploadFile("invoice", e.target.files[0])} />
                    <button onClick={() => invoiceRef.current.click()} disabled={upInvoice}
                      className="border border-dashed border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 w-full text-center disabled:opacity-60">
                      {upInvoice ? "Uploading..." : "Click to upload final invoice (PDF)"}
                    </button>
                  </div>
                )}
              </Step>

              <Step num={5} label="Pickup / Drop-off Details (from DOFA Office)"
                status={hasPickup ? "done" : hasTicket ? "active" : "pending"}>
                {hasPickup ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-0.5">
                    <p>Pickup: {travel.pickupDrop.pickupLocation} at {travel.pickupDrop.pickupTime}</p>
                    <p>Drop: {travel.pickupDrop.dropLocation} at {travel.pickupDrop.dropTime}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Waiting for DOFA Office to enter pickup details...</p>
                )}
              </Step>

              <Step num={6} label="Enter Driver Info"
                status={hasDriver ? "done" : hasPickup ? "active" : "pending"}>
                {hasDriver ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                    Driver: {travel.pickupDrop.driverName} · {travel.pickupDrop.driverContact}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Driver Name</label>
                        <input className={inputCls} placeholder="Full name"
                          value={driver.driverName} onChange={e => setDriver(d => ({ ...d, driverName: e.target.value }))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Contact Number</label>
                        <input className={inputCls} placeholder="Phone"
                          value={driver.driverContact} onChange={e => setDriver(d => ({ ...d, driverContact: e.target.value }))} />
                      </div>
                    </div>
                    <button onClick={saveDriver} disabled={savingD}
                      className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60 transition">
                      {savingD ? "Saving..." : "Save Driver Info"}
                    </button>
                  </div>
                )}
              </Step>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExpertTravelPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    API.get("/expert-travel")
      .then(res => setItems(res.data.filter(i => i.travel?.presenceStatus === "Offline")))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Expert Travel Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage quotes, tickets, and logistics for each offline expert.</p>
      </div>
      {items.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          No offline experts assigned yet.
        </div>
      )}
      {items.map(item => (
        <ExpertWorkflow key={item.expert._id} item={item} onRefresh={load} />
      ))}
    </div>
  );
}