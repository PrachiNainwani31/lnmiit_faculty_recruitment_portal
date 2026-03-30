import { markNotificationRead } from "../../api/candidateApi";

export default function NotificationPanel({ open, notifications, onClose, onRead }) {
  return (
    <div className={`fixed top-0 right-0 h-full w-1/4 bg-white shadow-xl z-50 transform transition-transform duration-300
      ${open ? "translate-x-0" : "translate-x-full"}`}>
      
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <button onClick={onClose} className="text-xl">×</button>
      </div>

      <div className="overflow-y-auto h-full">
        {notifications.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No notifications</p>
        )}

        {notifications.map(n => (
          <div
            key={n._id}
            onClick={() => onRead(n._id)}
            className={`p-4 border-b cursor-pointer ${
              n.read ? "bg-white" : "bg-blue-50"
            }`}
          >
            <p className="text-sm">{n.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
