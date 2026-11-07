import React from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import Panel from '@components/common/cards/Panel';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { NextSeo } from 'next-seo';
import WikiRail from '@components/wiki/WikiRail';
import { KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { navigateOnPlainClick, useWikiGo } from '@components/wiki/links';
import { CAVEAT, changeLine } from '@utility/wiki/history';
import { entityHref } from '@utility/wiki/page-graph';
import { cleanUnderscore, formatNum } from '@utility/helpers';

const Changelog = ({ versions }) => {
  const go = useWikiGo();

  return <WikiRail current={'changelog'}>
    <Box>
    <NextSeo
      title="Game changelog | Idleon Toolbox"
      description="What each Legends of Idleon patch changed: items, monsters, recipes, companions and talents, version by version."
    />
    <Box sx={{ mb: 2 }}><Notice tone={'info'}>{CAVEAT}</Notice></Box>

    <Stack gap={2}>
      {versions.map(({ version, added, changed, kinds }) => <Panel key={version} title={version}
                                                                 meta={[added > 0 && `${formatNum(added, 'whole')} added`, changed > 0 && `${formatNum(changed, 'whole')} changed`].filter(Boolean).join(', ')}>
        <Stack gap={1.5} sx={{ p: 2, containerType: 'inline-size' }}>
          {kinds.map(({ kind, entries }) => <Stack key={kind} gap={0.25}>
            <Typography variant={'groupLabel'} component={'h4'} color={'text.secondary'}>
              {KIND_PLURALS[kind] || kind}
            </Typography>
            {/* Name beside change once the Panel holds both, whatever the window: beside the rail at 900 it is 228 px. */}
            {entries.map((entry) => <Box
              key={`${entry.kind}-${entry.slug}`}
              sx={{ display: 'flex', flexDirection: 'column', '@container (min-width:480px)': { flexDirection: 'row', columnGap: 1.5 } }}
            >
              <Link
                href={entityHref(entry)}
                variant={'body2'}
               
                sx={{ minWidth: 200 }}
                onClick={navigateOnPlainClick(go, entityHref(entry), true)}
              >
                {cleanUnderscore(entry.name)}
              </Link>
              <Typography variant={'body2'} color={'text.secondary'} component={'div'} sx={{ minWidth: 0, overflowWrap: 'break-word' }}>
                {entry.added
                  ? <StatusText status={'info'}>Added</StatusText>
                  : entry.fields.map(changeLine).join(', ')}
              </Typography>
            </Box>)}
          </Stack>)}
        </Stack>
      </Panel>)}
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
