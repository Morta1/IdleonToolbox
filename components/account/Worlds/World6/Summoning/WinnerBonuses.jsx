import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const WinnerBonuses = ({ winnerBonuses }) => {
  return <CardGrid size={'s'}>
    {winnerBonuses?.map(({ name, bonus, value }, index) => {
      // The game's sentence: { the bonus in its Big (Summoning.WinBonus), < the multiplier it makes
      const text = bonus.replace('{', formatGame(value, 'Summoning.WinBonus')).replace('<', formatNum(1 + value / 100, 'mult', { bare: true }));
      return <ItemCard key={'winner-' + index} title={cleanUnderscore(name)} dimmed={!value}>
        <ItemCard.Desc text={text}/>
      </ItemCard>
    })}
  </CardGrid>
};

export default WinnerBonuses;
