import React from 'react';
import { Stack } from '@mui/material';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import { LevelsAheadCaption, MAX_LEVELS_AHEAD } from '@components/common/LevelsAhead';
import PageSettings from '@components/common/PageSettings';
import { getMenagerieBoostTotalCost } from '@parsers/world-7/menagerie';
import { DOUBLER_ICONS, formatLumi, LUMI_ICON, RankRequired } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const DOUBLER_CARDS = [
  { key: 'blackStars', title: 'Black Stars' },
  { key: 'organicLabels', title: 'Organic Labels' },
  { key: 'minehead', title: 'Minehead Doublers' },
  { key: 'sushi', title: 'Sushi Station Doublers' },
  { key: 'jellyOperator', title: 'Jelly Operator Doublers' },
  { key: 'omnijade', title: 'Omnijade' }
];

// Levels ahead prices this tab only: in the Menagerie's gear, under the tab's name
export const BOOSTS_SETTINGS = { levelsAhead: null };

export const BoostsSettings = () => <PageSettings.Group title={'Boosts'}>
  <PageSettings.Number name={'levelsAhead'} label={'Levels ahead'} defaultValue={1} min={1} max={MAX_LEVELS_AHEAD} integer
                       help={'Each boost also shows the total cost of this many levels.'}/>
</PageSettings.Group>;

const Boosts = ({ account, boosts, doublers, lumi, levelsAhead = 1 }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {DOUBLER_CARDS.map(({ key, title }) => {
        const { owned = 0, left = 0 } = doublers?.[key] ?? {};
        const used = owned - Math.max(0, left);
        return <StatTile key={key} label={title} icon={DOUBLER_ICONS[key]} value={`${formatNum(used)} / ${formatNum(owned)}`}/>;
      })}
    </Stack>
    <CardGrid size={'m'}>
      {boosts?.map(({ index, description, level, perLevel, cost, visible, rankRequired }) => {
        const targetLevel = (level ?? 0) + levelsAhead;
        return <ItemCard key={`boost-${index}`}
                         icon={`data/MenaIconP${index}.png`}
                         iconSize={56}
                         title={description}
                         level={{ value: level ?? 0 }}
                         status={visible ? undefined : 'locked'}
                         footer={visible ? <>
                           <ItemCard.Cost icon={LUMI_ICON} iconAlt={'Lumi'} need={cost} have={lumi ?? 0} game={'MenagerieStuff.Cost'}/>
                           {levelsAhead > 1
                             ? <LevelsAheadCaption targetLevel={formatNum(targetLevel)}
                                                   targetCost={getMenagerieBoostTotalCost(account, index, targetLevel)}
                                                   owned={lumi ?? 0} format={formatLumi} indent={32}/>
                             : null}
                         </> : <RankRequired rank={rankRequired}/>}>
          <ItemCard.Facts rows={[['Per LV', perLevel ?? 0, 'amount']]}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Boosts;
