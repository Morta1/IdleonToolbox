import React, { useContext, useDeferredValue } from 'react';
import { Checkbox, CircularProgress, FormControlLabel, Grid, Stack, Typography } from '@mui/material';
import Character from '@components/characters/Character';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';

const Characters = () => {
  const { state, dispatch } = useContext(AppContext);
  const deferredDisplayed = useDeferredValue(state?.displayedCharacters);
  const isPending = deferredDisplayed !== state?.displayedCharacters;
  const numberOfCharacters = Object.values(state?.displayedCharacters || [])?.filter((val) => val).length;
  const deferredCount = Object.values(deferredDisplayed || [])?.filter((val) => val).length;
  const characterCols = Math.max(3, 12 / deferredCount);
  const hasSkillsFilter = state?.filters?.Skills;
  const hasPostOfficeFilter = state?.filters?.['Post Office'];
  return <>
    <NextSeo
      title="Characters | Idleon Toolbox"
      description="Characters overview for a lot of the game aspects"
    />
    {numberOfCharacters > 0 ? (
      <>
        {!isPending && hasSkillsFilter ? <FormControlLabel
          control={<Checkbox name={'mini'} checked={state.showRankOneOnly}
                             onChange={() => dispatch({ type: 'showRankOneOnly', data: !state.showRankOneOnly })}
                             size={'small'}
          />}
          label={'Show rank 1 only'}/> : null}
        {!isPending && hasPostOfficeFilter ? <FormControlLabel
          control={<Checkbox name={'mini'} checked={state.showUnmaxedBoxesOnly}
                             onChange={() => dispatch({ type: 'showUnmaxedBoxesOnly', data: !state.showUnmaxedBoxesOnly })}
                             size={'small'}
          />}
          label={'Show Unmaxed Boxes Only'}/> : null}
        {isPending ? <Stack alignItems={'center'} mt={1} mb={1}><CircularProgress size={24}/></Stack> : null}
        <Grid container sx={{ gap: { xs: 2 } }} columns={12.5}>
          {state?.characters?.map((character, index) => {
            return deferredDisplayed?.[index]
              ? <Character filters={state?.filters}
                           account={state?.account}
                           character={character}
                           characters={state?.characters}
                           cols={characterCols}
                           lastUpdated={state?.lastUpdated}
                           showSkillsRankOneOnly={state.showRankOneOnly}
                           showUnmaxedBoxesOnly={state.showUnmaxedBoxesOnly}
                           key={`${character?.name}-${index}`}/>
              : null;
          })}
        </Grid>
      </>
    ) : (
      <Stack alignItems={'center'} justifyContent={'center'}>
        <Typography variant={'h4'}>Please select a character</Typography>
      </Stack>
    )}
  </>;
};

export default Characters;
