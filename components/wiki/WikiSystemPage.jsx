import React from 'react';
import { useRouter } from 'next/router';
import { Box, Card, List, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import WikiRail from './WikiRail';
import WikiBreadcrumbs from './WikiBreadcrumbs';
import { KindLink, kindLabel } from './KindLink';
import { navigateOnPlainClick } from './links';
import { listingHref, wikiCrumbs } from '@utility/wiki/kinds.mjs';
import { sessionQuery } from '@utility/nav-query';

// One game system and the kinds it holds, the way the home's index lists them. No intro: the rows are the page.
const WikiSystemPage = ({ system, kinds, seoTitle, seoDescription }) => {
  const router = useRouter();
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={null} currentSystem={system.slug}>
    <Box sx={{ maxWidth: 1200 }}>
      <NextSeo title={seoTitle} description={seoDescription}/>
      <Stack gap={2}>
        <WikiBreadcrumbs crumbs={wikiCrumbs({ system })} onGo={go}/>
        <Card variant={'outlined'} sx={{ maxWidth: 520 }}>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Typography variant={'h5'} component={'h2'}>{system.label}</Typography>
          </Box>
          <List dense disablePadding sx={{ pb: 0.5 }}>
            {kinds.map(({ kind, count }) => <KindLink
              key={kind}
              kind={kind}
              href={listingHref(kind)}
              label={kindLabel(kind, { short: true })}
              count={count}
              artSize={20}
              compact
              go={navigateOnPlainClick(go, listingHref(kind), true)}
            />)}
          </List>
        </Card>
      </Stack>
    </Box>
  </WikiRail>;
};

export default WikiSystemPage;
