/**
 * Shared download utility — converts array of objects to CSV and triggers download
 */
export function downloadAsCSV(data, filename) {
  if (!data || data.length === 0) return alert("No data to download");

  const headers = Object.keys(data[0]);
  const rows    = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      // Escape commas and quotes
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
    }).join(",")
  );

  const csv   = [headers.join(","), ...rows].join("\n");
  const blob  = new Blob([csv], { type: "text/csv" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href      = url;
  a.download  = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * DownloadCSVButton component
 */
export default function DownloadCSVButton({ data, filename, label = "Download CSV" }) {
  return (
    <button
      onClick={() => downloadAsCSV(data, filename)}
      className="flex items-center gap-2 text-sm border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition font-medium"
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      {label}
    </button>
  );
}