import { Box, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, formatNum, notateNumber, SHORT_FROM, shownDifference } from '@utility/helpers';
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
                                  // A caption under the cost: how far off the priced level is (the Armory)
                                  footerLine,
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
                   // An uncapped upgrade (an armory shelf past 999) reads its level with no max
                   level={{ value: level, max: Number.isFinite(maxLevel) ? maxLevel : null }}
                   status={catalogOnly ? undefined : isMaxed ? 'maxed' : unlocked ? undefined : 'locked'}
                   footer={catalogOnly ? null : <>
                     <ItemCard.Cost icon={`data/${currencyIcon}.png`} iconAlt={currencyName} game={costGame} need={nextCost}
                                    have={owned}/>
                     {targetLevel > level + 1
                       ? <LevelsAheadCaption targetLevel={formatNum(targetLevel)} targetCost={targetCost} owned={owned} indent={32}/>
                       : null}
                     {footerLine ? <Typography variant={'body2'} color={'text.secondary'}>{footerLine}</Typography> : null}
                     {unlockText ? <Typography variant={'body2'} color={'text.secondary'}>{unlockText}</Typography> : null}
                   </>}>
    <ItemCard.Desc text={description}/>
    <ItemCard.Facts rows={[!catalogOnly && !isMaxed && nextLevelBonus ? ['Next level', nextLevelBonus] : null]}/>
    {extraData ? <ItemCard.Desc>{extraData}</ItemCard.Desc> : null}
  </ItemCard>
};

// A next level's bonus, in the unit its sentence reads: } MultiplierInfo of 1 + bonus / 100, { the site's rule below 1M.
// From 1M up each keeps the sentence's own fill (compass.ts, tesseract.ts, grimoire.ts). Compass: { NotateNumber Small for
// a row under 0.9 a level (the parser's smallNotation), else CommaNotation. Tesseract: } the CommaNotation of its floor;
// { CommaNotation under 1e9, NotateNumber Big past it. Grimoire: { CommaNotation.
const multiFill = (value) => formatNum(1 + value / 100, 'mult', { bare: true });
const SENTENCE_FILLS = {
  grimoire: (upgrade, multi) => (value) => (multi ? multiFill(value) : value < SHORT_FROM ? formatNum(value) : commaNotation(value)),
  compass: ({ smallNotation }, multi) => (value) => (multi ? multiFill(value)
    : smallNotation ? formatNum(value) : formatGame(value, 'Windwalker.CompassBonus')),
  tesseract: (upgrade, multi) => (value) => (multi
    ? (1 + value / 100 < SHORT_FROM ? multiFill(value) : commaNotation(Math.floor(1 + value / 100)))
    : value < SHORT_FROM ? formatNum(value) : value < 1e9 ? commaNotation(value) : notateNumber(value, 'Big'))
};

// The unit a sentence prints after its number, from its text in the game's data: "}x" a multiplier, "{%" a percent
const sentenceUnit = (raw) => (`${raw ?? ''}`.includes('}') ? 'x' : `${raw ?? ''}`.includes('{%') ? '%' : '');

// "1.30x (+0.05x)", "214% (+3%)": the next level's bonus in its sentence's fill and unit, and in brackets the gap
// between the two numbers as they read (shownDifference), so the row never disagrees with the sentence above it.
// system: 'compass' or 'tesseract'; raw: the upgrade's sentence in the game's data, before the parser filled it.
export const formatNextLevelBonus = (upgrade, system, raw) => {
  const unit = sentenceUnit(raw);
  const fill = SENTENCE_FILLS[system](upgrade, unit === 'x');
  const next = fill(upgrade?.nextLevelBonus ?? 0);
  const gap = shownDifference(fill(upgrade?.bonus ?? 0), next);
  return `${next}${unit} (${formatNum(gap, 'amount', { signed: true, precise: true })}${unit})`;
};

// The owner's Upgrade Vault rule: a locked upgrade reads the total levels that open it, an unlocked one nothing
export const unlockLine = (unlocked, totalLevels) => (!unlocked && totalLevels > 0
  ? `Unlocks at ${formatNum(totalLevels)} total ${totalLevels === 1 ? 'level' : 'levels'}`
  : null);

// A "done / total" pair as the parser writes it in raw digits ("0 / 1332"), counts: "0 / 1,332"
export const amountPair = (text) => `${text ?? ''}`.replace(/(\d+(?:\.\d+)?) \/ (\d+(?:\.\d+)?)/,
  (_, done, total) => `${formatNum(Number(done), 'whole')} / ${formatNum(Number(total), 'whole')}`);

// A masterclass sentence as the game draws it: the parser filled { and }, and the page fills $ where the toolbox
// knows the number (Decision 6); a $ it cannot compute reads "?" rather than a sentence with a hole. The game's own
// "2.00x" keeps its decimals.
export const masterclassText = (description, dollar) => cleanUnderscore(`${description ?? ''}`).split('$').join(dollar ?? '?');

export default MasterclassUpgradeCard;
