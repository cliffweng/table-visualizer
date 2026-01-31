import { useState, useEffect, useMemo } from 'react';
import { findBestJoinKeys, joinTables, leftJoinTables } from '../utils/joinTables';

export function JoinPanel({ tables, onJoinComplete }) {
  const [joinType, setJoinType] = useState('inner');
  const [joinColumns, setJoinColumns] = useState([]);
  const [autoDetected, setAutoDetected] = useState(null);

  // Auto-detect join keys when tables change
  useEffect(() => {
    if (tables.length >= 2) {
      const suggestions = findBestJoinKeys(tables);
      setAutoDetected(suggestions);

      // Auto-select best suggestion
      if (suggestions.length > 0) {
        setJoinColumns(suggestions[0].columns);
      }
    } else {
      setAutoDetected(null);
      setJoinColumns([]);
    }
  }, [tables]);

  const handleColumnChange = (tableId, column) => {
    setJoinColumns(prev => {
      const filtered = prev.filter(c => c.tableId !== tableId);
      return [...filtered, { tableId, column }];
    });
  };

  const canJoin = useMemo(() => {
    return tables.length >= 2 && joinColumns.length === tables.length;
  }, [tables, joinColumns]);

  const handleJoin = () => {
    if (!canJoin) return;

    const joinFn = joinType === 'left' ? leftJoinTables : joinTables;
    const result = joinFn(tables, { columns: joinColumns });

    if (result) {
      onJoinComplete(result);
    }
  };

  if (tables.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Select Tables to Join</h3>
        <p className="mt-1 text-gray-500">
          Select at least 2 tables from the list above to configure a join
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-800">Configure Join</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select matching columns from each table to join on
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Auto-detected suggestion */}
        {autoDetected && autoDetected.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Auto-detected: Join by {autoDetected[0].type}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {autoDetected[0].overlapCount} matching records found ({Math.round(autoDetected[0].overlapScore * 100)}% overlap)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Join type selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Join Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="inner"
                checked={joinType === 'inner'}
                onChange={(e) => setJoinType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Inner Join</span>
              <span className="text-xs text-gray-500">(only matching rows)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="left"
                checked={joinType === 'left'}
                onChange={(e) => setJoinType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Left Join</span>
              <span className="text-xs text-gray-500">(keep all from first table)</span>
            </label>
          </div>
        </div>

        {/* Column selection for each table */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Join Columns
          </label>
          {tables.map((table, index) => {
            const selectedColumn = joinColumns.find(c => c.tableId === table.id)?.column || '';

            return (
              <div key={table.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-600 w-32 truncate flex-shrink-0" title={table.name}>
                  {table.name}
                </span>
                <select
                  value={selectedColumn}
                  onChange={(e) => handleColumnChange(table.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
                >
                  <option value="">Select column...</option>
                  {table.headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={!canJoin}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          {canJoin ? 'Join Tables' : 'Select join columns for all tables'}
        </button>
      </div>
    </div>
  );
}
