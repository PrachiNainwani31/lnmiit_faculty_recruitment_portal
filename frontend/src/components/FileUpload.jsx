import { useState, useEffect } from "react";

export default function FileUpload({ label, file, onUpload }) {

  const [currentFile, setCurrentFile] = useState(file);

  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  const handleChange = (e) => {

    const selected = e.target.files[0];

    if (!selected) return;

    setCurrentFile(selected);

    if (onUpload) {
      onUpload(selected);
    }

  };

  const removeFile = () => {
    setCurrentFile(null);
  };

  return (
    <div className="border-2 border-dashed p-6 text-center">

      <p className="mb-2">{label}</p>

      {!currentFile ? (

        <label className="cursor-pointer">

          <input type="file" hidden onChange={handleChange} />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-red-500">

            <p className="text-gray-600 font-medium">
              Click to Upload
            </p>

            <p className="text-xs text-gray-400">
              PDF / DOC / DOCX • Max 4MB
            </p>

          </div>

        </label>

      ) : (

        <div className="flex items-center justify-between border p-3 rounded">

          <p className="text-blue-600 font-medium">
            📄 {typeof currentFile === "string"
                ? currentFile.split(/[/\\]/).pop()
                : currentFile.name}
          </p>

          <button
            onClick={removeFile}
            className="text-red-600 font-bold"
          >
            ✕
          </button>

        </div>

      )}

    </div>
  );
}