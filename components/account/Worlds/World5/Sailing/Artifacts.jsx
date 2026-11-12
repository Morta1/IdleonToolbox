import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { ARTIFACT_TIERS as TIERS, artifactTierColor } from './sailing.consts';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { artifacts as ARTIFACTS, gameTables } from '@website-data';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const ARTIFACTS_TOOLBAR = { search: '', show: 'all' };

// An artifact's last form: the highest tier its data describes (not every artifact goes to the last one)
const topTierOf = (artifact) => Array.from({ length: TIERS.length }, (_, index) => index + 1)
  .filter((tier) => tier === 1 || getTierDescription(artifact, tier)).at(-1) ?? 1;
const SHOW_FILTERS = {
  all: () => true,
  upgrade: (artifact) => (artifact?.acquired ?? 0) < topTierOf(artifact),
  missing: (artifact) => !artifact?.acquired
};

const getTierDescription = (artifact, tier) => {
  switch (tier) {
    case 1: return artifact.description;
    case 2: return artifact.ancientFormDescription;
    case 3: return artifact.eldritchFormDescription;
    case 4: return artifact.sovereignFormDescription;
    case 5: return artifact.omnipotentFormDescription;
    case 6: return artifact.transcendentFormDescription;
    case 7: return artifact.verisimilitudeFormDescription ?? '';
    default: return '';
  }
};

// The game tints a tier 7 (Verisimilitude) artifact with createHueFilter(160) (_customEvent_Sailing)
const artifactIcon = (rawName, tier) => tier === 7
  ? <Box component={'span'} sx={{ display: 'inline-flex', filter: 'hue-rotate(160deg)' }}>
    <GameIcon src={`data/${rawName}.png`} size={40} alt={''}/>
  </Box>
  : `data/${rawName}.png`;

// The parser drops the game's line break before the total (sailing.ts), so the card puts it back
const withTotalLine = (text) => cleanUnderscore(text ?? '').replace(/\s*(Total bonus)/i, ' @ $1');

// Info 5: Crystal Steak's and Socrates' per-character tables, a list in a hover note before
const PER_CHARACTER = {
  Crystal_Steak: ['Total damage per character', ({ bonus }) => ({ value: bonus, formatted: formatNum(bonus ?? 0, 'pct') })],
  Socrates: ['All stats per character', ({ strength, agility, wisdom, luck }) => ({
    value: strength,
    formatted: [strength, agility, wisdom, luck].map((stat) => formatNum(stat ?? 0)).join(' / ')
  })]
};

const perCharacter = (name, additionalData, tier) => {
  const [title, line] = PER_CHARACTER[name] ?? [];
  if (!title || !tier || !Array.isArray(additionalData) || !additionalData.length) return null;
  const count = `${formatNum(additionalData.length)} ${additionalData.length === 1 ? 'character' : 'characters'}`;
  const data = createBreakdown(title, count, flatLines(additionalData.map((row) => ({ name: row?.name, ...line(row) }))),
    { combine: 'list' });
  return [title, <Breakdown key={'per-character'} asValue data={data} countNoun={'characters'}>{count}</Breakdown>];
};

// A failed section the page reads as {} still lists the catalog, as a guest's does: every artifact not acquired, its
// sentence filled with the catalog's base bonus and no total, which only the section knows
const catalogAtZero = () => (ARTIFACTS ?? []).map((artifact, index) => ({
  ...artifact,
  rawName: `Arti${index}`,
  acquired: 0,
  description: String(artifact?.description ?? '').replace(/_*@?_*Total_Bonus.*$/, '').replace('{', artifact?.baseBonus ?? '')
    .replace('$', gameTables?.artifactFormText?.forms?.[0] ?? '')
}));

const Artifacts = ({ artifacts, sectionFailed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('sailing-artifacts', ARTIFACTS_TOOLBAR);
  const list = artifacts ?? catalogAtZero();
  const found = list.filter(({ acquired }) => acquired).length;
  const topTier = list.filter((artifact) => artifact?.acquired && artifact.acquired >= topTierOf(artifact)).length;
  const maxedText = `${formatNum(topTier)} / ${formatNum(list.length)}`;
  const filter = SHOW_FILTERS[toolbar?.show] ?? SHOW_FILTERS.all;
  // By name or by what it gives ("drop rate"), the question the filter can't answer
  const search = String(toolbar?.search ?? '').trim().toLowerCase();
  const matches = (artifact) => !search || [artifact?.name, artifact?.description]
    .some((text) => cleanUnderscore(text ?? '').toLowerCase().includes(search));
  const shown = list.map((artifact, index) => ({ artifact, index })).filter(({ artifact }) => filter(artifact) && matches(artifact));
  return <>
    {sectionFailed ? null : <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
      <StatTile label={'Found'} value={`${formatNum(found)} / ${formatNum(list.length)}`}/>
      <StatTile label={'Maxed'} value={maxedText} breakdownTitle={'Artifact forms'} breakdownNoun={'forms'}
                breakdown={createBreakdown('Artifact forms', maxedText, flatLines([
                  ...TIERS.map(({ full }, index) => ({ name: full, value: list.filter(({ acquired }) => acquired === index + 1).length }))
                    .toReversed(),
                  { name: 'Not found', value: list.length - found }
                ].filter(({ value }) => value > 0).map(({ name, value }) => ({ name, value, formatted: formatNum(value) }))),
                { combine: 'list' })}/>
    </Stack>}
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={ARTIFACTS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                     total={list.length} shown={shown.length} noun={'artifacts'}>
      <Toolbar.Search placeholder={'Search artifacts'}/>
      <Toolbar.Show name={'show'} label={'Show'} options={[
        ['all', 'All', list.length],
        ['upgrade', 'Not maxed', list.filter(SHOW_FILTERS.upgrade).length],
        ['missing', 'Not found', list.filter(SHOW_FILTERS.missing).length]
      ]}/>
    </Toolbar>}
    <CardGrid size={'m'}>
  {shown.map(({ artifact, index }) => {
    const { name, rawName, acquired, additionalData } = artifact;
    const tier = acquired ?? 0;
    const current = tier >= 2 ? getTierDescription(artifact, tier) : '';
    const next = tier >= 1 && tier < TIERS.length ? getTierDescription(artifact, tier + 1) : '';
    // The form's word in its colour, as the game paints it (and the old page did)
    return <ItemCard key={`${name}-${index}`} icon={artifactIcon(rawName, tier)} title={cleanUnderscore(name)} dimmed={!tier}
                     meta={tier ? <>
                       {`Tier ${tier} of ${TIERS.length} · `}
                       <Box component={'span'} sx={{ color: artifactTierColor(tier), fontWeight: 500 }}>{TIERS[tier - 1]?.full}</Box>
                     </> : sectionFailed ? undefined : 'Not acquired'}>
      <ItemCard.Desc text={withTotalLine(artifact?.description)}/>
      {/* The tier is the meta line's; the rows say what it gives now and what the next one would */}
      <ItemCard.Facts rows={[
        current ? ['Now', cleanUnderscore(current)] : null,
        next ? [`Next tier (${TIERS[tier]?.full})`, cleanUnderscore(next)] : null,
        perCharacter(name, additionalData, tier)
      ]}/>
    </ItemCard>;
  })}
    </CardGrid>
  </>;
};

export default Artifacts;
