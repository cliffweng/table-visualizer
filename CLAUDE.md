# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite with HMR)
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture

This is a React application for fetching HTML tables or CSV data from URLs, joining multiple tables, and visualizing them with Chart.js.

### Data Flow

1. **URL Input** (`MultiUrlInput`) - User adds up to 3 URLs
2. **Table Fetching** (`App.jsx:fetchTablesFromUrl`) - Fetches via CORS proxies (allorigins.win, corsproxy.io)
3. **Parsing** (`utils/parsers.js`) - HTML tables via DOMParser, CSV via PapaParse
4. **Table Selection** (`TableSelector`) - User selects tables from each source
5. **Table Joining** (`JoinPanel` + `utils/joinTables.js`) - Auto-detects join keys (country, ID, zip, etc.) and performs inner/left joins
6. **Visualization** (`ChartPanel` + `hooks/useChartData.js`) - Chart.js integration with multiple chart types

### Key Modules

- **`utils/parsers.js`** - `parseHtmlTables()`, `parseCsv()`, `detectColumnTypes()`, `parseNumericValue()`
- **`utils/joinTables.js`** - `findBestJoinKeys()` auto-detects join columns by pattern matching, `joinTables()` and `leftJoinTables()` perform the actual joins with value normalization
- **`utils/chartHelpers.js`** - `buildChartData()` and `buildChartOptions()` for Chart.js, supports bar/line/pie/scatter/bubble/histogram/boxplot
- **`hooks/useChartData.js`** - Memoized chart data preparation with column type detection

### Join Key Detection

The join system (`utils/joinTables.js:3-26`) uses regex patterns to identify common join keys:
- Country/nation/territory columns (highest priority)
- ISO codes, zip codes, state/city
- Generic ID and name columns

Values are normalized (lowercase, remove "the", parentheticals, special chars) for fuzzy matching.

## Tech Stack

- React 19 + Vite 7
- Tailwind CSS 4 (via @tailwindcss/vite plugin)
- Chart.js + react-chartjs-2
- PapaParse for CSV parsing
