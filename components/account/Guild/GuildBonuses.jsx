import { cleanUnderscore, formatNum, growth } from '@utility/helpers';
import { gameBonusText } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const getCostToMax = ({ maxLevel, level, gpBaseCost, gpIncrease }) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) {
    total += gpBaseCost + i * gpIncrease;
  }
  return total;
};

// The second line the game's bonus screen adds after a sentence that ends in "..." (N.js, the GuildBonuses draw).
// Guild Gifts' line goes on with a timer the toolbox can't read, so it stops at the week.
const SECOND_LINES = {
  0: 'Storage Chest every week.',
  9: 'Upgrading this DECREASES the bonus % GP, but raises the Cap.'
};

// The guild screen's own fill (N.js): { and } through FormatBonuses (5i's gameBonusText reads the same on all 18
// bonuses at every level), } is 100 less the bonus, ] the member cap, the level plus 10
const fill = (bonus, value, level) => cleanUnderscore(`${bonus ?? ''}`
  .replace(/{/g, gameBonusText(value))
  .replace(/}/g, gameBonusText(100 - value))
  .replace(/]/g, `${Math.round(level + 10)}`));

const bonusSentence = ({ bonus, func, x1, x2, level = 0 }, index) => {
  const sentence = fill(bonus, growth(func, level, x1, x2, false), level);
  const more = SECOND_LINES[index];
  if (!more) return [sentence];
  // Gifts' sentence runs on into its second line; the small-guild one keeps the game's two lines
  return index === 0 ? [`${sentence.replace(/\.\.\.$/, '')} ${more}`] : [sentence.replace(/\.\.\.$/, ''), more];
};

// "X (Next Lv)" in the game: the next level's number in the sentence's own fill
const nextLevelText = ({ bonus, func, x1, x2, level = 0 }) => {
  const next = growth(func, level + 1, x1, x2, false);
  const text = `${bonus ?? ''}`;
  const usesRest = text.includes('}');
  // The unit the sentence prints after its number: "+{%" a percent
  const unit = text.includes(usesRest ? '}%' : '{%') ? '%' : '';
  return `${gameBonusText(usesRest ? 100 - next : next)}${unit}`;
};

// sectionFailed: the bonuses by name and sprite, with no level, cost or sentence. unspentGp: the guild's GP to spend,
// which each cost reads against
const GuildBonuses = ({ bonuses, sectionFailed, unspentGp }) => <CardGrid size={'m'}>
  {(bonuses ?? []).map((bonusObject, index) => {
    const { name, level = 0, gpIncrease = 0, maxLevel, gpBaseCost = 0, reqIndex, reqLevel = 0 } = bonusObject ?? {};
    // A bonus with no levels (the game's Wait A Minute placeholder, max level 0) has no level, state or cost to show
    const levelled = !sectionFailed && maxLevel > 0;
    // game: "Req; <bonus> Lv.N+" in place of the level and cost while the bonus it hangs off is below that level
    const required = bonuses?.[reqIndex];
    const locked = levelled && reqLevel > 0 && (required?.level ?? 0) < reqLevel;
    const maxed = levelled && level >= maxLevel;
    const cost = gpBaseCost + level * gpIncrease;
    return <ItemCard key={`${name}-${index}`} icon={`data/Gbonus${index}.png`} title={cleanUnderscore(name)}
                     level={levelled ? { value: level, max: maxLevel } : undefined}
                     status={maxed ? 'maxed' : locked ? 'locked' : undefined}
                     statusLabel={locked ? `Needs ${cleanUnderscore(required?.name)} Lv ${formatNum(reqLevel)}` : undefined}
                     footer={levelled && !locked ? <ItemCard.Facts rows={[
                       ['Cost', unspentGp != null
                         ? `${formatNum(unspentGp, 'whole')} / ${formatNum(cost, 'whole')} GP`
                         : `${formatNum(cost, 'whole')} GP`],
                       ['Cost to max', `${formatNum(getCostToMax({ maxLevel, level, gpBaseCost, gpIncrease }), 'whole')} GP`]
                     ]}/> : null}>
      {sectionFailed ? null : <ItemCard.Desc text={bonusSentence(bonusObject, index)}/>}
      {levelled && !maxed && !locked ? <ItemCard.Facts rows={[['Next level', nextLevelText(bonusObject)]]}/> : null}
    </ItemCard>;
  })}
</CardGrid>;

export default GuildBonuses;
