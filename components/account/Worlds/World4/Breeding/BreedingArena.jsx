import { useContext } from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, pascalCase } from 'utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { CRUCIBLE_MENAGERIE_UNLOCK, getCrucibleMaxLevel, isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';

// A list's best wave, then a card per wave: the waves past it greyed, the rest reached
const arenaWaves = (title, maxLevel, bonuses, failed) => <>
  <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
    <StatTile label={title} value={failed ? '-' : maxLevel ?? 0} kind={'amount'}/>
  </Stack>
  <CardGrid size={'s'}>
    {bonuses?.map(({ bonus, wave }, index) => <ItemCard key={`${wave}-${index}`} title={`Wave ${formatNum(wave)}`}
                                                         dimmed={(maxLevel ?? 0) < wave}
                                                         status={(maxLevel ?? 0) >= wave ? 'done' : undefined}
                                                         statusLabel={(maxLevel ?? 0) >= wave ? 'Reached' : undefined}>
      <ItemCard.Desc text={cleanUnderscore(pascalCase(bonus))}/>
    </ItemCard>)}
  </CardGrid>
</>;

// In a failed section the best wave reads "-" (the Crucible's is the Menagerie's)
const BreedingArena = ({ maxArenaLevel, arenaBonuses, sectionFailed }) => {
  const { state } = useContext(AppContext);
  const crucibleUnlocked = isMenagerieUnlockOwned(state?.account, CRUCIBLE_MENAGERIE_UNLOCK);
  const arena = arenaBonuses?.filter(({ type }) => type !== 'crucible');
  const crucible = arenaBonuses?.filter(({ type }) => type === 'crucible');

  return <>
    {arenaWaves('Max level', maxArenaLevel, arena, sectionFailed)}
    {crucible?.length > 0 ? <>
      <Typography variant={'sectionTitle'} component={'h2'} mt={4} mb={2}>Crucible</Typography>
      {!crucibleUnlocked ? <Notice tone={'locked'} sx={{ mb: 2 }}>The Crucible unlocks from the Luminous Menagerie.</Notice> : null}
      {arenaWaves('Crucible max level', getCrucibleMaxLevel(state?.account), crucible)}
    </> : null}
  </>
};

export default BreedingArena;
