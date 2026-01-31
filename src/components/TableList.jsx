export function TableList({ tables, selectedId, onSelect }) {
  if (tables.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-800">
          Found {tables.length} table{tables.length !== 1 ? 's' : ''}
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {tables.map((table) => (
          <li key={table.id}>
            <button
              onClick={() => onSelect(table.id)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                selectedId === table.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="font-medium text-gray-800">{table.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {table.rowCount} rows × {table.columnCount} columns
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
