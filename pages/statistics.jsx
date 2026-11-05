import { NextSeo } from 'next-seo';
import React, { useEffect, useState } from 'react';
import SimpleLoader from '../components/common/SimpleLoader';
import { Box, Typography } from '@mui/material';
import { classes } from '@website-data';
import { getVisualizationMap } from '@components/statistics/consts';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Notice, { retryAction } from '@components/common/Notice';
import StatisticsChart from '@components/statistics/StatisticsChart';

const API_URL = process.env.NEXT_PUBLIC_PROFILES_URL;

// Two panels share a row's height: the spare goes down to the chart frame, whose footer closes the panel.
const COLUMN_SX = { display: 'flex', flexDirection: 'column' };
const CHART_PANEL_SX = { ...COLUMN_SX, height: '100%', boxSizing: 'border-box', '& > :last-child': { ...COLUMN_SX, flexGrow: 1 } };

const fetchVisualizations = () => fetch(`${API_URL}/visualizations`).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [failed, setFailed] = useState(0);
  const visualizationMap = getVisualizationMap(classes);

  const load = () => fetchVisualizations()
    .then((json) => {
      setData(json);
      setFailed(0);
    })
    .catch(() => setFailed((count) => count + 1))
    .finally(() => {
      setLoading(false);
      setRetrying(false);
    });

  useEffect(() => {
    load();
  }, []);

  // One chart per key the API sends that the map knows (createdAt and _id are skipped). A key whose answer is not a list
  // has nothing to draw, and the page says so once under the charts.
  const known = Object.keys(visualizationMap);
  const charts = known.filter((key) => Array.isArray(data?.[key])).map((key) => [key, visualizationMap[key], data[key]]);
  const unread = known.length - charts.length;

  // Rendered in both branches - when it sat below the early return the page had no title at all
  // while the visualizations were still loading.
  const seo = <NextSeo
    title="Statistics | Idleon Toolbox"
    description="Explore community statistics and visualizations for Legends of Idleon including class distribution, skill levels, and player progression data"
  />;

  if (loading) return <>{seo}<SimpleLoader message="Loading visualizations..."/></>;

  return <>
    {seo}
    {failed
      ? <Notice key={failed} tone={'error'} action={retryAction(() => {
        setRetrying(true);
        load();
      }, retrying)}>Couldn't load the statistics.</Notice>
      : <>
        <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 3 }}>
          Counted from every profile players have uploaded to Idleon Toolbox, refreshed every 30 minutes.
        </Typography>
        {/* Two columns at most: a chart's table twin needs the width, and three at 1920 cut its last column. */}
        {charts.length ? <CardGrid size={'l'} sx={{ gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width:1300px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } }}>
          {charts.map(([key, config, raw]) => <Panel key={key} title={config.title} meta={config.subtitle} sx={CHART_PANEL_SX}>
            <Box sx={{ ...COLUMN_SX, flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
              <ErrorBoundary title={'This chart didn\'t load'}><StatisticsChart config={config} raw={raw}/></ErrorBoundary>
            </Box>
          </Panel>)}
        </CardGrid> : <Notice tone={'info'}>No statistics yet.</Notice>}
        {charts.length && unread ? <Box sx={{ mt: 3 }}><Notice tone={'info'}>{unread} {unread === 1 ? 'chart' : 'charts'} didn't load.</Notice></Box> : null}
      </>}
  </>;
};

export default Statistics;
