import React, { useContext, useDeferredValue } from 'react';
import { Checkbox, CircularProgress, FormControlLabel, Grid, Stack } from '@mui/material';
import Character from '@components/characters/Character';
import Notice from '@components/common/Notice';
import { CharactersPicker } from '@components/characters/CharactersList';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { AppContext, shownFilters } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';

const Characters = () => {
  const { state, dispatch } = useContext(AppContext);
  const deferredDisplayed = useDeferredValue(state?.displayedCharacters);
  const isPending = deferredDisplayed !== state?.displayedCharacters;
  const numberOfCharacters = Object.values(state?.displayedCharacters || [])?.filter((val) => val).length;
  const deferredCount = Object.values(deferredDisplayed || [])?.filter((val) => val).length;
  const characterCols = Math.max(3, 12 / deferredCount);
  const hasCharacters = !!state?.characters?.length;
  const filters = shownFilters(state);
  const hasSkillsFilter = filters?.Skills;
  const hasPostOfficeFilter = filters?.['Post Office'];
  return <>
    <NextSeo
      title="Characters | Idleon Toolbox"
      description="View detailed character stats, skills, equipment, talents, and progression for all your Legends of Idleon characters"
    />
    {/* In the header row, after Pin (Decision 9) */}
    {hasCharacters ? <PageHeaderControl><CharactersPicker/></PageHeaderControl> : null}
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
        <Grid container sx={{ columnGap: 2, rowGap: 5 }} columns={12.5}>
          {state?.characters?.map((character, index) => {
            return deferredDisplayed?.[index]
              ? <Character filters={filters}
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
    ) : hasCharacters
      // The characters list opens from the Characters control above
      ? <Notice>Tick a character in the characters list to show them here.</Notice>
      : state?.emptyAccount
        ? <Notice tone={'signin'}>Your characters show here once you sign in.</Notice>
        : <Notice tone={'missing'}>This account has no characters yet.</Notice>}
  </>;
};

export default Characters;
