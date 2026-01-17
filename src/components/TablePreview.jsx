export function TablePreview({ table }) {
  if (!table) return null;

  const maxRows = 100;
  const displayData = table.data.slice(0, maxRows);
  const hasMore = table.data.length > maxRows;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-center">
        <h2 className="font-semibold text-gray-800">{table.name}</h2>
        <span className="text-sm text-gray-500">
          Showing {displayData.length} of {table.data.length} rows
        </span>
      </div>
      <div className="overflow-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {table.headers.map((header, j) => (
                  <td
                    key={j}
                    className="px-4 py-2 text-gray-600 whitespace-nowrap max-w-xs truncate"
                    title={String(row[header] ?? '')}
                  >
                    {row[header] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2 text-center text-sm text-gray-500 border-t border-gray-200">
          ... and {table.data.length - maxRows} more rows
        </div>
      )}
    </div>
  );
}
