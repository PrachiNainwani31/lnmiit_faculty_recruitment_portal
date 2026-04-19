import { useState, useCallback } from "react";

let _setToasts = null;

export function showToast(msg, type = "info") {
  _setToasts?.(prev => [...prev, { id: Date.now(), msg, type }]);
}

export function showConfirm(msg) {
  return new Promise(resolve => {
    _setToasts?.(prev => [...prev, { id: Date.now(), msg, type: "confirm", resolve }]);
  });
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const dismiss = (id, val) => {
    setToasts(prev => {
      const t = prev.find(x => x.id === id);
      t?.resolve?.(val);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-start pt-8 gap-3 px-4">
      {toasts.map(t => (
        <div key={t.id}
          className={`pointer-events-auto w-full max-w-sm rounded-xl shadow-xl border px-5 py-4
            ${t.type === "confirm" ? "bg-white border-gray-200"
            : t.type === "error"   ? "bg-red-50 border-red-200 text-red-800"
            : "bg-white border-gray-200 text-gray-800"}`}
        >
          <p className="text-sm mb-3">{t.msg}</p>
          {t.type === "confirm" ? (
            <div className="flex justify-end gap-2">
              <button onClick={() => dismiss(t.id, false)}
                className="px-4 py-1.5 text-xs rounded-lg border border-gray-300 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => dismiss(t.id, true)}
                className="px-4 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Confirm
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button onClick={() => dismiss(t.id)} className="px-4 py-1.5 text-xs rounded-lg bg-gray-800 text-white">OK</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}