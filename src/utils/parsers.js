import Papa from 'papaparse';

export function parseHtmlTables(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  return Array.from(tables).map((table, index) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return null;

    // Try to get headers from thead or first row
    let headers = [];
    const thead = table.querySelector('thead');
    if (thead) {
      const headerRow = thead.querySelector('tr');
      if (headerRow) {
        headers = Array.from(headerRow.querySelectorAll('th, td')).map(
          cell => cell.textContent.trim()
        );
      }
    }

    // Get body rows
    const tbody = table.querySelector('tbody') || table;
    let bodyRows = Array.from(tbody.querySelectorAll('tr'));

    // If no thead, use first row as headers if it contains th elements
    if (headers.length === 0 && bodyRows.length > 0) {
      const firstRow = bodyRows[0];
      const ths = firstRow.querySelectorAll('th');
      if (ths.length > 0) {
        headers = Array.from(ths).map(th => th.textContent.trim());
        bodyRows = bodyRows.slice(1);
      } else {
        // Use first row as headers anyway
        headers = Array.from(firstRow.querySelectorAll('td')).map(
          td => td.textContent.trim()
        );
        bodyRows = bodyRows.slice(1);
      }
    }

    // Parse data rows
    const data = bodyRows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowData = {};
      cells.forEach((cell, i) => {
        const header = headers[i] || `Column ${i + 1}`;
        rowData[header] = cell.textContent.trim();
      });
      return rowData;
    }).filter(row => Object.keys(row).length > 0);

    // Try to get table caption or generate name
    const caption = table.querySelector('caption');
    const name = caption
      ? caption.textContent.trim()
      : `Table ${index + 1}`;

    return {
      id: `table-${index}`,
      name,
      headers,
      data,
      rowCount: data.length,
      columnCount: headers.length,
    };
  }).filter(t => t !== null && t.data.length > 0);
}

export function parseCsv(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  const headers = result.meta.fields || [];

  return [{
    id: 'csv-0',
    name: 'CSV Data',
    headers,
    data: result.data,
    rowCount: result.data.length,
    columnCount: headers.length,
  }];
}

export function detectColumnTypes(table) {
  const types = {};

  table.headers.forEach(header => {
    const values = table.data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');

    if (values.length === 0) {
      types[header] = 'empty';
      return;
    }

    // Check if all values are numeric
    const numericCount = values.filter(v => {
      if (typeof v === 'number') return true;
      if (typeof v === 'string') {
        const parsed = parseFloat(v.replace(/,/g, ''));
        return !isNaN(parsed);
      }
      return false;
    }).length;

    types[header] = numericCount / values.length > 0.8 ? 'numeric' : 'categorical';
  });

  return types;
}

export function parseNumericValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/\$/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}
