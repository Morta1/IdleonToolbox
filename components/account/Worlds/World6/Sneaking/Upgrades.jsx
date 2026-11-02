import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const Upgrades = ({ upgrades, omnijade }) => {
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
                                               : null}>
            <ItemCard.Desc text={description?.replace(/}|{/g, bonus)}/>
          </ItemCard> : null;
        })}
      </CardGrid>
    </>
  );
};

export default Upgrades;
