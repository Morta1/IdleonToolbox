import { cleanUnderscore, formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Charms = ({ charms }) => {
  return <CardGrid size={'s'}>
    {charms?.map(({ rawName, name, bonus, unlocked, value }, index) => {
      // The game's sentence: } the multiplier (its x is the sentence's), { the value itself
      const text = bonus.replace(/}/, formatNum(value, 'mult', { bare: true })).replace(/{/, value);
      return <ItemCard key={'charm-' + index} icon={`data/${rawName}.png`} title={cleanUnderscore(name)}
                       status={unlocked ? 'done' : undefined} statusLabel={'Found'}>
        <ItemCard.Desc text={cleanUnderscore(text)}/>
      </ItemCard>
    })}
  </CardGrid>;
};

export default Charms;
