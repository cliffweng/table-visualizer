import { useState, useEffect } from 'react';
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
import { Bar, Line, Pie, Doughnut, Scatter, Radar, PolarArea } from 'react-chartjs-2';
import { useChartData } from '../hooks/useChartData';
import { CHART_TYPES, COLOR_SCHEMES } from '../utils/chartHelpers';

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
};

export function ChartPanel({ table }) {
  const [config, setConfig] = useState({
    chartType: 'bar',
    xColumn: '',
    yColumns: [],
    colorScheme: 'default',
    title: '',
    showLegend: true,
    showGrid: true,
  });

  const { numericColumns, categoricalColumns, chartData, chartOptions } = useChartData(table, config);

  // Auto-select columns when table changes
  useEffect(() => {
    if (table && table.headers.length > 0) {
      const allColumns = table.headers;
      const numeric = numericColumns.length > 0 ? numericColumns : allColumns;
      const categorical = categoricalColumns.length > 0 ? categoricalColumns : allColumns;

      setConfig(prev => ({
        ...prev,
        xColumn: categorical[0] || allColumns[0],
        yColumns: numeric.slice(0, 1),
      }));
    }
  }, [table, numericColumns, categoricalColumns]);

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

  const renderChart = () => {
    if (!chartData) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Select columns to visualize
        </div>
      );
    }

    if (chartData.isBoxPlot) {
      return <BoxPlotChart data={chartData} />;
    }

    const Component = ChartComponent[config.chartType];
    if (!Component) return null;

    return (
      <div className="h-80">
        <Component data={chartData} options={chartOptions} />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-semibold text-gray-800">Chart Visualization</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Chart Type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chart Type
            </label>
            <select
              value={config.chartType}
              onChange={(e) => handleConfigChange('chartType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              {CHART_TYPES.map(({ value, label }) => (
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
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
              placeholder="Optional title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>
        </div>

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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
