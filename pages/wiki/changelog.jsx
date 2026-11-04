import React from 'react';
import { Box, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import TagLine from '@components/common/TagLine';
import { NextSeo } from 'next-seo';
import WikiRail from '@components/wiki/WikiRail';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { navigateOnPlainClick, useWikiGo } from '@components/wiki/links';
import { CAVEAT, fieldLabel, formatValue } from '@utility/wiki/history';
import { entityHref } from '@utility/wiki/page-graph';
import { cleanUnderscore } from '@utility/helpers';

const Changelog = ({ versions }) => {
  const go = useWikiGo();

  return <WikiRail current={'changelog'}>
    <Box sx={{ maxWidth: 1200 }}>
    <NextSeo
      title="Game changelog | Idleon Toolbox"
      description="What each Legends of Idleon patch changed: items, monsters, recipes, companions and talents, version by version."
    />
    <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 2 }}>{CAVEAT}</Typography>

    <Stack gap={2}>
      {versions.map(({ version, added, changed, kinds }) => <Card key={version} variant={'outlined'}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'}>
            <Typography variant={'cardTitle'} component={'h3'}>{version}</Typography>
            <TagLine variant={'body2'} tags={[added > 0 && `${added} added`, changed > 0 && `${changed} changed`]}/>
          </Stack>

          {kinds.map(({ kind, entries }) => <Stack key={kind} sx={{ mt: 1.5 }} gap={0.25}>
            <Typography variant={'groupLabel'} component={'h4'} color={'text.secondary'}>
              {KIND_PLURALS[kind] || kind}
            </Typography>
            {entries.map((entry) => <Stack
              key={`${entry.kind}-${entry.slug}`}
              direction={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 0, sm: 1.5 }}
            >
              <Link
                href={entityHref(entry)}
                variant={'body2'}
               
                sx={{ minWidth: 200 }}
                onClick={navigateOnPlainClick(go, entityHref(entry), true)}
              >
                {cleanUnderscore(entry.name)}
              </Link>
              <Typography variant={'body2'} color={'text.secondary'}>
                {entry.added
                  ? 'added'
                  : entry.fields.map(({ field, from, to }) =>
                    `${fieldLabel(field)}: ${formatValue(from)} to ${formatValue(to)}`).join(', ')}
              </Typography>
            </Stack>)}
          </Stack>)}
        </CardContent>
      </Card>)}
    </Stack>
    </Box>
  </WikiRail>;
};

export const getStaticProps = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { rollupByVersion } = await import('@utility/wiki/changelog');
  const { graph } = staticGraph();
  const versions = rollupByVersion(graph.nodes);

  return {
    props: {
      versions
    }
  };
};

export default Changelog;
