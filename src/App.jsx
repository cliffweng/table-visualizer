import { useState, useCallback } from 'react';
import { MultiUrlInput } from './components/MultiUrlInput';
import { TableSelector } from './components/TableSelector';
import { JoinPanel } from './components/JoinPanel';
import { TablePreview } from './components/TablePreview';
import { ChartPanel } from './components/ChartPanel';
import { ExportButton } from './components/ExportButton';
import { parseHtmlTables, parseCsv } from './utils/parsers';

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function App() {
  const [sources, setSources] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [joinedTable, setJoinedTable] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch tables from a URL
  const fetchTablesFromUrl = async (url) => {
    try {
      const parsedUrl = new URL(url);
      const isCsv = parsedUrl.pathname.toLowerCase().endsWith('.csv') ||
        url.includes('format=csv') ||
        url.includes('output=csv');

      let content = null;

      // Try direct fetch first
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          content = await response.text();
        }
      } catch (e) {
        // Direct fetch failed
      }

      // Try CORS proxies
      if (!content) {
        for (const proxyFn of CORS_PROXIES) {
          try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl);
            if (response.ok) {
              content = await response.text();
              break;
            }
          } catch (e) {
            // Proxy failed
          }
        }
      }

      if (!content) {
        throw new Error('Failed to fetch URL');
      }

      let tables;
      if (isCsv || !content.trim().startsWith('<')) {
        try {
          tables = parseCsv(content);
        } catch {
          tables = parseHtmlTables(content);
        }
      } else {
        tables = parseHtmlTables(content);
      }

      if (tables.length === 0) {
        throw new Error('No tables found');
      }

      return { tables, error: null };
    } catch (e) {
      return { tables: [], error: e.message };
    }
  };

  // Add a new source
  const handleAddSource = useCallback(async (url) => {
    const sourceId = `source-${Date.now()}`;

    // Add source in loading state
    setSources(prev => [...prev, {
      id: sourceId,
      url,
      tables: [],
      loading: true,
      error: null,
    }]);

    setLoading(true);
    const result = await fetchTablesFromUrl(url);
    setLoading(false);

    // Update source with results
    setSources(prev => prev.map(s =>
      s.id === sourceId
        ? {
            ...s,
            tables: result.tables.map(t => ({ ...t, sourceId })),
            loading: false,
            error: result.error,
          }
        : s
    ));
  }, []);

  // Remove a source
  const handleRemoveSource = useCallback((sourceId) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
    setSelectedTables(prev => prev.filter(t => t.sourceId !== sourceId));
    setJoinedTable(null);
  }, []);

  // Toggle table selection
  const handleToggleTable = useCallback((sourceId, table) => {
    setSelectedTables(prev => {
      const existing = prev.find(t => t.sourceId === sourceId && t.tableId === table.id);
      if (existing) {
        return prev.filter(t => !(t.sourceId === sourceId && t.tableId === table.id));
      }
      return [...prev, { sourceId, tableId: table.id, table: { ...table, sourceId } }];
    });
    setJoinedTable(null);
  }, []);

  // Get selected table objects
  const getSelectedTableObjects = () => {
    return selectedTables.map(st => st.table);
  };

  // Handle join completion
  const handleJoinComplete = (result) => {
    setJoinedTable(result);
  };

  // Clear all
  const handleClearAll = () => {
    setSources([]);
    setSelectedTables([]);
    setJoinedTable(null);
  };

  const selectedTableObjects = getSelectedTableObjects();
  const displayTable = joinedTable || (selectedTableObjects.length === 1 ? selectedTableObjects[0] : null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Multi-Table Scanner & Visualizer
          </h1>
          <p className="mt-1 text-gray-600">
            Fetch tables from up to 3 URLs, join them together, and visualize with charts
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Add Data Sources */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Step 1: Add Data Sources</h2>
              <p className="text-sm text-gray-500">Add up to 3 URLs containing tables or CSV files</p>
            </div>
            {sources.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <MultiUrlInput
            sources={sources}
            onAddSource={handleAddSource}
            onRemoveSource={handleRemoveSource}
            loading={loading}
          />
        </div>

        {/* Step 2: Select Tables */}
        {sources.some(s => s.tables.length > 0) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Select Tables</h2>
            <TableSelector
              sources={sources}
              selectedTables={selectedTables}
              onToggleTable={handleToggleTable}
            />
          </div>
        )}

        {/* Step 3: Configure Join (if multiple tables selected) */}
        {selectedTableObjects.length >= 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Configure Join</h2>
            <JoinPanel
              tables={selectedTableObjects}
              onJoinComplete={handleJoinComplete}
            />
          </div>
        )}

        {/* Results Section */}
        {displayTable && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {joinedTable ? 'Joined Table' : 'Selected Table'}
              </h2>
              <ExportButton table={displayTable} />
            </div>

            <TablePreview table={displayTable} />
            <ChartPanel table={displayTable} />
          </div>
        )}

        {/* Empty State */}
        {sources.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No data sources added</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Add up to 3 URLs containing tables. You can then select tables from each source and join them by common columns like country, zip code, or ID.
            </p>
            <div className="mt-6 text-sm text-gray-400">
              <p className="font-medium mb-2">Example workflow:</p>
              <ol className="space-y-1 text-left max-w-md mx-auto">
                <li>1. Add a Wikipedia page with GDP data</li>
                <li>2. Add another page with population data</li>
                <li>3. Select tables from each source</li>
                <li>4. Join by country name (auto-detected)</li>
                <li>5. Visualize GDP vs Population in a scatter plot</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
