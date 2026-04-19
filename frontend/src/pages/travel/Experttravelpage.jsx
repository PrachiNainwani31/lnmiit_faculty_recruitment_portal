// pages/travel/Experttravelpage.jsx
// Shows the same unified detail view seen on the DOFA Office side
// Mirrors the "car arrangement" email format: name, dept, arrival date,
// pickup place, flight no, arrival time, departure date, drop place, departure time, contact
import { useEffect, useState } from "react";
import API from "../../api/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtTime = (t) => t ? t.slice(0,5) : "—";

/* ── Status badge ── */
function Badge({ children, color }) {
  const colors = {
    green:  "bg-green-100 text-green-700 border-green-200",
    amber:  "bg-amber-100 text-amber-700 border-amber-200",
    blue:   "bg-blue-100 text-blue-700 border-blue-200",
    gray:   "bg-gray-100 text-gray-500 border-gray-200",
    violet: "bg-violet-100 text-violet-700 border-violet-200",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

export default function ExpertTravelPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // all | offline | online

  useEffect(() => {
    API.get("/expert-travel")
      .then(res => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm p-6">Loading…</p>;

  const filtered = items.filter(i => {
    if (filter === "offline") return i.travel?.presenceStatus === "Offline";
    if (filter === "online")  return i.travel?.presenceStatus === "Online";
    return true;
  });

  const offline = items.filter(i => i.travel?.presenceStatus === "Offline");
  const online  = items.filter(i => i.travel?.presenceStatus === "Online");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Expert Travel Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Full travel details — pickup, flight, driver, and contact information.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { key:"all",     label:`All (${items.length})`     },
            { key:"offline", label:`Offline (${offline.length})` },
            { key:"online",  label:`Online (${online.length})`  },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-xs px-4 py-2 rounded-lg border font-medium transition ${
                filter === key
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Car Arrangement Table (offline experts) ── */}
      {filter !== "online" && offline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-blue-600 flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Car Arrangement — Offline Experts</p>
            <span className="text-blue-200 text-xs">{offline.length} expert{offline.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Sr","Name","Dept","Mode","Age","Arrival Date","Place to Pick",
                    "Flight/Train No.","Arrival Time","Depart Date","Place to Drop",
                    "Return Flight/Train","Depart Time","Contact","Driver","Driver Contact"
                  ].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offline.map(({ expert, travel }, i) => {
                  const t  = travel || {};
                  const tr = t.traveller || {};
                  const pd = t.pickupDrop || {};
                  return (
                    <tr key={expert.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{expert.fullName}</td>
                      <td className="px-3 py-3 text-gray-600">{expert.uploadedBy?.department || expert.department}</td>
                      <td className="px-3 py-3">
                        <Badge color={t.modeOfTravel === "Air" ? "blue" : t.modeOfTravel === "Rail" ? "violet" : "gray"}>
                          {t.modeOfTravel || "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{tr.age || "—"}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDate(tr.onwardFrom)}</td>
                      <td className="px-3 py-3 text-gray-700">{pd.pickupLocation || "—"}</td>
                      <td className="px-3 py-3 font-medium text-indigo-700">{tr.onwardFlightNo || "—"}</td>
                      <td className="px-3 py-3 text-gray-700">{fmtTime(tr.onwardTime)}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDate(tr.returnFrom)}</td>
                      <td className="px-3 py-3 text-gray-700">{pd.dropLocation || "—"}</td>
                      <td className="px-3 py-3 font-medium text-indigo-700">{tr.returnFlightNo || "—"}</td>
                      <td className="px-3 py-3 text-gray-700">{fmtTime(tr.returnTime)}</td>
                      <td className="px-3 py-3 text-gray-600">{t.contactNumber || "—"}</td>
                      <td className="px-3 py-3 font-medium text-gray-800">{pd.driverName || <span className="text-amber-500">Pending</span>}</td>
                      <td className="px-3 py-3 text-gray-600">{pd.driverContact || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── All expert cards ── */}
      <div className="space-y-4">
        {filtered.map(({ expert, travel }) => {
          const t  = travel || {};
          const tr = t.traveller || {};
          const pd = t.pickupDrop || {};
          const q  = t.quote;

          const presColor = { Online:"green", Offline:"blue", Pending:"amber" }[t.presenceStatus] || "gray";

          return (
            <div key={expert.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Expert header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {expert.fullName?.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{expert.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{expert.designation} · {expert.institute}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Badge color={presColor}>{t.presenceStatus || "Pending"}</Badge>
                  {t.confirmed && <Badge color="green">✔ Confirmed</Badge>}
                  {t.modeOfTravel && <Badge color="blue">{t.modeOfTravel}</Badge>}
                  {q?.status === "APPROVED" && <Badge color="green">Quote Approved</Badge>}
                  {q?.status === "PENDING"  && <Badge color="amber">Quote Pending</Badge>}
                </div>
              </div>

              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                {/* Contact */}
                <div>
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Contact</p>
                  <p className="font-medium text-gray-800">{t.contactNumber || "—"}</p>
                </div>

                {/* Traveller */}
                {tr.name && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Traveller</p>
                    <p className="font-medium text-gray-800">{tr.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tr.gender}{tr.age ? ` · Age: ${tr.age}` : ""}{tr.preferredSeat ? ` · ${tr.preferredSeat}` : ""}
                    </p>
                  </div>
                )}

                {/* Onward journey */}
                {tr.onwardFrom && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Arrival (Onward)</p>
                    <p className="font-medium text-gray-800">{fmtDate(tr.onwardFrom)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtTime(tr.onwardTime)}</p>
                    {tr.onwardFlightNo && (
                      <p className="text-xs font-semibold text-indigo-700 mt-0.5">✈ {tr.onwardFlightNo}</p>
                    )}
                  </div>
                )}

                {/* Return journey */}
                {tr.returnFrom && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Departure (Return)</p>
                    <p className="font-medium text-gray-800">{fmtDate(tr.returnFrom)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtTime(tr.returnTime)}</p>
                    {tr.returnFlightNo && (
                      <p className="text-xs font-semibold text-indigo-700 mt-0.5">✈ {tr.returnFlightNo}</p>
                    )}
                  </div>
                )}

                {/* Pickup */}
                {pd.pickupLocation && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Pickup</p>
                    <p className="font-medium text-gray-800">{pd.pickupLocation}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pd.pickupTime}</p>
                  </div>
                )}

                {/* Drop */}
                {pd.dropLocation && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Drop</p>
                    <p className="font-medium text-gray-800">{pd.dropLocation}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pd.dropTime}</p>
                  </div>
                )}

                {/* Driver */}
                {pd.driverName ? (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Driver</p>
                    <p className="font-medium text-gray-800">{pd.driverName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pd.driverContact}</p>
                  </div>
                ) : (pd.enteredByDofa && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Driver</p>
                    <p className="text-xs text-amber-600 font-medium">Not yet assigned</p>
                  </div>
                ))}

                {/* Quote */}
                {q && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Quote</p>
                    <p className="font-medium text-gray-800">₹{q.amount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{q.vendor || "—"}</p>
                  </div>
                )}

                {/* Ticket */}
                {t.ticketPath && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Ticket</p>
                    <a href={`${BASE}/${t.ticketPath}`} target="_blank" rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline">📄 View Ticket</a>
                  </div>
                )}

                {/* Online link */}
                {t.presenceStatus === "Online" && t.onlineLink && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Online Link</p>
                    <a href={t.onlineLink} target="_blank" rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all">{t.onlineLink}</a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border p-14 text-center text-gray-400">
          <p className="text-4xl mb-3">✈</p>
          <p>No expert travel details available yet.</p>
        </div>
      )}
    </div>
  );
}