import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import MultiCharLockText from '@components/common/MultiCharLockText';
import { getMaps, getRingBaseStats, getWeaponBaseStats, tachyonNames } from '@parsers/class-specific/tesseract';
import { createBreakdown, flatLines } from '@parsers/breakdown';

// A saved checkbox from before resets once ("Hide unlocked maps")
const MAPS_TOOLBAR = { tachyon: 'all', hideOpen: false, details: false };

// An item's base stat ranges at its quality: a list, so a breakdown under the quality it follows (Info board step 5),
// named and headed as the tile reads
const baseStats = (label, qualityText, stats) => createBreakdown(label, qualityText, flatLines((stats ?? [])
  .filter(({ name }) => name)
  .map(({ name, min, max }) => ({
    name,
    value: max,
    formatted: `${formatNum(min, 'amount', { precise: true })} to ${formatNum(max, 'amount', { precise: true })}`
  }))), { combine: 'list' });

// A map bonus moves in steps of 0.001x (the parser's kills to next step), so it keeps three decimals
// The next step of a map bonus, where the parser can name it: "TONS" is more than 100,000 kills away
const nextStep = (killsToNext) => {
  if (killsToNext === 'TONS') return 'next in more than 100K kills';
  return Number.isFinite(killsToNext) && killsToNext > 0 ? `next in ${formatNum(killsToNext, 'whole')} kills` : null;
};

// sectionFailed: the maps at zero by name, with no open state, bonus or Toolbar; the drop numbers read "-"
const Maps = ({ character, account, characters, sectionFailed }) => {
  const [view, setView, resetView] = useToolbarState('tesseract-maps', MAPS_TOOLBAR);
  const catalog = getMaps(account, characters, character) ?? [];
  const { weaponDropChance, ringDropChance, weaponQuality, ringQuality } = account?.tesseract || {};
  const weaponQualityText = formatNum(weaponQuality ?? 0);
  const ringQualityText = formatNum(ringQuality ?? 0);
  const ofType = (type) => catalog.filter(({ tachyonType }) => `${tachyonType}` === type);
  const shown = sectionFailed ? catalog : catalog.filter(({ unlocked, tachyonType }) => !(view?.hideOpen && unlocked)
    && (view?.tachyon === 'all' || `${tachyonType}` === view?.tachyon));

  return <Stack gap={3}>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'Weapon drop chance'} icon={'data/EquipmentWandsArc0.png'}
                value={sectionFailed ? '-' : formatNum(weaponDropChance, 'odds')}/>
      <StatTile label={'Weapon quality'} value={sectionFailed ? '-' : weaponQualityText} breakdownTitle={'Weapon quality'}
                breakdown={sectionFailed ? undefined : baseStats('Weapon quality', weaponQualityText, getWeaponBaseStats(weaponQuality ?? 0))}
                breakdownNoun={'stats'}/>
      <StatTile label={'Ring drop chance'} icon={'data/EquipmentRingsArc0.png'}
                value={sectionFailed ? '-' : formatNum(ringDropChance, 'odds')}/>
      <StatTile label={'Ring quality'} value={sectionFailed ? '-' : ringQualityText} breakdownTitle={'Ring quality'}
                breakdown={sectionFailed ? undefined : baseStats('Ring quality', ringQualityText, getRingBaseStats(ringQuality ?? 0))}
                breakdownNoun={'stats'}/>
    </Stack>
    {sectionFailed ? null : <Toolbar state={view} defaults={MAPS_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={catalog.length} shown={shown.length} noun={'maps'}>
      <Toolbar.Show name={'tachyon'} options={[['all', 'All tachyons', catalog.length],
        ...Object.keys(tachyonNames).map((type) => [type, tachyonNames[type], ofType(type).length])]}/>
      <Toolbar.Filter name={'hideOpen'} label={'Hide unlocked'}/>
      <Toolbar.Filter name={'details'} label={'Details'} display/>
    </Toolbar>}
    {/* A card says what its map gives: tachyons, and its three bonuses on one line. The charge and each bonus's next step
        show with the Details pill. */}
    {shown.length ? <CardGrid size={'m'} details={view?.details}>
      {shown.map(({ mapIndex, mapName, reqKills, portals, monster, unlocked, tachyonQuantity, tachyonType, mapBonuses, timeLeft }) =>
        <ItemCard key={mapIndex ?? mapName} icon={`data/Mface${monster?.MonsterFace}.png`} title={cleanUnderscore(mapName ?? '')}
                  dimmed={!sectionFailed && !unlocked}
                  more={<ItemCard.Facts rows={[
                    ['Kills to charge', formatNum(reqKills, 'whole')],
                    ['Time to charge', formatDuration(timeLeft)],
                    ...(sectionFailed ? [] : (mapBonuses ?? []).map(({ killsToNext, type }) => [`${type} next step`, nextStep(killsToNext) ?? '-']))
                  ]}/>}>
          <ItemCard.Facts rows={[
            ['Tachyons per kill', <Stack key={'tachyons'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
              {formatGame(tachyonQuantity ?? 0, 'ArcaneType.ArcaneTachyonQTYbase')}
              <GameIcon src={`data/Tach${tachyonType}_x1.png`} size={16} alt={tachyonNames[tachyonType] ?? ''}/>
            </Stack>]
          ]}/>
          {(portals ?? []).map(({ multiCharLock }, portalIndex) => <MultiCharLockText key={portalIndex} lock={multiCharLock}/>)}
          <Stack direction={'row'} columnGap={2} rowGap={0.5} flexWrap={'wrap'} aria-label={'Map bonuses'}>
            {(mapBonuses ?? []).map(({ value, type }, index) => <Stack key={index} direction={'row'} alignItems={'center'} gap={0.5}>
              <GameIcon src={`data/StatusArc${index}.png`} size={16} alt={''}/>
              <Typography variant={'body2'} component={'span'} color={'text.secondary'}>{type}</Typography>
              <Typography variant={'body2'} component={'span'} sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {!sectionFailed && Number.isFinite(value) ? formatNum(1 + value / 100, 'mult', { precise: true }) : '-'}
              </Typography>
            </Stack>)}
          </Stack>
        </ItemCard>)}
    </CardGrid> : null}
  </Stack>;
};

export default Maps;
