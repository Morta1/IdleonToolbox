import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { LevelsAheadCaption, sumLevelCosts } from '@components/common/LevelsAhead';
import { formatGame } from '@utility/gameNotation';
import { getJadeUpgCost } from '@parsers/world-6/sneaking';

const COST_RULE = 'Ninja.JadeUpgCost';
const formatJade = (value) => formatGame(value, COST_RULE, { whole: true });

// The save keeps the coins as text past 1e21
const Upgrades = ({ account, characters, upgrades, omnijade, jadeCoins, levelsAhead = 1 }) => {
  const owned = Number(jadeCoins ?? 0);
  return (
    <>
      {omnijade?.owned > 0 ? <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={2}>
        <DoublerUsageCard title={'Omnijade'} doubler={omnijade} icon={DOUBLER_ICONS.omnijade}/>
        {/* The game's "Omnijade gives +N LVs every day, all without raising Jade Cost!" */}
        <StatTile label={'Omnijade daily levels'} icon={DOUBLER_ICONS.omnijade}
                  value={`+${omnijade?.dailyLevels ?? 1} LV per day`}/>
      </Stack> : null}
      <CardGrid size={'m'}>
        {upgrades?.map(({
          level,
          name,
          description,
          modifier,
          value,
          isUnlocked,
          prerequisiteIndex,
          unlockMastery,
          omnijadeLevels,
          omnijadePlaced
        }, index) => {
          const bonus = description?.includes('{')
            ? value ?? (level * modifier)
            : formatNum(1 + (value ?? level * modifier) / 100, 'mult', { bare: true });
          const hasOmnijade = omnijadePlaced || omnijadeLevels > 0;
          // A locked upgrade says why in its footer (the Notices board)
          const lockReason = unlockMastery !== null && unlockMastery !== undefined ? `Unlocks at Ninja Mastery ${unlockMastery}`
            : prerequisiteIndex !== null && upgrades?.[prerequisiteIndex] ? `Requires ${cleanUnderscore(upgrades[prerequisiteIndex].name)}` : null;
          // The cost reads the raw level: Omnijade levels never raise it (the game's "without raising Jade Cost")
          const costAt = (at) => getJadeUpgCost(account, characters, index, at);
          const targetLevel = (level ?? 0) + levelsAhead;
          // An Omnijade upgrade shows its level with the Omnijade levels added, like the game's gold level
          return name !== 'Name' ? <ItemCard key={'upgrade-' + index} icon={`data/NjUpgI${index}.png`} title={cleanUnderscore(name)}
                                             level={{ value: (level ?? 0) + (hasOmnijade ? omnijadeLevels : 0) }}
                                             dimmed={!isUnlocked}
                                             aside={hasOmnijade ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                                               <GameIcon src={DOUBLER_ICONS.omnijade} size={16} alt={''}/>
                                               <Typography variant={'caption'} color={'text.info'}>Omnijade +{omnijadeLevels} LV</Typography>
                                             </Stack> : null}
                                             footer={!isUnlocked && lockReason
                                               ? <Typography variant={'body2'} color={'text.secondary'}>{lockReason}</Typography>
                                               : <>
                                                 <ItemCard.Cost icon={'etc/jade_coin.png'} iconAlt={'Jade coins'} need={costAt(level ?? 0)}
                                                                have={owned} game={COST_RULE}/>
                                                 {levelsAhead > 1
                                                   ? <LevelsAheadCaption targetLevel={formatNum(targetLevel)} owned={owned} format={formatJade}
                                                                         targetCost={sumLevelCosts(costAt, level ?? 0, targetLevel)} indent={32}/>
                                                   : null}
                                               </>}>
            <ItemCard.Desc text={description?.replace(/}|{/g, bonus)}/>
          </ItemCard> : null;
        })}
      </CardGrid>
    </>
  );
};

export default Upgrades;
