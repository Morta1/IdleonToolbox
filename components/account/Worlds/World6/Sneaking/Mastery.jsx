import { cleanUnderscore } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Mastery = ({ masteryBonuses, masteryLevel }) => {
  return <CardGrid size={'s'}>
    {masteryBonuses?.map(({ description, bonus }, index) => {
      const unlocked = masteryLevel >= index + 1;
      return <ItemCard key={'mastery-' + index} title={`Ninja Mastery ${index + 1}`}
                       status={unlocked ? 'active' : undefined} statusLabel={'Unlocked'} dimmed={!unlocked}>
        <ItemCard.Desc text={`${cleanUnderscore(description)}${cleanUnderscore(bonus)}`}/>
      </ItemCard>
    })}
  </CardGrid>;
};

export default Mastery;
