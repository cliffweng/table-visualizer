import { useState, useCallback } from 'react';
import { parseHtmlTables, parseCsv } from '../utils/parsers';

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export function useTableFetcher() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTables = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    setTables([]);

    try {
      // Validate URL
      const parsedUrl = new URL(url);

      // Determine if it's likely a CSV file
      const isCsv = parsedUrl.pathname.toLowerCase().endsWith('.csv') ||
        url.includes('format=csv') ||
        url.includes('output=csv');

      let content = null;
      let lastError = null;

      // Try direct fetch first (works for same-origin or CORS-enabled URLs)
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          content = await response.text();
        }
      } catch (e) {
        // Direct fetch failed, try proxies
      }

      // Try CORS proxies if direct fetch failed
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
            lastError = e;
          }
        }
      }

      if (!content) {
        throw new Error(lastError?.message || 'Failed to fetch URL. The URL may be inaccessible or blocked.');
      }

      // Parse content
      let parsedTables;
      if (isCsv || !content.trim().startsWith('<')) {
        // Try parsing as CSV
        try {
          parsedTables = parseCsv(content);
        } catch {
          // If CSV parsing fails, try HTML
          parsedTables = parseHtmlTables(content);
        }
      } else {
        // Parse as HTML
        parsedTables = parseHtmlTables(content);
      }

      if (parsedTables.length === 0) {
        throw new Error('No tables found at this URL');
      }

      setTables(parsedTables);
    } catch (e) {
      setError(e.message || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTables = useCallback(() => {
    setTables([]);
    setError(null);
  }, []);

  return {
    tables,
    loading,
    error,
    fetchTables,
    clearTables,
  };
}
