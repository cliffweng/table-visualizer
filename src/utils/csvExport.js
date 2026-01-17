export function tableToCsv(table) {
  const { headers, data } = table;

  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = data.map(row =>
    headers.map(h => escapeCell(row[h])).join(',')
  );

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  return bom + [headerRow, ...dataRows].join('\n');
}

export function downloadCsv(table, filename) {
  const csv = tableToCsv(table);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${table.name.replace(/[^a-z0-9]/gi, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
