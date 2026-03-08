import { useState } from "react";

export default function CommentModal({ open, onClose, onSend }) {
  const [text, setText] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h3 className="text-lg font-semibold mb-3">
          Send Comment to HOD
        </h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Enter your comment..."
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSend(text);
              setText("");
            }}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
