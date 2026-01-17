// Common join key patterns for auto-detection
const JOIN_KEY_PATTERNS = [
  // Country identifiers
  { pattern: /^country$/i, type: 'country', priority: 10 },
  { pattern: /^country.*(name|code)?$/i, type: 'country', priority: 9 },
  { pattern: /^nation$/i, type: 'country', priority: 9 },
  { pattern: /^(territory|region)$/i, type: 'country', priority: 8 },

  // Location identifiers
  { pattern: /^(state|province)$/i, type: 'state', priority: 8 },
  { pattern: /^city$/i, type: 'city', priority: 7 },
  { pattern: /^(zip|postal).*(code)?$/i, type: 'zip', priority: 9 },
  { pattern: /^zip$/i, type: 'zip', priority: 9 },

  // Standard codes
  { pattern: /^iso.*code$/i, type: 'iso', priority: 10 },
  { pattern: /^(alpha.?2|alpha.?3)$/i, type: 'iso', priority: 10 },
  { pattern: /^code$/i, type: 'code', priority: 6 },

  // IDs
  { pattern: /^id$/i, type: 'id', priority: 5 },
  { pattern: /.*_id$/i, type: 'id', priority: 4 },

  // Names
  { pattern: /^name$/i, type: 'name', priority: 3 },
];

// Normalize value for comparison
function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  let str = String(value).toLowerCase().trim();

  // Remove common prefixes/suffixes
  str = str.replace(/^the\s+/i, '');
  str = str.replace(/\s*\([^)]*\)\s*/g, ''); // Remove parenthetical content
  str = str.replace(/[^\w\s]/g, ''); // Remove special characters
  str = str.replace(/\s+/g, ' '); // Normalize spaces

  return str;
}

// Detect potential join keys in a table
export function detectJoinKeys(table) {
  const candidates = [];

  for (const header of table.headers) {
    for (const pattern of JOIN_KEY_PATTERNS) {
      if (pattern.pattern.test(header)) {
        // Calculate uniqueness ratio
        const values = table.data.map(row => normalizeValue(row[header]));
        const uniqueValues = new Set(values.filter(v => v !== ''));
        const uniqueRatio = uniqueValues.size / Math.max(values.length, 1);

        candidates.push({
          column: header,
          type: pattern.type,
          priority: pattern.priority,
          uniqueRatio,
          uniqueCount: uniqueValues.size,
        });
        break;
      }
    }
  }

  // Sort by priority and uniqueness
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.uniqueRatio - a.uniqueRatio;
  });

  return candidates;
}

// Find best matching join keys between tables
export function findBestJoinKeys(tables) {
  if (tables.length < 2) return [];

  const allCandidates = tables.map(t => ({
    tableId: t.id,
    tableName: t.name,
    candidates: detectJoinKeys(t),
  }));

  const suggestions = [];

  // Find matching types across tables
  for (const candidate1 of allCandidates[0].candidates) {
    const matchingColumns = [{ tableId: allCandidates[0].tableId, column: candidate1.column }];

    for (let i = 1; i < allCandidates.length; i++) {
      const match = allCandidates[i].candidates.find(c => c.type === candidate1.type);
      if (match) {
        matchingColumns.push({ tableId: allCandidates[i].tableId, column: match.column });
      }
    }

    if (matchingColumns.length === tables.length) {
      // Calculate overlap score
      const overlap = calculateOverlap(tables, matchingColumns);

      suggestions.push({
        type: candidate1.type,
        columns: matchingColumns,
        priority: candidate1.priority,
        overlapScore: overlap.score,
        overlapCount: overlap.count,
      });
    }
  }

  // Sort by overlap score and priority
  suggestions.sort((a, b) => {
    if (b.overlapScore !== a.overlapScore) return b.overlapScore - a.overlapScore;
    return b.priority - a.priority;
  });

  return suggestions;
}

// Calculate overlap between tables on given columns
function calculateOverlap(tables, columns) {
  const valueSets = tables.map((table, i) => {
    const col = columns.find(c => c.tableId === table.id)?.column;
    if (!col) return new Set();
    return new Set(table.data.map(row => normalizeValue(row[col])).filter(v => v !== ''));
  });

  // Find intersection
  let intersection = valueSets[0];
  for (let i = 1; i < valueSets.length; i++) {
    intersection = new Set([...intersection].filter(v => valueSets[i].has(v)));
  }

  const minSize = Math.min(...valueSets.map(s => s.size));

  return {
    count: intersection.size,
    score: minSize > 0 ? intersection.size / minSize : 0,
  };
}

// Perform the actual join
export function joinTables(tables, joinConfig) {
  if (tables.length === 0) return null;
  if (tables.length === 1) {
    return {
      headers: tables[0].headers,
      data: tables[0].data,
      name: tables[0].name,
    };
  }

  const { columns } = joinConfig; // Array of { tableId, column }

  // Build lookup maps for each table
  const lookups = tables.map((table, i) => {
    const colConfig = columns.find(c => c.tableId === table.id);
    if (!colConfig) return new Map();

    const map = new Map();
    for (const row of table.data) {
      const key = normalizeValue(row[colConfig.column]);
      if (key && !map.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  });

  // Use first table as base and join others
  const baseTable = tables[0];
  const baseColumn = columns.find(c => c.tableId === baseTable.id)?.column;

  // Build combined headers (prefix with table index to avoid collisions)
  const combinedHeaders = [];
  const headerMapping = [];

  tables.forEach((table, tableIndex) => {
    table.headers.forEach(header => {
      // Skip duplicate join columns from non-base tables
      const isJoinColumn = columns.find(c => c.tableId === table.id)?.column === header;
      if (tableIndex > 0 && isJoinColumn) return;

      let displayHeader = header;
      // Add suffix for duplicate headers
      const existingCount = combinedHeaders.filter(h => h === header || h.startsWith(`${header} (`)).length;
      if (existingCount > 0) {
        displayHeader = `${header} (${tableIndex + 1})`;
      }

      combinedHeaders.push(displayHeader);
      headerMapping.push({ tableIndex, originalHeader: header, displayHeader });
    });
  });

  // Perform the join
  const joinedData = [];
  const seenKeys = new Set();

  for (const baseRow of baseTable.data) {
    const key = normalizeValue(baseRow[baseColumn]);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);

    // Check if all tables have this key
    const hasAllMatches = lookups.every((lookup, i) => i === 0 || lookup.has(key));
    if (!hasAllMatches) continue;

    // Build combined row
    const combinedRow = {};
    for (const mapping of headerMapping) {
      const sourceRow = mapping.tableIndex === 0
        ? baseRow
        : lookups[mapping.tableIndex].get(key);

      combinedRow[mapping.displayHeader] = sourceRow?.[mapping.originalHeader] ?? null;
    }

    joinedData.push(combinedRow);
  }

  return {
    headers: combinedHeaders,
    data: joinedData,
    name: `Joined: ${tables.map(t => t.name).join(' + ')}`,
    rowCount: joinedData.length,
    columnCount: combinedHeaders.length,
    id: 'joined-table',
  };
}

// Left join variant - keeps all rows from first table
export function leftJoinTables(tables, joinConfig) {
  if (tables.length === 0) return null;
  if (tables.length === 1) {
    return {
      headers: tables[0].headers,
      data: tables[0].data,
      name: tables[0].name,
    };
  }

  const { columns } = joinConfig;

  // Build lookup maps for non-base tables
  const lookups = tables.slice(1).map((table, i) => {
    const colConfig = columns.find(c => c.tableId === table.id);
    if (!colConfig) return new Map();

    const map = new Map();
    for (const row of table.data) {
      const key = normalizeValue(row[colConfig.column]);
      if (key && !map.has(key)) {
        map.set(key, row);
      }
    }
    return map;
  });

  const baseTable = tables[0];
  const baseColumn = columns.find(c => c.tableId === baseTable.id)?.column;

  // Build combined headers
  const combinedHeaders = [];
  const headerMapping = [];

  tables.forEach((table, tableIndex) => {
    table.headers.forEach(header => {
      const isJoinColumn = columns.find(c => c.tableId === table.id)?.column === header;
      if (tableIndex > 0 && isJoinColumn) return;

      let displayHeader = header;
      const existingCount = combinedHeaders.filter(h => h === header || h.startsWith(`${header} (`)).length;
      if (existingCount > 0) {
        displayHeader = `${header} (${tableIndex + 1})`;
      }

      combinedHeaders.push(displayHeader);
      headerMapping.push({ tableIndex, originalHeader: header, displayHeader });
    });
  });

  // Perform left join
  const joinedData = baseTable.data.map(baseRow => {
    const key = normalizeValue(baseRow[baseColumn]);

    const combinedRow = {};
    for (const mapping of headerMapping) {
      if (mapping.tableIndex === 0) {
        combinedRow[mapping.displayHeader] = baseRow[mapping.originalHeader];
      } else {
        const matchedRow = key ? lookups[mapping.tableIndex - 1].get(key) : null;
        combinedRow[mapping.displayHeader] = matchedRow?.[mapping.originalHeader] ?? null;
      }
    }

    return combinedRow;
  });

  return {
    headers: combinedHeaders,
    data: joinedData,
    name: `Joined: ${tables.map(t => t.name).join(' + ')}`,
    rowCount: joinedData.length,
    columnCount: combinedHeaders.length,
    id: 'joined-table',
  };
}
