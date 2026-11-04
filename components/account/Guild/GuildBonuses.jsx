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

// The guild screen's own fill (N.js): { and } through FormatBonuses (5i's gameBonusText reads the same on all 18
// bonuses at every level), } is 100 less the bonus, ] the member cap, the level plus 10
const bonusSentence = ({ bonus, func, x1, x2, level = 0 }) => {
  const value = growth(func, level, x1, x2, false);
  return cleanUnderscore(`${bonus ?? ''}`
    .replace(/{/g, gameBonusText(value, { func, x1, x2 }, 'bubble'))
    .replace(/}/g, gameBonusText(100 - value, { func, x1, x2 }, 'bubble'))
    .replace(/]/g, `${Math.round(level + 10)}`));
};

// sectionFailed: the bonuses by name and sprite, with no level, cost or sentence
const GuildBonuses = ({ bonuses, sectionFailed }) => <CardGrid size={'m'}>
  {(bonuses ?? []).map((bonusObject, index) => {
    const { name, level = 0, gpIncrease = 0, maxLevel, gpBaseCost = 0 } = bonusObject ?? {};
    return <ItemCard key={`${name}-${index}`} icon={`data/Gbonus${index}.png`} title={cleanUnderscore(name)}
                     level={sectionFailed ? undefined : { value: level, max: maxLevel }}
                     status={!sectionFailed && level >= maxLevel ? 'maxed' : undefined}
                     footer={sectionFailed ? null : <ItemCard.Facts rows={[
                       ['Cost', `${formatNum(gpBaseCost + level * gpIncrease)} GP`],
                       ['Cost to max', `${formatNum(getCostToMax({ maxLevel, level, gpBaseCost, gpIncrease }))} GP`]
                     ]}/>}>
      {sectionFailed ? null : <ItemCard.Desc text={bonusSentence(bonusObject)}/>}
    </ItemCard>;
  })}
</CardGrid>;

export default GuildBonuses;
