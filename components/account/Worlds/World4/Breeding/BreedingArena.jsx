import { useContext } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, pascalCase } from 'utility/helpers';
import { AppContext } from '@components/common/context/AppProvider';
import { isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';

// Menagerie unlock 8 opens the Crucible, the hard mode arena with its own set of bonuses
const CRUCIBLE_MENAGERIE_UNLOCK = 8;

const ArenaBonuses = ({ title, maxLevel, bonuses }) => {
  return <>
    <Stack direction={'row'} justifyContent={'center'} my={3}>
      <Card>
        <CardContent>
          <Typography sx={{ color: 'success.light' }}>{title}: {maxLevel}</Typography>
        </CardContent>
      </Card>
    </Stack>
    <Stack direction={'row'} justifyContent={'center'} flexWrap={'wrap'} gap={2}>
      {bonuses?.map(({ bonus, wave }, index) => {
        return <Card variant={'outlined'} sx={{ width: 200, opacity: maxLevel < wave ? .5 : 1 }}
                     key={`${wave}-${index}`}>
          <CardContent>
            <Typography sx={{ fontWeight: 'bold' }}>Wave {wave}</Typography>
            <Typography>{cleanUnderscore(pascalCase(bonus))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const BreedingArena = ({ maxArenaLevel, maxCrucibleLevel, arenaBonuses }) => {
  const { state } = useContext(AppContext);
  const crucibleUnlocked = isMenagerieUnlockOwned(state?.account, CRUCIBLE_MENAGERIE_UNLOCK);
  const arena = arenaBonuses?.filter(({ type }) => type !== 'crucible');
  const crucible = arenaBonuses?.filter(({ type }) => type === 'crucible');

  return <>
    <ArenaBonuses title={'Max level'} maxLevel={maxArenaLevel} bonuses={arena}/>
    {crucible?.length > 0 ? <>
      <Typography variant={'h5'} textAlign={'center'} mt={4}>Crucible</Typography>
      {!crucibleUnlocked ? <Typography variant={'body2'} color={'text.secondary'} textAlign={'center'} mt={1}>
        Unlocked from the Luminous Menagerie.
      </Typography> : null}
      <ArenaBonuses title={'Crucible max level'} maxLevel={crucibleUnlocked ? maxCrucibleLevel ?? 0 : 0}
                    bonuses={crucible}/>
    </> : null}
  </>
};

export default BreedingArena;
