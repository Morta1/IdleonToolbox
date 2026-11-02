import { Box, Typography } from '@mui/material';
import { commaNotation, formatNum, notateNumber } from '@utility/helpers';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { LevelsAheadCaption } from './useMasterclassCostControls';

// Compass / Tesseract / Grimoire upgrade card. `frame` draws a sprite behind the icon (the compass shape).
const MasterclassUpgradeCard = ({
                                  name,
                                  icon,
                                  frame,
                                  helpIcon,
                                  level,
                                  maxLevel,
                                  description,
                                  nextLevelBonus,
                                  extraData,
                                  currencyIcon,
                                  owned,
                                  nextCost,
                                  targetLevel,
                                  targetCost,
                                  unlockText,
                                  unlocked
                                }) => {
  const isMaxed = level >= maxLevel;
  // The help i keeps the name's last word on its line: a name that fills the card wraps that word with the
  // i, never the i alone.
  const title = cleanUpgradeName(name);
  const lastWordAt = title.lastIndexOf(' ') + 1;
  return <ItemCard icon={<GameIcon src={`data/${icon}.png`} frame={frame ? `data/${frame}.png` : undefined} size={40} alt={''}/>}
                   title={helpIcon ? <>
                     {title.slice(0, lastWordAt)}
                     <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{title.slice(lastWordAt)}{helpIcon}</Box>
                   </> : title}
                   level={{ value: level, max: maxLevel }}
                   status={isMaxed ? 'maxed' : unlocked ? undefined : 'locked'}
                   footer={<>
                     <ItemCard.Cost icon={`data/${currencyIcon}.png`} need={nextCost} have={owned}/>
                     {targetLevel > level + 1
                       ? <LevelsAheadCaption targetLevel={targetLevel} targetCost={targetCost} owned={owned} indent={32}/>
                       : null}
                     {unlockText ? <Typography variant={'body2'} color={'text.secondary'}>{unlockText}</Typography> : null}
                   </>}>
    <ItemCard.Desc text={description}/>
    <ItemCard.Facts rows={[!isMaxed && nextLevelBonus ? ['Next level bonus', nextLevelBonus] : null]}/>
    {extraData ? <ItemCard.Desc>{extraData}</ItemCard.Desc> : null}
  </ItemCard>
};

// "1.25x (+0.05)" for multiplier upgrades, "125 (+5)" for flat ones
export const formatNextLevelBonus = ({ isMulti, smallNotation, nextLevelBonus, bonusDiff }) => {
  const value = isMulti
    ? notateNumber(1 + nextLevelBonus / 100, 'MultiplierInfo')
    : smallNotation ? notateNumber(nextLevelBonus, 'Small') : commaNotation(nextLevelBonus);
  return `${value} (${formatNum(bonusDiff, 'amount', { signed: true, precise: true })})`;
};

export default MasterclassUpgradeCard;
