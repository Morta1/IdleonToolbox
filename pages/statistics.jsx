import { NextSeo } from 'next-seo';
import React, { useEffect, useState } from 'react';
import SimpleLoader from '../components/common/SimpleLoader';
import { useReportPageLoading } from '@components/common/context/PageLoadingProvider';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import { classes } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';
import { seriesColors } from '@utility/chartTheme';
import dynamic from 'next/dynamic';

const BarVisualization = dynamic(
  () => import('../components/statistics/BarVisualization'),
  { ssr: false }
);
const PieVisualization = dynamic(
  () => import('../components/statistics/PieVisualization'),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_PROFILES_URL;

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const series = seriesColors(useTheme().palette.mode);
  const visualizationMap = getVisualizationMap(classes);

  // Whole page is a loader below - let the layout collapse the ad gutter so it centres
  useReportPageLoading(loading);

  useEffect(() => {
    fetch(`${API_URL}/visualizations`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Render a chart for each key in the data, using the visualizationMap
  const renderCharts = () => {
    if (!data) return null;
    return Object.entries(data)
      .filter(([key]) => (visualizationMap[key] && visualizationMap[key].getData))
      .map(([key, value], index) => {
        const vizConfig = visualizationMap[key];
        const vizType = vizConfig.type;
        const chartData = vizConfig.getData(value);
        const chartKeys = vizConfig.hasOwnProperty('getKeys') ? vizConfig.getKeys(chartData) : null;
        if (!Array.isArray(chartData)) return null;
        const indexKey = '_id';
        if (vizType === 'bar') {
          return (
            <BarVisualization
              key={key}
              keys={chartKeys || vizConfig?.keys}
              data={chartData.map(item => ({
                ...item,
                [indexKey]: item[indexKey],
                count: item.count
              }))}
              indexKey={indexKey}
              label={vizConfig?.props?.label || key.camelToTitleCase()}
              color={series[0]}
              colors={vizConfig?.getColors}
              {...vizConfig?.props}
            />
          );
        }
        if (vizType === 'pie') {
          const pieData = chartData.map(item => ({
            id: item._id,
            value: item.count,
            label: item[indexKey],
            color: series[0]
          }));
          return (
            <PieVisualization
              key={key}
              data={pieData}
              label={key.camelToTitleCase()}
              colors={series}
              isMd={isMd}
              isSm={isSm}
              {...vizConfig?.props}
            />
          );
        }
        return null;
      });
  };

  // Rendered in both branches - when it sat below the early return the page had no title at all
  // while the visualizations were still loading.
  const seo = <NextSeo
    title="Statistics | Idleon Toolbox"
    description="Explore community statistics and visualizations for Legends of Idleon including class distribution, skill levels, and player progression data"
  />;

  if (loading) return <>{seo}<SimpleLoader message="Loading visualizations..."/></>;

  return <>
    {seo}
    <div style={{ background: 'var(--mui-palette-background-default)', minHeight: '100vh', padding: isSm ? 8 : 20 }}>
      {error && <p style={{ color: 'var(--mui-palette-text-error)', textAlign: 'center', fontSize: 14 }}>Error: {error}</p>}
      {!loading && !error && data && (
        <Grid container spacing={3}>
          {renderCharts().map((chart, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: isSm ? 350 : 400,
                  minWidth: isSm ? 0 : 300,
                  background: 'var(--mui-palette-background-paper)',
                  borderRadius: 8,
                  padding: isSm ? 12 : 32,
                  border: '1px solid var(--mui-palette-divider)',
                  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px'
                }}
              >
                {chart}
              </div>
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  </>;
};

export default Statistics;