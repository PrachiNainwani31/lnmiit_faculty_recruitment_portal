export default function HeaderBar({ title }) {
  return (
    <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">Home / {title}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-500">🔔</span>
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
            HD
          </div>
          <div>
            <p className="text-sm font-medium">Dr. HOD Name</p>
            <p className="text-xs text-gray-500">Head of Department</p>
          </div>
        </div>
        <button className="bg-blue-500 text-white px-3 py-1 rounded">Logout</button>
      </div>
    </div>
  );
}
