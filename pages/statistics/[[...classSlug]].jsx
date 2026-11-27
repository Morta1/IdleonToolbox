import { NextSeo } from 'next-seo';
import React from 'react';
import { classes } from '@website-data';
import StatisticsPage from '@components/statistics/StatisticsPage';
import { CLASS_KEYS } from '@utility/builds/classes';
import { classToSlug, slugToDisplayName } from '@utility/builds/class-paths.mjs';

// /statistics and one page per released class (/statistics/elemental-sorcerer), from one route file: picking a class moves
// between pages of the same component, so the page re-renders with the new class instead of loading a new page. Each
// class page is still exported with its own title and canonical for search and links. The param is never `class`: a
// reserved word.
export const STATISTICS_CLASS_SLUGS = CLASS_KEYS.filter((key) => classes?.indexOf(key) > 0).map(classToSlug);

export const getStaticPaths = () => ({
  paths: [{ params: { classSlug: [] } }, ...STATISTICS_CLASS_SLUGS.map((slug) => ({ params: { classSlug: [slug] } }))],
  // output: 'export' supports false only
  fallback: false
});

// PAGE_SEO is keyed by route pattern, so every page passes its own title (_app prefers these props over the map).
export const getStaticProps = ({ params }) => {
  const [slug] = params?.classSlug ?? [];
  if (!slug) {
    return {
      props: {
        classId: null,
        canonicalPath: '/statistics',
        seoTitle: 'Statistics | Idleon Toolbox',
        seoDescription: 'What Legends of Idleon players choose, by total level and class: classes, prayers, gods, super talents, AFK spots and more, counted from uploaded profiles.'
      }
    };
  }
  const classKey = CLASS_KEYS.find((key) => classToSlug(key) === slug);
  const name = slugToDisplayName(slug);
  return {
    props: {
      classId: classes.indexOf(classKey),
      canonicalPath: `/statistics/${slug}`,
      seoTitle: `Idleon ${name} Statistics | Idleon Toolbox`,
      seoDescription: `What Legends of Idleon ${name} players use: prayers, linked gods, super talents, AFK spots and printer samples, counted from uploaded profiles.`
    }
  };
};

const Statistics = ({ classId, canonicalPath, seoTitle, seoDescription }) => <>
  <NextSeo title={seoTitle} description={seoDescription} canonical={`https://idleontoolbox.com${canonicalPath}`}/>
  <StatisticsPage classId={classId}/>
</>;

export default Statistics;
