import { Box, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, notateNumber } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { LevelsAheadCaption } from './useMasterclassCostControls';

// Compass / Tesseract / Grimoire upgrade card. `frame` draws a sprite behind the icon (the compass shape). costGame is
// the system's cost rule (gameNotation), currencyName names the cost's sprite, which stands alone beside the numbers.
// catalogOnly: a failed section's catalog at zero (the parser's empty save): the upgrade by name, no cost or state.
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
                                  currencyName = '',
                                  costGame = 'Big',
                                  owned,
                                  nextCost,
                                  targetLevel,
                                  targetCost,
                                  unlockText,
                                  unlocked,
                                  catalogOnly
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
                   status={catalogOnly ? undefined : isMaxed ? 'maxed' : unlocked ? undefined : 'locked'}
                   footer={catalogOnly ? null : <>
                     <ItemCard.Cost icon={`data/${currencyIcon}.png`} iconAlt={currencyName} game={costGame} need={nextCost}
                                    have={owned}/>
                     {targetLevel > level + 1
                       ? <LevelsAheadCaption targetLevel={formatNum(targetLevel)} targetCost={targetCost} owned={owned} indent={32}/>
                       : null}
                     {unlockText ? <Typography variant={'body2'} color={'text.secondary'}>{unlockText}</Typography> : null}
                   </>}>
    <ItemCard.Desc text={description}/>
    <ItemCard.Facts rows={[!catalogOnly && !isMaxed && nextLevelBonus ? ['Next level bonus', nextLevelBonus] : null]}/>
    {extraData ? <ItemCard.Desc>{extraData}</ItemCard.Desc> : null}
  </ItemCard>
};

// "1.25x (+0.05x)" for multiplier upgrades, "125 (+5)" for flat ones, as the card's sentence fills its { : the system's
// rule (bonusGame), a compass row whose bonus per level is under 0.9 in NotateNumber Small (the parser's smallNotation)
// so its decimals show, and without a rule the amount kind (Tesseract: its sentence fills { in commas, where its
// ArcaneUpgBonus rule says Big)
export const formatNextLevelBonus = ({ isMulti, smallNotation, nextLevelBonus, bonusDiff }, bonusGame) => {
  const value = isMulti
    ? formatNum(1 + nextLevelBonus / 100, 'mult')
    : smallNotation ? notateNumber(nextLevelBonus, 'Small')
      : bonusGame ? formatGame(nextLevelBonus, bonusGame) : formatNum(nextLevelBonus, 'amount', { precise: true });
  const diff = isMulti
    ? formatNum(bonusDiff / 100, 'mult', { signed: true, precise: true })
    : formatNum(bonusDiff, 'amount', { signed: true, precise: true });
  return `${value} (${diff})`;
};

// A masterclass sentence as the game draws it: the parser filled { and }, and the page fills $ where the toolbox
// knows the number (Decision 6); a $ it cannot compute reads "?" rather than a sentence with a hole. The game's own
// "2.00x" keeps its decimals.
export const masterclassText = (description, dollar) => cleanUnderscore(`${description ?? ''}`).split('$').join(dollar ?? '?');

export default MasterclassUpgradeCard;
