import { parseNumericValue } from './parsers';

export const COLOR_SCHEMES = {
  default: [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(255, 99, 255, 0.8)',
    'rgba(99, 255, 132, 0.8)',
  ],
  pastel: [
    'rgba(255, 179, 186, 0.8)',
    'rgba(255, 223, 186, 0.8)',
    'rgba(255, 255, 186, 0.8)',
    'rgba(186, 255, 201, 0.8)',
    'rgba(186, 225, 255, 0.8)',
    'rgba(218, 186, 255, 0.8)',
    'rgba(255, 186, 243, 0.8)',
    'rgba(186, 255, 255, 0.8)',
  ],
  bold: [
    'rgba(231, 76, 60, 0.9)',
    'rgba(46, 204, 113, 0.9)',
    'rgba(52, 152, 219, 0.9)',
    'rgba(155, 89, 182, 0.9)',
    'rgba(241, 196, 15, 0.9)',
    'rgba(230, 126, 34, 0.9)',
    'rgba(26, 188, 156, 0.9)',
    'rgba(52, 73, 94, 0.9)',
  ],
  monochrome: [
    'rgba(0, 0, 0, 0.9)',
    'rgba(50, 50, 50, 0.8)',
    'rgba(100, 100, 100, 0.7)',
    'rgba(150, 150, 150, 0.6)',
    'rgba(200, 200, 200, 0.5)',
  ],
};

export const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'polarArea', label: 'Polar Area' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'boxplot', label: 'Box Plot' },
];

export function buildChartData(table, config) {
  const { xColumn, yColumns, chartType, colorScheme } = config;
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.default;

  if (chartType === 'histogram') {
    return buildHistogramData(table, yColumns[0], colors);
  }

  if (chartType === 'boxplot') {
    return buildBoxPlotData(table, yColumns, colors);
  }

  const labels = table.data.map(row => row[xColumn] ?? '');

  if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
    // For pie/doughnut, use first y column
    const yCol = yColumns[0];
    const data = table.data.map(row => parseNumericValue(row[yCol]) ?? 0);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.map(c => c.replace(/[\d.]+\)$/, '1)')),
        borderWidth: 1,
      }],
    };
  }

  if (chartType === 'scatter') {
    const xValues = table.data.map(row => parseNumericValue(row[xColumn]));
    const datasets = yColumns.map((yCol, i) => ({
      label: yCol,
      data: table.data.map((row, j) => ({
        x: xValues[j],
        y: parseNumericValue(row[yCol]),
      })).filter(p => p.x !== null && p.y !== null),
      backgroundColor: colors[i % colors.length],
      borderColor: colors[i % colors.length].replace(/[\d.]+\)$/, '1)'),
    }));

    return { datasets };
  }

  // Bar, Line, Radar
  const datasets = yColumns.map((yCol, i) => ({
    label: yCol,
    data: table.data.map(row => parseNumericValue(row[yCol]) ?? 0),
    backgroundColor: colors[i % colors.length],
    borderColor: colors[i % colors.length].replace(/[\d.]+\)$/, '1)'),
    borderWidth: chartType === 'line' ? 2 : 1,
    fill: chartType === 'line' ? false : true,
    tension: 0.1,
  }));

  return { labels, datasets };
}

function buildHistogramData(table, column, colors) {
  const values = table.data
    .map(row => parseNumericValue(row[column]))
    .filter(v => v !== null);

  if (values.length === 0) {
    return { labels: [], datasets: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
  const binWidth = (max - min) / binCount || 1;

  const bins = Array(binCount).fill(0);
  const binLabels = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
  }

  values.forEach(v => {
    let binIndex = Math.floor((v - min) / binWidth);
    if (binIndex >= binCount) binIndex = binCount - 1;
    if (binIndex < 0) binIndex = 0;
    bins[binIndex]++;
  });

  return {
    labels: binLabels,
    datasets: [{
      label: `${column} Distribution`,
      data: bins,
      backgroundColor: colors[0],
      borderColor: colors[0].replace(/[\d.]+\)$/, '1)'),
      borderWidth: 1,
    }],
  };
}

function buildBoxPlotData(table, columns, colors) {
  const datasets = columns.map((col, i) => {
    const values = table.data
      .map(row => parseNumericValue(row[col]))
      .filter(v => v !== null)
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { label: col, data: [] };
    }

    const q1 = percentile(values, 25);
    const median = percentile(values, 50);
    const q3 = percentile(values, 75);
    const iqr = q3 - q1;
    const min = Math.max(values[0], q1 - 1.5 * iqr);
    const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);

    return {
      label: col,
      min,
      q1,
      median,
      q3,
      max,
      backgroundColor: colors[i % colors.length],
    };
  });

  return { datasets, isBoxPlot: true };
}

function percentile(sortedArr, p) {
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] * (upper - index) + sortedArr[upper] * (index - lower);
}

export function buildChartOptions(config) {
  const { chartType, title, showLegend, showGrid } = config;

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
      },
      title: {
        display: !!title,
        text: title || '',
        font: { size: 16 },
      },
    },
  };

  if (['bar', 'line', 'scatter', 'histogram'].includes(chartType)) {
    baseOptions.scales = {
      x: {
        grid: { display: showGrid },
      },
      y: {
        grid: { display: showGrid },
        beginAtZero: true,
      },
    };
  }

  return baseOptions;
}
