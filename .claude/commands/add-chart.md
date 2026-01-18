# Add Chart Type

Add a new chart type to the visualizer.

## Arguments

- `$ARGUMENTS` - The name/type of chart to add (e.g., "radar", "doughnut", "polarArea")

## Instructions

1. Read the existing chart implementation in:
   - `src/components/ChartPanel.jsx` - Chart rendering component
   - `src/utils/chartHelpers.js` - Chart data and options builders
   - `src/hooks/useChartData.js` - Chart data preparation hook

2. Add the new chart type "$ARGUMENTS" following the existing patterns:
   - Add to the chart type selector options
   - Implement data transformation in `buildChartData()`
   - Add appropriate options in `buildChartOptions()`

3. Run lint and build to verify the changes:

```bash
npm run lint && npm run build
```
