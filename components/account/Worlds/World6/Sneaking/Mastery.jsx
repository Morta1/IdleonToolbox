import { Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Mastery = ({ masteryBonuses, masteryLevel }) => {
  return <Stack gap={3}>
    <CardGrid size={'s'}>
      {masteryBonuses?.map(({ description, bonus }, index) => {
        const unlocked = masteryLevel >= index + 1;
        return <ItemCard key={'mastery-' + index} title={`Ninja Mastery ${index + 1}`}
                         status={unlocked ? 'done' : undefined} statusLabel={'Unlocked'} dimmed={!unlocked}>
          <ItemCard.Desc text={`${cleanUnderscore(description)}${cleanUnderscore(bonus)}`}/>
        </ItemCard>
      })}
    </CardGrid>
  </Stack>;
};

export default Mastery;
