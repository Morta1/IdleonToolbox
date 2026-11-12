import React from 'react';
import { Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { cleanText } from '@utility/goals/registry/names';
import { getTotalStatueLevels } from '@parsers/class-specific/royalGuardian';

// game: the flair level's name, "NO_FLAIR COMMON_FLAIR GRAND_FLAIR SUPERIOR_FLAIR ELEGANT_FLAIR..." by RoyalG[22][i]
const FLAIR_NAMES = ['No flair', 'Common flair', 'Grand flair', 'Superior flair', 'Elegant flair', 'Illustrious flair', 'Mesmerizing flair'];
// A statue is named for its marble: "Leafy_Marble" is the Leafy statue. A marble the game hasn't made yet carries a
// placeholder name ("NoNotYety_Marble"), so that statue keeps its number, counted from 1
const statueTitle = (marbleName, index) => (marbleName && !/NotYet/i.test(marbleName)
  ? `${cleanUnderscore(marbleName).replace(/ Marble$/, '')} Statue` : `Statue ${index + 1}`);

const TIER_NOTE = 'Total marble to bring every statue of that marble up to this level from its current level.';
const LOCKED_TIER_NOTE = 'Locked: needs the Menagerie unlock that boosts max Flair LV of Statues to Elegant.';
// The flair costs and the marbles owned, in their game rules
const flairCost = (value) => formatGame(value ?? 0, 'RoyalG.SF_costo', { whole: true });
// The game draws a statue's sentence in font 652, whose 千 glyph is its x mark: "}千 TOTAL DAMAGE" reads "4.12x TOTAL DAMAGE"
const statueSentence = (description) => cleanText(`${description ?? ''}`.replace(/千/g, 'x'));

// A marble's costs to bring every statue to each flair level. A locked flair or tier keeps its amounts, in the muted
// color: they are what the player plans toward. Otherwise a cost already covered says so beside its amount.
const flairColumns = (statueFlair) => [
  {
    key: 'marble', label: 'Marble', value: ({ name }) => cleanUnderscore(name),
    icon: ({ costItem }) => <GameIcon src={`data/${costItem}.png`} alt={''} size={24}/>
  },
  { key: 'owned', label: 'Owned', numeric: true, value: ({ owned }) => owned, render: ({ owned }) => formatGame(owned ?? 0, 'RoyalG.SF_weOwn', { whole: true }) },
  { key: 'left', label: 'Statues left', numeric: true, value: ({ statuesLeft }) => statuesLeft },
  ...(statueFlair?.marbleTotals?.[0]?.tiers ?? []).map((_, tier) => {
    const locked = tier >= statueFlair?.maxLevel;
    return {
      key: `tier-${tier}`,
      label: `All to Lv ${tier + 1}`,
      numeric: true,
      // Short amounts: every column fits a 600 px window
      from: 'sm',
      info: locked ? LOCKED_TIER_NOTE : tier === 0 ? TIER_NOTE : undefined,
      ...(locked ? { cellSx: { color: 'text.muted' } } : {}),
      render: ({ owned, tiers }) => {
        const cost = tiers?.[tier];
        if (locked || !statueFlair?.unlocked) return cost > 0 ? flairCost(cost) : 'Done';
        if (cost <= 0) return <StatusText status={'maxed'}>Done</StatusText>;
        return owned >= cost ? <StatusText status={'ready'}>{flairCost(cost)}</StatusText> : flairCost(cost);
      }
    };
  })
];

// sectionFailed: the statues at zero by name (the parser's empty save) with no bonus or odds, and no Statue flair
const FLAIR_TOOLBAR = { hideMaxed: false };

const RoyalStatues = ({ royalStatues, statueFlair, statueLevels, sectionFailed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('royal-statue-flair', FLAIR_TOOLBAR);
  const ownedOf = (costItem) => statueFlair?.marbleTotals?.find((marble) => marble.costItem === costItem)?.owned;
  const isMaxed = ({ level, maxLevel }) => (level ?? 0) >= maxLevel;
  const flairStatues = statueFlair?.statues ?? [];
  const shownFlair = toolbar?.hideMaxed ? flairStatues.filter((statue) => !isMaxed(statue)) : flairStatues;
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <StatTile label={'Total statue levels'} value={sectionFailed ? '-' : formatNum(getTotalStatueLevels(statueLevels))}/>
      </Stack>
      {royalStatues?.length ? <CardGrid size={'s'}>
        {royalStatues.map(({ index, description, level, bonus, upgradeOdds, costItem, named, owned, marbleName }) => <ItemCard
          key={index} icon={`data/${costItem}.png`} title={statueTitle(marbleName, index)} level={{ value: level ?? 0 }}
          status={named ? undefined : 'locked'} statusLabel={'Unreleased'}>
          <ItemCard.Desc text={named ? statueSentence(description) : 'Not yet released in-game.'}/>
          {sectionFailed ? null : <ItemCard.Facts rows={[
            // A named statue's sentence prints its bonus already
            named ? null : ['Bonus', formatGame(bonus ?? 0, 'RoyalG.StatueBon')],
            ['Upgrade odds', upgradeOdds > 0 ? `1 in ${formatGame(1 / upgradeOdds, 'RoyalG.StatueUpgOdds', { whole: true })}` : '-'],
            // The game's "You have: N" of the item a try costs (one); the try greys out below it
            named ? ['You have', <Stack key={'owned'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}
                                         sx={{ color: owned >= 1 ? 'text.primary' : 'text.secondary' }}>
              {owned >= 1e9 ? formatGame(owned, 'RoyalG.SF_weOwn') : formatNum(owned ?? 0, 'whole')}
              <GameIcon src={`data/${costItem}.png`} size={16} alt={''}/>
            </Stack>] : null
          ]}/>}
        </ItemCard>)}
      </CardGrid> : null}

      {/* A section title over the marbles' Panel and the statues' cards: a Panel holds one table, cards sit on the page */}
      {sectionFailed || !statueFlair ? null : <Stack gap={2}>
        <Stack gap={0.5}>
          <Stack direction={'row'} alignItems={'center'} columnGap={1.5} flexWrap={'wrap'}>
            <Typography variant={'sectionTitle'} component={'h2'}>Statue flair</Typography>
            {statueFlair?.unlocked ? null : <StatusText status={'locked'}/>}
          </Stack>
          <Typography variant={'body2'} color={'text.secondary'}>
            Raises a regular statue&apos;s EXP multiplier, unlocked by the Statue Flair armory upgrade
          </Typography>
        </Stack>
        {statueFlair?.marbleTotals?.length > 0
          // The column's width, as the cards under it and the site's other tables
          ? <Panel title={'Marbles'}>
            <DataTable columns={flairColumns(statueFlair)} rows={statueFlair.marbleTotals} rowKey={'shardIndex'}
                       rowLabel={({ name }) => cleanUnderscore(name)}
                       // Locked flair: every cell in the muted color, its amounts kept.
                       sx={statueFlair?.unlocked ? undefined : { '& td': { color: 'text.muted' } }}/>
          </Panel>
          : null}
        {flairStatues.length ? <Toolbar state={toolbar} defaults={FLAIR_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                        total={flairStatues.length} shown={shownFlair.length} noun={'statues'}
                                        emptyNote={'Every statue is at its max flair level.'}>
          <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        </Toolbar> : null}
        {shownFlair.length ? <CardGrid size={'s'}>
          {/* At its max a card is Maxed, which drops the cost: the parser still prices a level past the cap */}
          {shownFlair.map(({ index, name, level, maxLevel, cost, bonus, expMulti, costItem }) => <ItemCard
            key={index} title={titleCaseName(cleanText(name))} level={{ value: level ?? 0, max: maxLevel }} dimmed={!statueFlair?.unlocked}
            meta={FLAIR_NAMES[level ?? 0]}
            status={isMaxed({ level, maxLevel }) ? 'maxed' : undefined}
            footer={<ItemCard.Cost icon={`data/${costItem}.png`} iconAlt={cleanUnderscore(statueFlair?.marbleTotals
              ?.find((marble) => marble.costItem === costItem)?.name ?? '')} game={'RoyalG.SF_costo'} need={cost}
                                   have={ownedOf(costItem)}/>}>
            <ItemCard.Facts rows={[
              ['EXP multi', `${formatGame(expMulti ?? 1, 'RoyalG.SF_bonus')}x`],
              ['Bonus', `+${formatNum(bonus ?? 0)}%`]
            ]}/>
          </ItemCard>)}
        </CardGrid> : null}
      </Stack>}
    </Stack>
  );
};

export default RoyalStatues;
