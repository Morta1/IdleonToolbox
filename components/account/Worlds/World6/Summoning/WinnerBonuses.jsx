import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const WinnerBonuses = ({ winnerBonuses }) => {
  return <CardGrid size={'s'}>
    {winnerBonuses?.map(({ name, bonus, value, breakdown }, index) => {
      // The game's sentence: { the bonus in its Big (Summoning.WinBonus), < the multiplier it makes
      const bonusText = formatGame(value, 'Summoning.WinBonus');
      const multiText = formatNum(1 + value / 100, 'mult', { bare: true });
      const text = bonus.replace('{', bonusText).replace('<', multiText);
      const sentence = cleanUnderscore(text);
      return <ItemCard key={'winner-' + index} title={cleanUnderscore(name)} dimmed={!value}>
        <ItemCard.Desc>{value && breakdown
          ? <Breakdown asValue title={sentence}
                       data={{ ...breakdown, totalValue: bonus.includes('<') ? `${multiText}x` : bonusText }}>{sentence}</Breakdown>
          : sentence}</ItemCard.Desc>
      </ItemCard>
    })}
  </CardGrid>
};

export default WinnerBonuses;
