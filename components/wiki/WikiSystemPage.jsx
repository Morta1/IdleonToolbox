import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import WikiRail from './WikiRail';
import WikiBreadcrumbs from './WikiBreadcrumbs';
import { KindTile, TILE_GRID, kindLabel } from './KindLink';
import { goOnPlainClick, useWikiGo } from './links';
import { wikiCrumbs } from '@utility/wiki/kinds.mjs';

// One game system and the kinds it holds, a card each like the home's Encyclopedia. No intro: the cards are the page.
const WikiSystemPage = ({ system, kinds, seoTitle, seoDescription }) => {
  const go = useWikiGo();

  return <WikiRail current={null} currentSystem={system.slug}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <Stack gap={2}>
        <WikiBreadcrumbs crumbs={wikiCrumbs({ system })} onGo={go}/>
        <Typography variant={'h5'} component={'h2'}>{system.label}</Typography>
        <Box sx={TILE_GRID}>
          {kinds.map(({ kind, count }) => <KindTile
            key={kind}
            kind={kind}
            label={kindLabel(kind, { short: true })}
            count={count}
            go={goOnPlainClick(go)}
          />)}
        </Box>
      </Stack>
    </Box>
  </WikiRail>;
};

export default WikiSystemPage;
