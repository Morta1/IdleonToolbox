import React from 'react';
import { Box, Stack } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { cleanText } from '@utility/goals/registry/names';
import { getTotalStatueLevels } from '@parsers/class-specific/royalGuardian';

const TIER_NOTE = 'Total marble to bring every statue of that marble up to this level from its current level.';
const LOCKED_TIER_NOTE = 'Locked: needs the Menagerie unlock that boosts max Flair LV of Statues to Elegant.';
// The flair costs and the marbles owned, in their game rules
const flairCost = (value) => formatGame(value ?? 0, 'RoyalG.SF_costo');
// The game draws a statue's sentence in font 652, whose 千 glyph is its x mark: "}千 TOTAL DAMAGE" reads "4.12x TOTAL DAMAGE"
const statueSentence = (description) => cleanText(`${description ?? ''}`.replace(/千/g, 'x'));

// A marble's costs to bring every statue to each flair level. A locked flair or tier keeps its amounts, in the muted
// color: they are what the player plans toward. Otherwise a cost already covered says so beside its amount.
const flairColumns = (statueFlair) => [
  {
    key: 'marble', label: 'Marble', value: ({ name }) => cleanUnderscore(name),
    icon: ({ costItem }) => <GameIcon src={`data/${costItem}.png`} alt={''} size={24}/>
  },
  { key: 'owned', label: 'Owned', numeric: true, value: ({ owned }) => owned, render: ({ owned }) => formatGame(owned ?? 0, 'RoyalG.SF_weOwn') },
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
const RoyalStatues = ({ royalStatues, statueFlair, statueLevels, sectionFailed }) => {
  const ownedOf = (costItem) => statueFlair?.marbleTotals?.find((marble) => marble.costItem === costItem)?.owned;
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        <StatTile label={'Total statue levels'} value={sectionFailed ? '-' : formatNum(getTotalStatueLevels(statueLevels))}/>
      </Stack>
      {royalStatues?.length ? <CardGrid size={'s'}>
        {royalStatues.map(({ index, description, level, bonus, upgradeOdds, costItem, named }) => <ItemCard
          key={index} icon={`data/${costItem}.png`} title={`Statue ${index}`} level={{ value: level ?? 0 }}
          status={named ? undefined : 'locked'} statusLabel={'Unreleased'}>
          <ItemCard.Desc text={named ? statueSentence(description) : 'Not yet released in-game.'}/>
          {sectionFailed ? null : <ItemCard.Facts rows={[
            // A named statue's sentence prints its bonus already
            named ? null : ['Bonus', formatGame(bonus ?? 0, 'RoyalG.StatueBon')],
            ['Upgrade odds', upgradeOdds > 0 ? `1 in ${formatGame(1 / upgradeOdds, 'RoyalG.StatueUpgOdds')}` : '-']
          ]}/>}
        </ItemCard>)}
      </CardGrid> : null}

      {sectionFailed || !statueFlair ? null : <Panel title={'Statue flair'}
                                                    aside={statueFlair?.unlocked ? null : <StatusText status={'locked'}/>}
                                                    meta={'Raises a regular statue\'s EXP multiplier, unlocked by the Statue Flair armory upgrade'}>
        <Stack gap={2} sx={{ p: 2 }}>
          {statueFlair?.marbleTotals?.length > 0 ? (
            // A phone hides columns behind chevrons, so the table takes the width it has instead of its own.
            <Box sx={{ width: { xs: '100%', sm: 'fit-content' }, maxWidth: '100%' }}>
              <DataTable columns={flairColumns(statueFlair)} rows={statueFlair.marbleTotals} rowKey={'shardIndex'}
                         rowLabel={({ name }) => cleanUnderscore(name)} surface={'card'}
                         // Locked flair: every cell in the muted color, its amounts kept.
                         sx={statueFlair?.unlocked ? undefined : { '& td': { color: 'text.muted' } }}/>
            </Box>
          ) : null}
          {statueFlair?.statues?.length ? <CardGrid size={'s'}>
            {statueFlair.statues.map(({ index, name, level, maxLevel, cost, bonus, expMulti, costItem }) => <ItemCard
              key={index} title={titleCaseName(cleanText(name))} level={{ value: level ?? 0, max: maxLevel }} dimmed={!statueFlair?.unlocked}
              footer={<ItemCard.Cost icon={`data/${costItem}.png`} iconAlt={cleanUnderscore(statueFlair?.marbleTotals
                ?.find((marble) => marble.costItem === costItem)?.name ?? '')} game={'RoyalG.SF_costo'} need={cost}
                                     have={ownedOf(costItem)}/>}>
              <ItemCard.Facts rows={[
                ['EXP multi', `${formatGame(expMulti ?? 1, 'RoyalG.SF_bonus')}x`],
                ['Bonus', `+${formatNum(bonus ?? 0)}%`]
              ]}/>
            </ItemCard>)}
          </CardGrid> : null}
        </Stack>
      </Panel>}
    </Stack>
  );
};

export default RoyalStatues;
