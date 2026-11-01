import { NextSeo } from 'next-seo';
import React, { useEffect, useState } from 'react';
import SimpleLoader from '../components/common/SimpleLoader';
import { useReportPageLoading } from '@components/common/context/PageLoadingProvider';
import { Box, Grid } from '@mui/material';
import { classes } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';
import Panel from '@components/common/cards/Panel';
import Notice from '@components/common/Notice';
import StatisticsChart from '@components/statistics/StatisticsChart';

const API_URL = process.env.NEXT_PUBLIC_PROFILES_URL;

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // One chart per key the API sends that the map knows (createdAt and _id are skipped).
  const charts = data
    ? Object.entries(data).filter(([key]) => visualizationMap[key]).map(([key, raw]) => [key, visualizationMap[key], raw])
    : [];

  // Rendered in both branches - when it sat below the early return the page had no title at all
  // while the visualizations were still loading.
  const seo = <NextSeo
    title="Statistics | Idleon Toolbox"
    description="Explore community statistics and visualizations for Legends of Idleon including class distribution, skill levels, and player progression data"
  />;

  if (loading) return <>{seo}<SimpleLoader message="Loading visualizations..."/></>;

  return <>
    {seo}
    <Box sx={{ p: { xs: 1, sm: 2.5 } }}>
      {error ? <Notice tone={'error'}>Could not load the statistics.</Notice> : null}
      {!error && data ? <Grid container spacing={3}>
        {charts.map(([key, config, raw]) => <Grid item xs={12} md={6} key={key}>
          <Panel title={config.title} meta={config.subtitle} sx={{ height: '100%' }}>
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}><StatisticsChart config={config} raw={raw}/></Box>
          </Panel>
        </Grid>)}
      </Grid> : null}
    </Box>
  </>;
};

export default Statistics;
