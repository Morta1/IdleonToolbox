import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { calcPrayerCost, getPrayers } from '@parsers/world-3/prayers';
import { items as itemsTable } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// A prayer at Lv 0 reads its first level's numbers (Decision 11); the game's x1 + x1 * (lv - 1) / 10
const prayerValue = (base, level) => base + (base * (Math.max(1, level ?? 0) - 1)) / 10;
const fillPrayer = (text, value) => cleanUnderscore(text ?? '').replace('{', formatNum(value, 'amount', { precise: true }));
const soulName = (rawName) => cleanUnderscore(itemsTable?.[rawName]?.displayName ?? rawName);

const calcCostToMax = (prayer) => Array.from({ length: Math.max(0, (prayer?.maxLevel ?? 0) - (prayer?.level ?? 0)) },
  (_, step) => calcPrayerCost({ ...prayer, level: (prayer?.level ?? 0) + step }))
  .reduce((sum, cost) => sum + cost, 0);

const Prayers = () => {
  const { state } = useContext(AppContext);
  const sectionFailed = isSectionFailed(state?.account, 'prayers');
  const parsed = state?.account?.prayers ?? [];
  // A failed section lists the prayers at zero (the parser's catalog with no save), with no costs or states
  const prayers = sectionFailed && !parsed.length ? getPrayers({}, state?.account?.storage?.list) : parsed;
  const characters = state?.characters ?? [];

  return (
    <>
      <NextSeo
        title="Prayers | Idleon Toolbox"
        description="View your active prayers, curse penalties, and soul bonuses to optimize worship in Legends of Idleon"
      />
      {sectionFailed ? <MissingData name={'Prayers'} failed/> : null}
      <CardGrid size={'m'}>
        {prayers.map((prayer, index) => {
          const { name, x1, x2, level = 0, prayerIndex, effect, curse, soul, maxLevel, totalAmount, unlockWave, unlockZone } = prayer;
          // A failed section has no levels, so a prayer listed as equipped would sit under "Lv 0 / 50"
          const equippedBy = sectionFailed ? [] : characters.filter((character) =>
            character?.activePrayers?.some((active) => active?.prayerIndex === prayerIndex));
          const priced = !sectionFailed && level < maxLevel;
          return <ItemCard key={`${name}-${index}`} icon={`data/Prayer${prayerIndex}.png`} title={cleanUnderscore(name)}
                           level={{ value: level, max: maxLevel }} dimmed={!sectionFailed && !level}
                           status={!sectionFailed && level >= maxLevel ? 'maxed' : undefined}
                           footer={priced ? <ItemCard.Cost icon={`data/${soul}.png`} iconAlt={soulName(soul)}
                                                           need={calcPrayerCost(prayer)} have={totalAmount ?? 0}
                                                           game={'WorshipStuff.PrayerCost'}/> : null}>
            <ItemCard.Facts rows={[
              ['Bonus', fillPrayer(effect, prayerValue(x1, level))],
              ['Curse', fillPrayer(curse, prayerValue(x2, level))],
              ['Unlocks at', `Wave ${formatNum(unlockWave ?? 0)} in ${cleanUnderscore(unlockZone ?? '')}`],
              priced ? ['Cost to max', formatGame(calcCostToMax(prayer), 'WorshipStuff.PrayerCost')] : null
            ]}/>
            {equippedBy.length ? <ItemCard.Section label={'Equipped by'}>
              <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
                {equippedBy.map((character) => <Stack key={character?.name} direction={'row'} alignItems={'center'} gap={0.5}>
                  <GameIcon src={`data/ClassIcons${character?.classIndex}.png`} size={24} alt={''}/>
                  <Typography variant={'body2'}>{character?.name}</Typography>
                </Stack>)}
              </Stack>
            </ItemCard.Section> : null}
          </ItemCard>;
        })}
      </CardGrid>
    </>
  );
};

export default Prayers;
