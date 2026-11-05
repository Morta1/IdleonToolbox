import React, { useContext, useDeferredValue, useRef, useState } from 'react';
import { CircularProgress, Grid, Stack } from '@mui/material';
import Character from '@components/characters/Character';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import { MissingData } from '@components/common/styles';
import { CharactersPicker } from '@components/characters/CharactersList';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { AppContext, shownCharacters, shownFilters } from 'components/common/context/AppProvider';
import { sections } from 'utility/helpers';
import { NextSeo } from 'next-seo';

const Characters = () => {
  const { state, dispatch } = useContext(AppContext);
  const displayed = shownCharacters(state);
  const deferredDisplayed = useDeferredValue(displayed);
  const isPending = deferredDisplayed !== displayed;
  const numberOfCharacters = state?.characters?.filter((_, index) => displayed?.[index])?.length ?? 0;
  const deferredCount = state?.characters?.filter((_, index) => deferredDisplayed?.[index])?.length ?? 0;
  const characterCols = Math.max(3, 12 / deferredCount);
  const hasCharacters = !!state?.characters?.length;
  const filters = shownFilters(state);
  const hasSkillsFilter = filters?.Skills;
  const hasPostOfficeFilter = filters?.['Post Office'];
  const hasSection = sections.some(({ name }) => filters?.[name]);
  const failedSections = state?.account?.failedSections;
  const toolbarState = { showRankOneOnly: Boolean(state?.showRankOneOnly), showUnmaxedBoxesOnly: Boolean(state?.showUnmaxedBoxesOnly) };
  const setToolbar = (patch) => Object.entries(patch).forEach(([type, data]) => dispatch({ type, data }));
  // The picker's drawer opens from its header control or from a note below, which hands it the control's focus first,
  // so closing the drawer returns there even after a tick has taken the note away
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerButton = useRef(null);
  const choose = () => {
    pickerButton.current?.focus();
    setPickerOpen(true);
  };
  return <>
    <NextSeo
      title="Characters | Idleon Toolbox"
      description="View detailed character stats, skills, equipment, talents, and progression for all your Legends of Idleon characters"
    />
    {failedSections?.length ? <MissingData sections={failedSections}/> : null}
    {/* In the header row, after Pin (Decision 9) */}
    {hasCharacters ? <PageHeaderControl>
      <CharactersPicker open={pickerOpen} onOpenChange={setPickerOpen} buttonRef={pickerButton}/>
    </PageHeaderControl> : null}
    {numberOfCharacters > 0 && !hasSection ? <Notice action={{ label: 'Choose sections', onClick: choose }}>
      No section is on: tick one under Characters to show it here.
    </Notice> : numberOfCharacters > 0 ? (
      <>
        {!isPending && (hasSkillsFilter || hasPostOfficeFilter)
          ? <Toolbar state={toolbarState} defaults={{ showRankOneOnly: false, showUnmaxedBoxesOnly: false }} onChange={setToolbar}
                     onReset={() => setToolbar({ showRankOneOnly: false, showUnmaxedBoxesOnly: false })}
                     total={numberOfCharacters} shown={numberOfCharacters} noun={'characters'}>
            {hasSkillsFilter ? <Toolbar.Filter name={'showRankOneOnly'} label={'Show rank 1 only'}/> : null}
            {hasPostOfficeFilter ? <Toolbar.Filter name={'showUnmaxedBoxesOnly'} label={'Show unmaxed boxes only'}/> : null}
          </Toolbar> : null}
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
      ? <Notice action={{ label: 'Choose characters', onClick: choose }}>
        Tick a character under Characters to show them here.
      </Notice>
      : state?.emptyAccount
        ? <Notice tone={'signin'}>Your characters show here once you sign in.</Notice>
        // A whole-parse failure's note already says it: the save was never read, so nothing here says it has no characters
        : failedSections?.includes('*') ? null : <Notice tone={'missing'}>This account has no characters yet.</Notice>}
  </>;
};

export default Characters;
