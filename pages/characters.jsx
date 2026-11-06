import React, { useContext, useDeferredValue, useRef, useState } from 'react';
import { Box, CircularProgress, Stack } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import Character, { isSectionOpen } from '@components/characters/Character';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import { MissingData } from '@components/common/styles';
import { CharactersPicker } from '@components/characters/CharactersList';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { AppContext, shownCharacters, shownFilters } from 'components/common/context/AppProvider';
import usePageTop from '@hooks/usePageTop';
import useToolbarState from '@hooks/useToolbarState';
import { sections } from 'utility/helpers';
import { NextSeo } from 'next-seo';

// Two or more characters: one column each. Every card spans as many rows as it has sections, on subgrid (Character), so
// a section starts on the same line across the columns. The ones past a row's columns start a new row.
const SIDE_BY_SIDE_SX = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', columnGap: 2, rowGap: 0 };

const CHARACTERS_TOOLBAR = { showRankOneOnly: false, showUnmaxedBoxesOnly: false };

const Characters = () => {
  const { state } = useContext(AppContext);
  const displayed = shownCharacters(state);
  const deferredDisplayed = useDeferredValue(displayed);
  const isPending = deferredDisplayed !== displayed;
  const numberOfCharacters = state?.characters?.filter((_, index) => displayed?.[index])?.length ?? 0;
  const sideBySide = (state?.characters?.filter((_, index) => deferredDisplayed?.[index])?.length ?? 0) > 1;
  const hasCharacters = !!state?.characters?.length;
  // Each character's list follows its own obols: side by side they share one order, so a section's rows line up
  const obolStatOrder = sideBySide
    ? [...new Set(state?.characters?.filter((_, index) => deferredDisplayed?.[index]).flatMap(({ obols }) => Object.keys(obols?.stats ?? {})))]
    : undefined;
  const filters = shownFilters(state);
  const hasSkillsFilter = filters?.Skills;
  const hasPostOfficeFilter = filters?.['Post Office'];
  const hasSection = sections.some(({ name }) => filters?.[name]);
  const failedSections = state?.account?.failedSections;
  const [toolbarState, setToolbar, resetToolbar] = useToolbarState('characters', CHARACTERS_TOOLBAR);
  // A side-by-side card's name pins under the bar and the pinned Toolbar, when there is one
  const pageTop = usePageTop();
  const [toolbarBottom, setToolbarBottom] = useState(null);
  const pinTop = !isPending && (hasSkillsFilter || hasPostOfficeFilter) ? toolbarBottom ?? pageTop : pageTop;
  // The picker's drawer opens from its header control or from a note below, which hands it the control's focus first,
  // so closing the drawer returns there even after a tick has taken the note away
  const [pickerOpen, setPickerOpen] = useState(false);
  // No default: nothing is stored until the player opens or closes one
  const [openSections, setOpenSections] = useLocalStorage({ key: 'characters:openSections' });
  const toggleSection = (name) => setOpenSections((current) => ({ ...current, [name]: !isSectionOpen(current, name) }));
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
    {/* In the header row, by the title (Decision 9) */}
    {hasCharacters ? <PageHeaderControl>
      <CharactersPicker open={pickerOpen} onOpenChange={setPickerOpen} buttonRef={pickerButton}/>
    </PageHeaderControl> : null}
    {numberOfCharacters > 0 && !hasSection ? <Notice action={{ label: 'Choose sections', onClick: choose }}>
      No section is on: tick one under Characters to show it here.
    </Notice> : numberOfCharacters > 0 ? (
      <>
        {!isPending && (hasSkillsFilter || hasPostOfficeFilter)
          ? <Toolbar state={toolbarState} defaults={CHARACTERS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar} counted={false}
                     onStickyBottom={setToolbarBottom}>
            {hasSkillsFilter ? <Toolbar.Filter name={'showRankOneOnly'} label={'Show rank 1 only'}/> : null}
            {hasPostOfficeFilter ? <Toolbar.Filter name={'showUnmaxedBoxesOnly'} label={'Show unmaxed boxes only'}/> : null}
          </Toolbar> : null}
        {isPending ? <Stack alignItems={'center'} mt={1} mb={1}><CircularProgress size={24}/></Stack> : null}
        <Box sx={sideBySide ? SIDE_BY_SIDE_SX : undefined}>
          {state?.characters?.map((character, index) => {
            return deferredDisplayed?.[index]
              ? <Character filters={filters}
                           account={state?.account}
                           character={character}
                           characters={state?.characters}
                           lastUpdated={state?.lastUpdated}
                           side={sideBySide}
                           obolStatOrder={obolStatOrder}
                           pinTop={pinTop}
                           openSections={openSections}
                           onToggleSection={toggleSection}
                           showSkillsRankOneOnly={toolbarState.showRankOneOnly}
                           showUnmaxedBoxesOnly={toolbarState.showUnmaxedBoxesOnly}
                           key={`${character?.name}-${index}`}/>
              : null;
          })}
        </Box>
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
