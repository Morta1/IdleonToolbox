import { NextSeo } from 'next-seo';
import React from 'react';
import { classes } from '@website-data';
import StatisticsPage from '@components/statistics/StatisticsPage';
import { CLASS_KEYS } from '@utility/builds/classes';
import { classToSlug, slugToDisplayName } from '@utility/builds/class-paths.mjs';

// One page per released class, as the builds class pages. The param is classSlug, never class: a reserved word.
export const STATISTICS_CLASS_SLUGS = CLASS_KEYS.filter((key) => classes?.indexOf(key) > 0).map(classToSlug);

export const getStaticPaths = () => ({
  paths: STATISTICS_CLASS_SLUGS.map((classSlug) => ({ params: { classSlug } })),
  // output: 'export' supports false only
  fallback: false
});

// PAGE_SEO is keyed by route pattern, so each class page passes its own title (_app prefers these props over the map).
export const getStaticProps = ({ params }) => {
  const classKey = CLASS_KEYS.find((key) => classToSlug(key) === params.classSlug);
  const name = slugToDisplayName(params.classSlug);
  return {
    props: {
      classId: classes.indexOf(classKey),
      classSlug: params.classSlug,
      seoTitle: `Idleon ${name} Statistics | Idleon Toolbox`,
      seoDescription: `What Legends of Idleon ${name} players use: prayers, linked gods, super talents, AFK spots and printer samples, counted from uploaded profiles.`
    }
  };
};

const ClassStatistics = ({ classId, classSlug, seoTitle, seoDescription }) => <>
  <NextSeo title={seoTitle} description={seoDescription} canonical={`https://idleontoolbox.com/statistics/${classSlug}`}/>
  <StatisticsPage classId={classId} key={classSlug}/>
</>;

export default ClassStatistics;
