import { useState, useMemo } from 'react';
import { UrlInput } from './components/UrlInput';
import { TableList } from './components/TableList';
import { TablePreview } from './components/TablePreview';
import { ChartPanel } from './components/ChartPanel';
import { ExportButton } from './components/ExportButton';
import { useTableFetcher } from './hooks/useTableFetcher';

function App() {
  const { tables, loading, error, fetchTables, clearTables } = useTableFetcher();
  const [selectedTableId, setSelectedTableId] = useState(null);

  const selectedTable = useMemo(() => {
    return tables.find(t => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  // Auto-select first table when tables are loaded
  useMemo(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  const handleFetch = (url) => {
    setSelectedTableId(null);
    fetchTables(url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Table Scanner & Visualizer
          </h1>
          <p className="mt-1 text-gray-600">
            Fetch tables from any URL, visualize with charts, and export as CSV
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* URL Input */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <UrlInput onFetch={handleFetch} loading={loading} />

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Main Content */}
        {tables.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Table List */}
            <div className="lg:col-span-1 space-y-4">
              <TableList
                tables={tables}
                selectedId={selectedTableId}
                onSelect={setSelectedTableId}
              />

              {selectedTable && (
                <ExportButton table={selectedTable} />
              )}

              <button
                onClick={() => {
                  clearTables();
                  setSelectedTableId(null);
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {selectedTable && (
                <>
                  <TablePreview table={selectedTable} />
                  <ChartPanel table={selectedTable} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tables.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tables loaded</h3>
            <p className="mt-2 text-gray-500">
              Enter a URL above to scan for tables. Supports HTML pages with tables and direct CSV file links.
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p className="font-medium mb-2">Example URLs to try:</p>
              <ul className="space-y-1">
                <li>Wikipedia pages with data tables</li>
                <li>Government data portals (.csv files)</li>
                <li>Any webpage with HTML tables</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
