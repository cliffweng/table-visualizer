export function TableSelector({ sources, selectedTables, onToggleTable }) {
  const sourcesWithTables = sources.filter(s => s.tables.length > 0);

  if (sourcesWithTables.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-800">
          Select Tables to Join ({selectedTables.length}/3 selected)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select up to 3 tables from your data sources to join together
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {sourcesWithTables.map((source, sourceIndex) => (
          <div key={source.id} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                {sourceIndex + 1}
              </span>
              <span className="text-sm text-gray-600 truncate" title={source.url}>
                {new URL(source.url).hostname}
              </span>
            </div>

            <div className="space-y-2 ml-8">
              {source.tables.map((table) => {
                const isSelected = selectedTables.some(
                  t => t.sourceId === source.id && t.tableId === table.id
                );
                const canSelect = selectedTables.length < 3 || isSelected;

                return (
                  <label
                    key={table.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : canSelect
                        ? 'bg-white border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => canSelect && onToggleTable(source.id, table)}
                      disabled={!canSelect}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus-visible:ring-blue-500 focus-visible:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">{table.name}</p>
                      <p className="text-sm text-gray-500">
                        {table.rowCount} rows × {table.columnCount} columns
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {table.headers.slice(0, 5).map((h, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {h}
                          </span>
                        ))}
                        {table.headers.length > 5 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{table.headers.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
