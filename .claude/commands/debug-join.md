# Debug Join Issues

Investigate and fix issues with table joining functionality.

## Arguments

- `$ARGUMENTS` - Description of the join issue (optional)

## Instructions

1. Read the join implementation:
   - `src/utils/joinTables.js` - Core join logic and key detection
   - `src/components/JoinPanel.jsx` - Join UI component

2. Understand the join key detection patterns (lines 3-26 in joinTables.js):
   - Country/nation columns have highest priority
   - ISO codes, zip codes, state/city patterns
   - Generic ID and name fallbacks

3. Check value normalization logic that handles:
   - Lowercase conversion
   - Removing "the" prefix
   - Stripping parentheticals and special characters

4. If issue is provided: "$ARGUMENTS"
   - Investigate the specific problem
   - Add console logging if needed for debugging
   - Propose and implement a fix

5. Verify the fix:

```bash
npm run lint && npm run build
```
