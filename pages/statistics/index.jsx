import { NextSeo } from 'next-seo';
import React from 'react';
import StatisticsPage from '@components/statistics/StatisticsPage';

const Statistics = () => <>
  <NextSeo
    title="Statistics | Idleon Toolbox"
    description="What Legends of Idleon players choose, by total level and class: classes, prayers, gods, super talents, AFK spots and more, counted from uploaded profiles."
  />
  <StatisticsPage/>
</>;

export default Statistics;
