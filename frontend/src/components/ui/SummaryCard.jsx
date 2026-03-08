export default function SummaryCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-sm text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-3xl font-bold mt-2 text-gray-800">
        {value}
      </p>
    </div>
  );
}
