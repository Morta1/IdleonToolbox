import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const Whole = ({ children }) => <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{children}</Box>;

// A bonus name breaks only before its last two words ("Artifact / Find Chance"), so "Loot Value" never splits
const bonusName = (name) => {
  const words = cleanUnderscore(name ?? '').split(' ');
  const head = words.slice(0, -2).join(' ');
  return <span>{head ? `${head} ` : null}<Whole>{words.slice(-2).join(' ')}</Whole></span>;
};

// A captain's bonus: its sprite and name, the total and the per level gain (a shop captain only has the per level gain),
// the gain one piece. Two rolls of one bonus are the game's two rolls, so both rows stay.
const bonusRow = (shop, index, name, total, perLevel) => {
  const gain = `${formatNum(perLevel ?? 0, 'pct', { signed: true })} per level`;
  return [
    <Stack key={'name'} component={'span'} direction={'row'} gap={1} alignItems={'center'}>
      <GameIcon src={`etc/Sailing_Skill_${index}.png`} size={24} alt={''}/>{bonusName(name)}
    </Stack>,
    shop
      ? <Whole key={'gain'}>{gain}</Whole>
      : <React.Fragment key={'gain'}>{formatNum(total ?? 0, 'pct', { signed: true })} <Whole>({gain})</Whole></React.Fragment>
  ];
};

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
                                          value={formatGame(expValue ?? 0, 'Sailing.CaptainExpReq', { whole: true })}
                                          max={formatGame(expReqValue ?? 0, 'Sailing.CaptainExpReq', { whole: true })}/> : null}
    {!empty ? <ItemCard.Facts rows={[
      bonusRow(shop, firstBonusIndex, firstBonusName, firstBonus, firstBonusValue),
      secondBonusIndex >= 0 && secondBonusValue > 0 ? bonusRow(shop, secondBonusIndex, secondBonusName, secondBonus, secondBonusValue) : null
    ]}/> : null}
  </ItemCard>;
};

export default Captain;
