# Add Data Parser

Add support for a new data format to the table fetcher.

## Arguments

- `$ARGUMENTS` - The data format to support (e.g., "json", "xml", "excel")

## Instructions

1. Read the existing parser implementations in:
   - `src/utils/parsers.js` - HTML and CSV parsing logic

2. Add a new parser function for "$ARGUMENTS" format following existing patterns:
   - Create a `parse{Format}()` function
   - Handle column type detection
   - Return data in the standard table format: `{ headers: [], rows: [[]] }`

3. Integrate the new parser in `src/App.jsx`:
   - Add format detection logic in `fetchTablesFromUrl()`
   - Use appropriate content-type or file extension detection

4. Run checks to verify:

```bash
npm run lint && npm run build
```
