import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

// A captain's bonus: its sprite and name, the total and the per level gain (a shop captain only has the per level gain).
// Two rolls of one bonus are the game's two rolls, so both rows stay.
const bonusRow = (shop, index, name, total, perLevel) => [
  <Stack key={'name'} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
    <GameIcon src={`etc/Sailing_Skill_${index}.png`} size={24} alt={''}/>{cleanUnderscore(name)}
  </Stack>,
  shop
    ? `${formatNum(perLevel ?? 0, 'pct', { signed: true })} per level`
    : `${formatNum(total ?? 0, 'pct', { signed: true })} (${formatNum(perLevel ?? 0, 'pct', { signed: true })} per level)`
];

const Captain = ({
                   lootPile,
                   shop,
                   captainsOnBoats,
                   firstBonusName,
                   secondBonusName,
                   firstBonus,
                   secondBonus,
                   firstBonusValue,
                   secondBonusValue,
                   level,
                   expValue,
                   expReqValue,
                   firstBonusIndex,
                   secondBonusIndex,
                   captainIndex,
                   captainType,
                   cost
                 }) => {
  const empty = captainType === -1;
  const boatIndex = captainsOnBoats?.[captainIndex];
  return <ItemCard icon={<GameIcon src={`etc/Captain_${empty ? 0 : captainType}.png`} size={40} alt={''}
                                   status={empty ? 'missing' : undefined}/>}
                   title={shop ? 'Shop captain' : `Captain ${captainIndex}`}
                   level={!shop && !empty ? { value: level ?? 0 } : undefined}
                   meta={shop ? undefined : empty ? 'Empty slot' : boatIndex >= 0 ? `Boat ${boatIndex + 1}` : 'Not on a boat'}
                   footer={shop && !empty ? <ItemCard.Cost icon={'data/SailT0.png'} iconAlt={'Gold bars'} need={cost ?? 0}
                                                           have={lootPile?.[0]?.amount ?? 0} game={'Sailing.BuyCaptainCost'}/> : null}>
    {/* The captain's EXP, both sides in the game's rule for it */}
    {!shop && !empty ? <ItemCard.Progress label={'EXP'} percent={Math.min(100, 100 * (expValue ?? 0) / (expReqValue || 1))}
                                          value={formatGame(expValue ?? 0, 'Sailing.CaptainExpReq')}
                                          max={formatGame(expReqValue ?? 0, 'Sailing.CaptainExpReq')}/> : null}
    {!empty ? <ItemCard.Facts rows={[
      bonusRow(shop, firstBonusIndex, firstBonusName, firstBonus, firstBonusValue),
      secondBonusIndex >= 0 && secondBonusValue > 0 ? bonusRow(shop, secondBonusIndex, secondBonusName, secondBonus, secondBonusValue) : null
    ]}/> : null}
  </ItemCard>;
};

export default Captain;
