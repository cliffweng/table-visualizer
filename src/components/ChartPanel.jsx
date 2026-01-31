import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Radar, PolarArea, Bubble } from 'react-chartjs-2';
import { useChartData } from '../hooks/useChartData';
import { CHART_TYPES, COLOR_SCHEMES } from '../utils/chartHelpers';
import { detectColumnTypes, parseNumericValue } from '../utils/parsers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartComponent = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  scatter: Scatter,
  radar: Radar,
  polarArea: PolarArea,
  histogram: Bar,
  bubble: Bubble,
};

// Extended chart types with bubble
const EXTENDED_CHART_TYPES = [
  ...CHART_TYPES,
  { value: 'bubble', label: 'Bubble Chart' },
];

export function ChartPanel({ table }) {
  const [config, setConfig] = useState({
    chartType: 'bar',
    xColumn: '',
    yColumns: [],
    colorColumn: '',
    sizeColumn: '',
    labelColumn: '', // Column to show in tooltip (e.g., country name)
    colorScheme: 'default',
    title: '',
    showLegend: true,
    showGrid: true,
  });

  const { numericColumns, categoricalColumns, chartData, chartOptions } = useChartData(table, config);

  // Detect column types for the table
  const columnTypes = useMemo(() => {
    if (!table) return {};
    return detectColumnTypes(table);
  }, [table]);

  const numericCols = useMemo(() => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type === 'numeric')
      .map(([col]) => col);
  }, [columnTypes]);

  const categoricalCols = useMemo(() => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type === 'categorical')
      .map(([col]) => col);
  }, [columnTypes]);

  // Auto-select columns when table changes
  useEffect(() => {
    if (table && table.headers.length > 0) {
      const allColumns = table.headers;
      const numeric = numericCols.length > 0 ? numericCols : allColumns;
      const categorical = categoricalCols.length > 0 ? categoricalCols : allColumns;

      // Try to find a good label column (country, name, etc.)
      const labelPatterns = [/country/i, /nation/i, /name/i, /territory/i, /state/i, /city/i];
      const detectedLabel = allColumns.find(col =>
        labelPatterns.some(pattern => pattern.test(col))
      ) || categorical[0] || allColumns[0];

      setConfig(prev => ({
        ...prev,
        xColumn: categorical[0] || allColumns[0],
        yColumns: numeric.slice(0, 1),
        colorColumn: '',
        sizeColumn: numeric.length > 1 ? numeric[1] : '',
        labelColumn: detectedLabel,
      }));
    }
  }, [table, numericCols, categoricalCols]);

  if (!table) return null;

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleYColumnToggle = (column) => {
    setConfig(prev => {
      const current = prev.yColumns;
      if (current.includes(column)) {
        return { ...prev, yColumns: current.filter(c => c !== column) };
      }
      return { ...prev, yColumns: [...current, column] };
    });
  };

  // Build chart data with color and size support
  const extendedChartData = useMemo(() => {
    if (!table || !config.xColumn || config.yColumns.length === 0) {
      return null;
    }

    const colors = COLOR_SCHEMES[config.colorScheme] || COLOR_SCHEMES.default;

    // Handle bubble chart
    if (config.chartType === 'bubble' && config.yColumns[0] && config.sizeColumn) {
      const uniqueColors = config.colorColumn
        ? [...new Set(table.data.map(row => row[config.colorColumn]))]
        : [null];

      const datasets = uniqueColors.map((colorValue, colorIndex) => {
        const filteredData = config.colorColumn
          ? table.data.filter(row => row[config.colorColumn] === colorValue)
          : table.data;

        const points = filteredData.map(row => {
          const x = parseNumericValue(row[config.xColumn]);
          const y = parseNumericValue(row[config.yColumns[0]]);
          const r = parseNumericValue(row[config.sizeColumn]);
          const rawR = parseNumericValue(row[config.sizeColumn]);
          return {
            x,
            y,
            r: r ? Math.sqrt(r) * 2 : 5,
            // Store metadata for tooltip
            label: config.labelColumn ? row[config.labelColumn] : null,
            rawSize: rawR,
            rawData: row,
          };
        }).filter(p => p.x !== null && p.y !== null);

        return {
          label: colorValue || config.yColumns[0],
          data: points,
          backgroundColor: colors[colorIndex % colors.length],
          borderColor: colors[colorIndex % colors.length].replace(/[\d.]+\)$/, '1)'),
        };
      });

      return { datasets, hasLabels: !!config.labelColumn };
    }

    // Handle scatter with color grouping
    if (config.chartType === 'scatter' && config.colorColumn) {
      const uniqueColors = [...new Set(table.data.map(row => row[config.colorColumn]))];

      const datasets = uniqueColors.map((colorValue, colorIndex) => {
        const filteredData = table.data.filter(row => row[config.colorColumn] === colorValue);

        const points = filteredData.map(row => ({
          x: parseNumericValue(row[config.xColumn]),
          y: parseNumericValue(row[config.yColumns[0]]),
          // Store metadata for tooltip
          label: config.labelColumn ? row[config.labelColumn] : null,
          rawData: row,
        })).filter(p => p.x !== null && p.y !== null);

        return {
          label: String(colorValue),
          data: points,
          backgroundColor: colors[colorIndex % colors.length],
          borderColor: colors[colorIndex % colors.length].replace(/[\d.]+\)$/, '1)'),
        };
      });

      return { datasets, hasLabels: !!config.labelColumn };
    }

    // Handle scatter without color grouping
    if (config.chartType === 'scatter') {
      const points = table.data.map(row => ({
        x: parseNumericValue(row[config.xColumn]),
        y: parseNumericValue(row[config.yColumns[0]]),
        label: config.labelColumn ? row[config.labelColumn] : null,
        rawData: row,
      })).filter(p => p.x !== null && p.y !== null);

      return {
        datasets: [{
          label: config.yColumns[0],
          data: points,
          backgroundColor: colors[0],
          borderColor: colors[0].replace(/[\d.]+\)$/, '1)'),
        }],
        hasLabels: !!config.labelColumn,
      };
    }

    // Handle bar/line with color grouping (stacked or grouped)
    if (['bar', 'line'].includes(config.chartType) && config.colorColumn) {
      const uniqueColors = [...new Set(table.data.map(row => row[config.colorColumn]))];
      const labels = [...new Set(table.data.map(row => row[config.xColumn]))];

      const datasets = uniqueColors.map((colorValue, colorIndex) => {
        const data = labels.map(label => {
          const matchingRow = table.data.find(
            row => row[config.xColumn] === label && row[config.colorColumn] === colorValue
          );
          return matchingRow ? parseNumericValue(matchingRow[config.yColumns[0]]) ?? 0 : 0;
        });

        return {
          label: String(colorValue),
          data,
          backgroundColor: colors[colorIndex % colors.length],
          borderColor: colors[colorIndex % colors.length].replace(/[\d.]+\)$/, '1)'),
          borderWidth: config.chartType === 'line' ? 2 : 1,
        };
      });

      return { labels, datasets };
    }

    // Fall back to default chart data
    return chartData;
  }, [table, config, chartData]);

  const extendedChartOptions = useMemo(() => {
    const baseOptions = { ...chartOptions };

    // Custom tooltip for scatter and bubble charts
    if (['scatter', 'bubble'].includes(config.chartType) && config.labelColumn) {
      baseOptions.plugins = {
        ...baseOptions.plugins,
        tooltip: {
          callbacks: {
            title: (context) => {
              const dataPoint = context[0]?.raw;
              if (dataPoint?.label) {
                return dataPoint.label;
              }
              return '';
            },
            label: (context) => {
              const dataPoint = context.raw;
              const lines = [];

              // Show x and y values
              lines.push(`${config.xColumn}: ${dataPoint.x?.toLocaleString() ?? 'N/A'}`);
              lines.push(`${config.yColumns[0]}: ${dataPoint.y?.toLocaleString() ?? 'N/A'}`);

              // Show size for bubble charts
              if (config.chartType === 'bubble' && config.sizeColumn && dataPoint.rawSize !== undefined) {
                lines.push(`${config.sizeColumn}: ${dataPoint.rawSize?.toLocaleString() ?? 'N/A'}`);
              }

              // Show color group if applicable
              if (config.colorColumn && context.dataset.label) {
                lines.push(`${config.colorColumn}: ${context.dataset.label}`);
              }

              return lines;
            },
          },
        },
      };
    }

    if (config.chartType === 'bubble') {
      baseOptions.scales = {
        x: {
          title: { display: true, text: config.xColumn },
          grid: { display: config.showGrid },
        },
        y: {
          title: { display: true, text: config.yColumns[0] || '' },
          grid: { display: config.showGrid },
        },
      };
    }

    if (config.chartType === 'scatter') {
      baseOptions.scales = {
        x: {
          title: { display: true, text: config.xColumn },
          grid: { display: config.showGrid },
        },
        y: {
          title: { display: true, text: config.yColumns[0] || '' },
          grid: { display: config.showGrid },
        },
      };
    }

    return baseOptions;
  }, [chartOptions, config]);

  const renderChart = () => {
    if (!extendedChartData) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Select columns to visualize
        </div>
      );
    }

    if (extendedChartData.isBoxPlot) {
      return <BoxPlotChart data={extendedChartData} />;
    }

    const Component = ChartComponent[config.chartType];
    if (!Component) return null;

    return (
      <div className="h-80">
        <Component data={extendedChartData} options={extendedChartOptions} />
      </div>
    );
  };

  const showColorColumn = ['scatter', 'bubble', 'bar', 'line'].includes(config.chartType);
  const showSizeColumn = config.chartType === 'bubble';
  const showLabelColumn = ['scatter', 'bubble'].includes(config.chartType);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-800">Chart Visualization</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Chart Type and basic options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Type
            </label>
            <select
              value={config.chartType}
              onChange={(e) => handleConfigChange('chartType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
            >
              {EXTENDED_CHART_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X-Axis Column
            </label>
            <select
              value={config.xColumn}
              onChange={(e) => handleConfigChange('xColumn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
            >
              {table.headers.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Scheme
            </label>
            <select
              value={config.colorScheme}
              onChange={(e) => handleConfigChange('colorScheme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
            >
              {Object.keys(COLOR_SCHEMES).map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              placeholder="Optional title…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
            />
          </div>
        </div>

        {/* Row 2: Label, Color and Size columns (for applicable chart types) */}
        {(showLabelColumn || showColorColumn || showSizeColumn) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {showLabelColumn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label Column (tooltip)
                </label>
                <select
                  value={config.labelColumn}
                  onChange={(e) => handleConfigChange('labelColumn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
                >
                  <option value="">None</option>
                  {table.headers.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}

            {showColorColumn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color/Group By (optional)
                </label>
                <select
                  value={config.colorColumn}
                  onChange={(e) => handleConfigChange('colorColumn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
                >
                  <option value="">None</option>
                  {table.headers.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}

            {showSizeColumn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size Column (bubble radius)
                </label>
                <select
                  value={config.sizeColumn}
                  onChange={(e) => handleConfigChange('sizeColumn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-gray-800"
                >
                  <option value="">None</option>
                  {table.headers.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Y-Axis Columns (multi-select) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Y-Axis Column(s) - Select one or more
          </label>
          <div className="flex flex-wrap gap-2">
            {table.headers.map((col) => (
              <button
                key={col}
                onClick={() => handleYColumnToggle(col)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                  config.yColumns.includes(col)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.showLegend}
              onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show Legend
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show Grid
          </label>
        </div>

        {/* Chart Display */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

function BoxPlotChart({ data }) {
  const { datasets } = data;

  return (
    <div className="h-80 flex items-end justify-center gap-8 p-4">
      {datasets.map((ds, i) => {
        if (!ds.min && ds.min !== 0) {
          return (
            <div key={i} className="text-center text-gray-500">
              No numeric data for {ds.label}
            </div>
          );
        }

        const range = ds.max - ds.min;
        const scale = 200 / (range || 1);

        return (
          <div key={i} className="flex flex-col items-center">
            <div className="relative w-16 h-52">
              {/* Whisker line */}
              <div
                className="absolute left-1/2 w-0.5 bg-gray-400 -translate-x-1/2"
                style={{
                  bottom: 0,
                  height: `${(ds.max - ds.min) * scale}px`,
                }}
              />
              {/* Box */}
              <div
                className="absolute left-1/2 w-12 -translate-x-1/2 border-2 border-gray-600"
                style={{
                  bottom: `${(ds.q1 - ds.min) * scale}px`,
                  height: `${(ds.q3 - ds.q1) * scale}px`,
                  backgroundColor: ds.backgroundColor,
                }}
              />
              {/* Median line */}
              <div
                className="absolute left-1/2 w-12 h-0.5 bg-gray-800 -translate-x-1/2"
                style={{
                  bottom: `${(ds.median - ds.min) * scale}px`,
                }}
              />
              {/* Min whisker */}
              <div className="absolute left-1/2 w-8 h-0.5 bg-gray-400 -translate-x-1/2" style={{ bottom: 0 }} />
              {/* Max whisker */}
              <div
                className="absolute left-1/2 w-8 h-0.5 bg-gray-400 -translate-x-1/2"
                style={{ bottom: `${(ds.max - ds.min) * scale}px` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-700 font-medium">{ds.label}</div>
            <div className="text-xs text-gray-500 mt-1">
              Q1: {ds.q1.toFixed(1)} | Med: {ds.median.toFixed(1)} | Q3: {ds.q3.toFixed(1)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
