export default function CandidatesTable({ candidates }) {
  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Qualification</th>
            <th className="p-2 border">Specialization</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr key={i}>
              <td className="p-2 border">{c.name}</td>
              <td className="p-2 border">{c.email}</td>
              <td className="p-2 border">{c.qualification}</td>
              <td className="p-2 border">{c.specialization}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

