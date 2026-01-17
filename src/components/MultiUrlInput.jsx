import { useState } from 'react';

const MAX_SOURCES = 3;

export function MultiUrlInput({ sources, onAddSource, onRemoveSource, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && sources.length < MAX_SOURCES) {
      onAddSource(url.trim());
      setUrl('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Sources */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Data Sources ({sources.length}/{MAX_SOURCES})
          </label>
          {sources.map((source, index) => (
            <div
              key={source.id}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                source.error
                  ? 'bg-red-50 border-red-200'
                  : source.tables.length > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate" title={source.url}>
                  {source.url}
                </p>
                <p className="text-xs text-gray-500">
                  {source.loading
                    ? 'Loading...'
                    : source.error
                    ? source.error
                    : source.tables.length > 0
                    ? `${source.tables.length} table(s) found`
                    : 'Pending'}
                </p>
              </div>
              <button
                onClick={() => onRemoveSource(source.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove source"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New URL */}
      {sources.length < MAX_SOURCES && (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`Enter URL #${sources.length + 1} (HTML page or CSV file)...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              ) : (
                'Add Source'
              )}
            </button>
          </div>
        </form>
      )}

      {sources.length === MAX_SOURCES && (
        <p className="text-sm text-gray-500 text-center">
          Maximum {MAX_SOURCES} sources reached
        </p>
      )}
    </div>
  );
}
