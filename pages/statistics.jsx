import { NextSeo } from 'next-seo';
import React, { useEffect, useState } from 'react';
import SimpleLoader from '../components/common/SimpleLoader';
import { Grid, useMediaQuery } from '@mui/material';
import { classes } from '../data/website-data';
import { customColors, getVisualizationMap } from '@components/statistics/consts';
import BarVisualization from '../components/statistics/BarVisualization';
import PieVisualization from '../components/statistics/PieVisualization';

const API_URL = process.env.NEXT_PUBLIC_PROFILES_URL;

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const visualizationMap = getVisualizationMap(classes);

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
              color={customColors[index % customColors.length]}
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
            color: customColors[index % customColors.length]
          }));
          return (
            <PieVisualization
              key={key}
              data={pieData}
              label={key.camelToTitleCase()}
              colors={customColors}
              legends={[
                {
                  anchor: 'top-left',
                  direction: 'column',
                  itemHeight: 18,
                  symbolShape: 'circle'
                }
              ]}
              isMd={isMd}
              {...vizConfig?.props}
            />
          );
        }
        return null;
      });
  };

  if (loading) return <SimpleLoader message="Loading visualizations..."/>;

  return <>
    <NextSeo
      title="Statistics | Idleon Toolbox"
      description="Statistics page for various aspects of the game"
    />
    <div style={{ background: '#141A21', minHeight: '100vh', padding: 20 }}>
      {error && <p style={{ color: '#F56565', textAlign: 'center', fontSize: 14 }}>Error: {error}</p>}
      {!loading && !error && data && (
        <Grid container spacing={3}>
          {renderCharts().map((chart, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <div
                style={{
                  flex: 1,
                  height: 400,
                  minWidth: 300,
                  background: '#1C252E',
                  borderRadius: 8,
                  padding: 32,
                  border: '1px solid #424242',
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