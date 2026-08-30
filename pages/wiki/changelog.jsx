import React from 'react';
import { useRouter } from 'next/router';
import { Box, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import WikiRail from '@components/wiki/WikiRail';
import { KIND_PLURALS } from '@components/wiki/EntityPanel';
import { CAVEAT, fieldLabel, formatValue } from '@utility/wiki/history';
import { sessionQuery } from '@utility/nav-query';
import { cleanUnderscore } from '@utility/helpers';

const Changelog = ({ versions }) => {
  const router = useRouter();
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={'changelog'}>
    <Box sx={{ maxWidth: 1200 }}>
    <NextSeo
      title="Game changelog | Idleon Toolbox"
      description="What each Legends of Idleon patch changed: items, monsters, recipes, companions and talents, version by version."
    />
    <Stack direction={'row'} gap={0.5} alignItems={'center'} sx={{ mb: 2 }}>
      <Typography variant={'h5'} component={'h2'}>Game changelog</Typography>
      <Tooltip title={CAVEAT}>
        <InfoIcon sx={{ fontSize: 16, cursor: 'pointer' }}/>
      </Tooltip>
    </Stack>

    <Stack gap={2}>
      {versions.map(({ version, added, changed, kinds }) => <Card key={version} variant={'outlined'}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'}>
            <Typography variant={'h6'} component={'h3'}>{version}</Typography>
            {added > 0 ? <Chip size={'small'} variant={'outlined'} label={`${added} added`}/> : null}
            {changed > 0 ? <Chip size={'small'} variant={'outlined'} label={`${changed} changed`}/> : null}
          </Stack>

          {kinds.map(({ kind, entries }) => <Stack key={kind} sx={{ mt: 1.5 }} gap={0.25}>
            <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
              {KIND_PLURALS[kind] || kind}
            </Typography>
            {entries.map((entry) => <Stack
              key={`${entry.kind}-${entry.slug}`}
              direction={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 0, sm: 1.5 }}
            >
              <Link
                href={`/wiki/${entry.kind}/${entry.slug}`}
                variant={'body2'}
                underline={'hover'}
                sx={{ minWidth: 200 }}
                onClick={(event) => {
                  event.preventDefault();
                  go(`/wiki/${entry.kind}/${entry.slug}`);
                }}
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
      versions,
      // Nothing below WaitForRouter reaches the static export, so the entity links only survive
      // as crawl links rendered above the gate.
      crawlLinks: versions.flatMap(({ kinds }) => kinds.flatMap(({ entries }) => entries
        .map((entry) => ({ h: `/wiki/${entry.kind}/${entry.slug}`, t: entry.name })))),
      crawlHeading: 'Entities changed by game version'
    }
  };
};

export default Changelog;
