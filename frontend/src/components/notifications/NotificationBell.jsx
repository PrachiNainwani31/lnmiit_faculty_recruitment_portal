// import { useState, useEffect } from "react";
// import { getNotifications, markNotificationRead } from "../../api/candidateApi";
// import NotificationPanel from "./NotificationPanel";

// export default function NotificationBell() {
//   const [open, setOpen] = useState(false);
//   const [notifications, setNotifications] = useState([]);

//   const fetchNotifications = async () => {
//     const res = await getNotifications("HOD", "2026-27");
//     setNotifications(res.data);
//   };

//   useEffect(() => {
//     fetchNotifications();
//     const interval = setInterval(fetchNotifications, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   const unreadCount = notifications.filter(n => !n.read).length;

//   const handleRead = async (id) => {
//     await markNotificationRead(id);
//     fetchNotifications();
//   };

//   return (
//     <>
//       <div className="relative cursor-pointer" onClick={() => setOpen(true)}>
//         🔔
//         {unreadCount > 0 && (
//           <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
//             {unreadCount}
//           </span>
//         )}
//       </div>

//       <NotificationPanel
//         open={open}
//         notifications={notifications}
//         onClose={() => setOpen(false)}
//         onRead={handleRead}
//       />
//     </>
//   );
// }
