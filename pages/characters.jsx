import React, { useContext, useDeferredValue, useRef, useState } from 'react';
import { Box, CircularProgress, Stack, useTheme } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import Character, { isSectionOpen } from '@components/characters/Character';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import { MissingData } from '@components/common/styles';
import { CharactersPicker } from '@components/characters/CharactersList';
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
  // A side-by-side card's name pins under the bar and the pinned Toolbar
  const pageTop = usePageTop();
  const [toolbarBottom, setToolbarBottom] = useState(null);
  const pinTop = hasCharacters ? toolbarBottom ?? pageTop : pageTop;
  // The picker opens from its switcher or from a note below, which hands it the switcher's focus first, so closing it
  // returns there even after a tick has taken the note away. Under lg it is the drawer; from lg the switcher's own list,
  // and Sections its own button.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  // No default: nothing is stored until the player opens or closes one
  const [openSections, setOpenSections] = useLocalStorage({ key: 'characters:openSections' });
  const toggleSection = (name) => setOpenSections((current) => ({ ...current, [name]: !isSectionOpen(current, name) }));
  const pickerButton = useRef(null);
  const sectionsButton = useRef(null);
  const theme = useTheme();
  const choose = (what) => {
    const wide = window.matchMedia(`(min-width: ${theme.breakpoints.values.lg}px)`).matches;
    if (wide && what === 'sections') {
      sectionsButton.current?.focus();
      return setSectionsOpen(true);
    }
    pickerButton.current?.focus();
    return wide ? setMenuOpen(true) : setPickerOpen(true);
  };
  return <>
    <NextSeo
      title="Characters | Idleon Toolbox"
      description="View detailed character stats, skills, equipment, talents, and progression for all your Legends of Idleon characters"
    />
    {failedSections?.length ? <MissingData sections={failedSections}/> : null}
    {/* The picker leads the pinned bar rather than the header row (Decision 9 had it by the title): with 11 characters
        players switch all the way down the page, and the header scrolled away with it */}
    {hasCharacters ? <Toolbar state={toolbarState} defaults={CHARACTERS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                              counted={false} onStickyBottom={setToolbarBottom}>
      <Toolbar.Lead>
        <CharactersPicker open={pickerOpen} onOpenChange={setPickerOpen} menuOpen={menuOpen} onMenuOpenChange={setMenuOpen}
                          buttonRef={pickerButton} sectionsOpen={sectionsOpen} onSectionsOpenChange={setSectionsOpen} sectionsRef={sectionsButton}/>
      </Toolbar.Lead>
      {numberOfCharacters > 0 && hasSkillsFilter ? <Toolbar.Filter name={'showRankOneOnly'} label={'Show rank 1 only'}/> : null}
      {numberOfCharacters > 0 && hasPostOfficeFilter ? <Toolbar.Filter name={'showUnmaxedBoxesOnly'} label={'Show unmaxed boxes only'}/> : null}
    </Toolbar> : null}
    {/* With no section on, each card still shows who the character is and what it's doing (#59) */}
    {numberOfCharacters > 0 ? (
      <>
        {!hasSection ? <Box sx={{ mb: 2 }}><Notice action={{ label: 'Choose sections', onClick: () => choose('sections') }}>
          No section is on: tick one under Characters to show more here.
        </Notice></Box> : null}
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
      ? <Notice action={{ label: 'Choose characters', onClick: () => choose('characters') }}>
        Tick a character under Characters to show them here.
      </Notice>
      : state?.emptyAccount
        ? <Notice tone={'signin'}>Your characters show here once you sign in.</Notice>
        // A whole-parse failure's note already says it: the save was never read, so nothing here says it has no characters
        : failedSections?.includes('*') ? null : <Notice tone={'missing'}>This account has no characters yet.</Notice>}
  </>;
};

export default Characters;
