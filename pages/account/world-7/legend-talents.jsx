import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box } from '@mui/material';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The game's colour for its "the Luminous Menagerie" link in talent descriptions, beside the four fever squares'
const MENAGERIE = 'Menagerie';
const SOURCE_COLORS = {
  Yellow: 'identity.fever.yellow',
  Red: 'identity.fever.red',
  Brown: 'identity.fever.brown',
  Green: 'identity.fever.green',
  [MENAGERIE]: 'identity.fever.menagerie'
};
const sourceLabel = (source) => (source === MENAGERIE ? MENAGERIE : `${source} Fever`);
const hasSource = (talent, source) => (source === MENAGERIE ? Boolean(talent?.menagerie) : talent?.fever?.color === source);

const TALENTS_TOOLBAR = { search: '', source: '', hideMaxed: false };

// Raised sources read "2 base · +1 Red · +3 Menagerie"; a source not bought yet shows as a hint, "Red Fever"
const maxLevelParts = (talent) => {
  const { fever, menagerie } = talent ?? {};
  const raised = [
    fever?.level > 0 && { color: SOURCE_COLORS[fever.color], text: `+${formatNum(fever.level)} ${fever.color}` },
    menagerie?.bonus > 0 && { color: SOURCE_COLORS[MENAGERIE], text: `+${formatNum(menagerie.bonus)} ${MENAGERIE}` }
  ].filter(Boolean);
  const hints = [
    fever && !fever.level && { color: SOURCE_COLORS[fever.color], text: sourceLabel(fever.color) },
    menagerie && !menagerie.bonus && { color: SOURCE_COLORS[MENAGERIE], text: MENAGERIE }
  ].filter(Boolean);
  return [
    ...(raised.length ? [{ color: 'text.secondary', text: `${formatNum(talent?.baseMaxLevel ?? 0)} base` }, ...raised] : []),
    ...hints
  ];
};

// Each source in its color beside its words, so the color is never the only sign
const sourcesLine = (parts) => parts.map(({ color, text }, index) => <React.Fragment key={text}>
  {index > 0 ? ' · ' : null}
  <Box component={'span'} sx={{ color, whiteSpace: 'nowrap' }}>{text}</Box>
</React.Fragment>);

const talentCard = (talent) => {
  const parts = maxLevelParts(talent);
  return <ItemCard key={talent?.originalIndex} icon={`data/LegendTalentIcon${talent?.index}.png`}
                   title={cleanUnderscore(talent?.name)}
                   level={{ value: talent?.level ?? 0, max: talent?.maxLevel }}
                   meta={parts.length ? sourcesLine(parts) : undefined}
                   status={talent?.level >= talent?.maxLevel ? 'maxed' : undefined}
                   dimmed={!(talent?.level > 0)}>
    {talent?.description ? <ItemCard.Desc text={talent.description}/> : null}
  </ItemCard>;
};

const LegendTalents = () => {
  const { state } = useContext(AppContext);
  const section = state?.account?.legendTalents;
  const sectionFailed = isSectionFailed(state?.account, 'legendTalents');
  const { talents, pointsSpent, pointsOwned, pointsLeftToSpend } = section ?? {};
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('legend-talents', TALENTS_TOOLBAR);
  const list = talents ?? [];
  const search = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = list.filter((talent) => (!search || cleanUnderscore(talent?.name ?? '').toLowerCase().includes(search)
      || cleanUnderscore(talent?.description ?? '').toLowerCase().includes(search))
    && !(toolbar?.hideMaxed && talent?.level >= talent?.maxLevel)
    && (!toolbar?.source || hasSource(talent, toolbar.source)));

  return <>
    <NextSeo
      title="Legend Talents | Idleon Toolbox"
      description="View your Legend talent levels, bonus effects, and upgrade costs in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'Legend Talents'} failed={sectionFailed}/> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Legend points'} value={pointsOwned?.value ?? 0} kind={'amount'}
                breakdown={pointsOwned?.breakdown} breakdownTitle={'Legend points'}/>
      <StatTile label={'Points spent'} value={pointsSpent ?? 0} kind={'amount'}
                sub={`${formatNum(Math.max(0, pointsLeftToSpend ?? 0))} unspent`}/>
    </PageSummary>
    <Box>
      {sectionFailed ? null : <Toolbar state={toolbar} defaults={TALENTS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={list.length} shown={shown.length} noun={'talents'}>
        <Toolbar.Search placeholder={'Search talents'}/>
        <Toolbar.Lead>
          <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
            <InfoButton label={'Max LV sources'}>
              Each Legendary Fever square in the Research Grid adds 1 max level per square level, up to 3, to its five
              talents, and some Luminous Menagerie unlocks add more. A card names the sources that reach it; Show picks
              one source&apos;s talents.
            </InfoButton>
          </Box>
        </Toolbar.Lead>
        <Toolbar.Show name={'source'} options={[
          ['', 'All talents', list.length],
          ...Object.keys(SOURCE_COLORS).map((source) => [source, sourceLabel(source),
            list.filter((talent) => hasSource(talent, source)).length])
        ]}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
      </Toolbar>}
      <CardGrid size={'m'}>{shown.map(talentCard)}</CardGrid>
    </Box>
  </>;
};

export default LegendTalents;
