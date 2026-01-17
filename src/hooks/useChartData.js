import { useMemo } from 'react';
import { buildChartData, buildChartOptions } from '../utils/chartHelpers';
import { detectColumnTypes } from '../utils/parsers';

export function useChartData(table, config) {
  const columnTypes = useMemo(() => {
    if (!table) return {};
    return detectColumnTypes(table);
  }, [table]);

  const numericColumns = useMemo(() => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type === 'numeric')
      .map(([col]) => col);
  }, [columnTypes]);

  const categoricalColumns = useMemo(() => {
    return Object.entries(columnTypes)
      .filter(([_, type]) => type === 'categorical')
      .map(([col]) => col);
  }, [columnTypes]);

  const chartData = useMemo(() => {
    if (!table || !config.xColumn || config.yColumns.length === 0) {
      return null;
    }
    return buildChartData(table, config);
  }, [table, config]);

  const chartOptions = useMemo(() => {
    return buildChartOptions(config);
  }, [config]);

  return {
    columnTypes,
    numericColumns,
    categoricalColumns,
    chartData,
    chartOptions,
  };
}
