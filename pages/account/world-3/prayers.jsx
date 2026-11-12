import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { fillPrayer, formatGame, prayerValue } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { calcPrayerCost, getPrayerBonusAndCurse, getPrayers } from '@parsers/world-3/prayers';
import { isSuperbitUnlocked } from '@parsers/world-5/gaming';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { items as itemsTable } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

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
  const account = state?.account;
  // Gaming's superbits: with No more Praying or Prayers Begone, a character with no prayer equipped gets a fifth of every
  // levelled prayer's bonus per superbit (Prayers Ain't Meta adds a third fifth), with no curse (getPrayerBonusAndCurse)
  const superbits = ['No_more_Praying', 'Prayers_Begone', 'Prayers_Aint_Meta'].filter((name) => isSuperbitUnlocked(account, name));
  const passiveOn = !sectionFailed && (isSuperbitUnlocked(account, 'No_more_Praying') || isSuperbitUnlocked(account, 'Prayers_Begone'));
  const passiveShare = 20 * superbits.length;
  // Each soul the prayers cost, once, with what you own of it
  const souls = [...new Map(prayers.filter(({ soul }) => soul).map(({ soul, totalAmount }) => [soul, totalAmount ?? 0])).entries()];

  return (
    <>
      <NextSeo
        title="Prayers | Idleon Toolbox"
        description="View your active prayers, curse penalties, and soul bonuses to optimize worship in Legends of Idleon"
      />
      {sectionFailed ? <MissingData name={'Prayers'} failed atZero/> : null}
      {sectionFailed ? null : <PageSummary>
        {passiveOn ? <StatTile label={'With no prayer equipped'} value={formatNum(passiveShare, 'pct')}
                               sub={'of every prayer, no curse'}
                               info={'Your Gaming superbits give a character with no prayer equipped this share of every levelled prayer\'s bonus, and none of the curses. Each card shows what that is.'}/> : null}
        {souls.map(([rawName, amount]) => <StatTile key={rawName} label={soulName(rawName)} icon={`data/${rawName}.png`}
                                                     value={formatGame(amount, 'WorshipStuff.PrayerCost', { whole: true })}/>)}
      </PageSummary>}
      <CardGrid size={'m'}>
        {prayers.map((prayer, index) => {
          const { name, x1, x2, level = 0, prayerIndex, effect, curse, soul, maxLevel, totalAmount, unlockWave, unlockZone } = prayer;
          // A failed section has no levels, so a prayer listed as equipped would sit under "Lv 0 / 50"
          const equippedBy = sectionFailed ? [] : characters.filter((character) =>
            character?.activePrayers?.some((active) => active?.prayerIndex === prayerIndex));
          const priced = !sectionFailed && level < maxLevel;
          const passiveBonus = passiveOn && level > 0 ? getPrayerBonusAndCurse([], name, account).bonus : 0;
          return <ItemCard key={`${name}-${index}`} icon={`data/Prayer${prayerIndex}.png`} title={cleanUnderscore(name)}
                           level={{ value: level, max: maxLevel }} dimmed={!sectionFailed && !level}
                           status={!sectionFailed && level >= maxLevel ? 'maxed' : undefined}
                           footer={priced ? <ItemCard.Cost icon={`data/${soul}.png`} iconAlt={soulName(soul)}
                                                           need={calcPrayerCost(prayer)} have={totalAmount ?? 0}
                                                           game={'WorshipStuff.PrayerCost'}/> : null}>
            <ItemCard.Facts rows={[
              ['Bonus', fillPrayer(effect, prayerValue(x1, level))],
              ['Curse', fillPrayer(curse, prayerValue(x2, level))],
              // The game leaves one prayer (Tachion of the Titans) out of the superbit share: no row where it gives nothing
              passiveBonus > 0 ? ['With none equipped', fillPrayer(effect, passiveBonus)] : null,
              ['Unlocks at', `Wave ${formatNum(unlockWave ?? 0)} in ${cleanUnderscore(unlockZone ?? '')}`],
              priced ? ['Cost to max', formatGame(calcCostToMax(prayer), 'WorshipStuff.PrayerCost', { whole: true })] : null
            ]}/>
            {equippedBy.length ? <ItemCard.Section label={'Equipped by'}>
              <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
                {equippedBy.map((character) => <Stack key={character?.name} direction={'row'} alignItems={'center'} gap={0.5}>
                  <GameIcon src={`data/ClassIcons${character?.classIndex}.png`} size={24} alt={''}/>
                  <Typography variant={'body2'}>{cleanUnderscore(character?.name)}</Typography>
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
