import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Skeleton,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import React, { startTransition, useContext, useEffect, useState } from 'react';
import { AppContext, shownCharacters, shownFilters } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { formatNum, sections } from 'utility/helpers';
import AppDrawer from '@components/common/Overlays/AppDrawer';
import GameIcon from '@components/common/GameIcon';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

// Ensure the saved selection has an entry for every current character. Characters created after
// the selection was last saved (e.g. the 11th slot) are missing from the persisted object, which
// would hide them and break "All". Missing characters inherit the current "all" state.
const reconcileDisplayedCharacters = (stored, length) => {
  const reconciled = { all: false, ...stored };
  const fallback = stored?.all ?? false;
  for (let index = 0; index < (length || 0); index++) {
    if (reconciled[index] === undefined) {
      reconciled[index] = fallback;
    }
  }
  return reconciled;
};

// "Only" shows on a row the pointer is over or the focus is in (the checkbox, or Only itself), and always on a touch
// screen and in the phone sheet, where there is no hover. A touch gets a taller area around it.
const ONLY_ROW_SX = {
  '& [data-only]': { opacity: { xs: 1, sm: 0 } },
  '&:hover [data-only], &:focus-within [data-only]': { opacity: 1 },
  '@media (hover: none)': { '& [data-only]': { opacity: 1 } }
};
const ONLY_SX = {
  font: 'inherit',
  verticalAlign: 'baseline',
  '@media (pointer: coarse)': {
    position: 'relative',
    '&::after': { content: '""', position: 'absolute', left: -8, right: -8, top: -10, bottom: -10 }
  }
};

// Exactly one character shown, as "Only" and the steps beside the picker store it
const onlyCharacter = (length, charIndex) => ({
  ...Array(length).fill(false).reduce((res, _, index) => ({
    ...res,
    [index]: index === charIndex
  }), {}),
  all: false
});
// Every character shown, or none
const allCharacters = (length, on) => ({
  all: on,
  ...Array(length).fill(false).reduce((res, _, index) => ({ ...res, [index]: on }), {})
});

const trackSection = (name, on) => {
  if (typeof window.gtag === 'undefined') return;
  setTimeout(() => window.gtag('event', 'filter_selection', { event_category: name, event_label: 'engagement', value: on }), 0);
};

// The sections as a checklist, in the drawer and under the wide bar's Sections button alike: two columns read top to
// bottom, with All and None over them. Pills of sixteen widths wrapped into ragged rows, and all or none took 16 presses.
const sectionsOf = (chips, on) => ({ ...chips, ...Object.fromEntries(sections.map(({ name }) => [name, on])) });
const CHECKLIST_SX = {
  display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gridTemplateRows: `repeat(${Math.ceil(sections.length / 2)}, auto)`, columnGap: 2
};
const CHECK_ROW_SX = { m: 0, minHeight: 36, minWidth: 0, '& .MuiFormControlLabel-label': { fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } };
const SectionChecklist = ({ chips, onToggle, onAll }) => <Stack gap={0.5}>
  <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'} sx={{ mr: 'auto' }}>Sections</Typography>
    <Link component="button" type="button" underline="hover" onClick={() => onAll(true)} sx={{ font: 'inherit', fontSize: 13 }}>All</Link>
    <Link component="button" type="button" underline="hover" onClick={() => onAll(false)} sx={{ font: 'inherit', fontSize: 13 }}>None</Link>
  </Stack>
  <Box sx={CHECKLIST_SX}>
    {sections.map(({ name }) => <FormControlLabel key={name} label={name} sx={CHECK_ROW_SX}
                                                  control={<Checkbox size="small" checked={Boolean(chips?.[name])} onChange={() => onToggle(name)}/>}/>)}
  </Box>
</Stack>;

const CharactersList = () => {
  const { state, dispatch } = useContext(AppContext);
  const [checked, setChecked] = useState(() =>
    reconcileDisplayedCharacters(shownCharacters(state), state?.characters?.length));
  const [chips, setSelectedChips] = useState(shownFilters(state));

  // Adjust-during-render rather than an effect, because storage lands a render after mount and
  // the roster can grow: the checkboxes have to follow both without a paint in between.
  const [syncSource, setSyncSource] = useState({
    displayed: state?.displayedCharacters,
    length: state?.characters?.length,
    filters: state?.filters,
    searchFilters: state?.searchFilters
  });
  if (syncSource.displayed !== state?.displayedCharacters
    || syncSource.length !== state?.characters?.length
    || syncSource.filters !== state?.filters
    || syncSource.searchFilters !== state?.searchFilters) {
    setSyncSource({
      displayed: state?.displayedCharacters,
      length: state?.characters?.length,
      filters: state?.filters,
      searchFilters: state?.searchFilters
    });
    setChecked(reconcileDisplayedCharacters(shownCharacters(state), state?.characters?.length));
    setSelectedChips(shownFilters(state));
  }

  // Persist the backfilled selection to global state so the characters page also includes new
  // characters instead of silently dropping the missing indices.
  useEffect(() => {
    const length = state?.characters?.length;
    if (!length || !state?.displayedCharacters) return;
    const reconciled = reconcileDisplayedCharacters(state.displayedCharacters, length);
    if (Object.keys(reconciled).length !== Object.keys(state.displayedCharacters).length) {
      startTransition(() => {
        dispatch({ type: 'displayedCharacters', data: reconciled });
      });
    }
  }, [state?.characters?.length, state?.displayedCharacters, dispatch]);

  const handleCharacterChange = (event, _, charIndex) => {
    let newState;
    if (charIndex !== undefined && charIndex !== null) {
      newState = onlyCharacter(state?.characters?.length, charIndex);
    } else {
      if (event === 'all') {
        newState = allCharacters(state?.characters?.length, !checked.all);
      } else {
        const index = parseInt(event.target.name, 10);
        newState = {
          ...checked,
          [index]: event.target.checked
        }
      }
    }
    setChecked(newState);
    startTransition(() => {
      dispatch({ type: 'displayedCharacters', data: newState });
    });
  };

  const totalLevels = state?.characters?.reduce((res, { level }) => res + (level || 0), 0);

  const toggleSection = (name) => {
    const newChipsState = {
      ...chips,
      [name]: !chips?.[name]
    };
    setSelectedChips(newChipsState);
    startTransition(() => {
      dispatch({ type: 'filters', data: newChipsState });
    });
    trackSection(name, newChipsState[name]);
  }
  const setAllSections = (on) => {
    const next = sectionsOf(chips, on);
    setSelectedChips(next);
    startTransition(() => dispatch({ type: 'filters', data: next }));
  };

  const hasCharacters = !!state?.characters?.length;

  const renderCharactersList = () => {
    if (!state.isLoading && !hasCharacters) {
      // From lg the rail sits beside /characters, which says the same thing itself; below lg the list is in the
      // menu drawer, over the page, so it says it here.
      return (
        <ListItem sx={{ display: { lg: 'none' } }}>
          {state?.emptyAccount
            ? <Notice tone={'signin'}>Your characters show here once you sign in.</Notice>
            : state?.account?.failedSections?.includes('*') ? null : <Notice tone={'missing'}>This account has no characters yet.</Notice>}
        </ListItem>
      );
    }

    if (state.isLoading || !hasCharacters) {
      return (
        <>
          {[1, 2, 3, 4, 5].map((key) => (
            <ListItem key={`skeleton-${key}`}>
              <ListItemIcon>
                <Skeleton variant="circular" width={36} height={36}/>
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width={100}/>}
              />
              <Skeleton variant="rectangular" width={24} height={24}/>
            </ListItem>
          ))}
        </>
      );
    }

    return state?.characters?.map((character, index) => {
      const { name, classIndex, level, hasData } = character;
      const classIcon = classIconOf(classIndex);
      return <ListItem
        sx={ONLY_ROW_SX}
        key={`${name}-${index}`}
        secondaryAction={
          <Checkbox
            edge="end"
            name={`${index}`}
            onChange={handleCharacterChange}
            checked={checked?.[index]}
            role={'checkbox'}
            aria-label={`Check to see stats for ${name}`}
          />}>
        <ListItemIcon>
          <GameIcon src={classIcon} size={32} alt=""/>
        </ListItemIcon>
        <ListItemText
          sx={{ height: 30, margin: 0 }} id={name} primary={name}
          secondary={<>
            {formatNum(hasData ? level : 0, 'level')}
            <span data-only=""> · <Link component="button" type="button" underline="always" color="inherit"
                                        aria-label={`Show only ${name}`} onClick={() => handleCharacterChange(null, null, index)}
                                        sx={ONLY_SX}>Only</Link></span>
          </>}/>
      </ListItem>
    });
  };

  const renderAllItem = () => {
    if (!state.isLoading && !hasCharacters) return null;

    if (state.isLoading || !hasCharacters) {
      return (
        <ListItem>
          <ListItemText>
            <Skeleton variant="text" width={80}/>
          </ListItemText>
          <Skeleton variant="rectangular" width={24} height={24}/>
        </ListItem>
      );
    }

    return (
      <ListItem
        secondaryAction={
          <Checkbox
            edge="end"
            onChange={() => handleCharacterChange('all')}
            checked={checked?.all}
          />
        }>
        <ListItemText>{`All · Lv ${formatNum(totalLevels)} total`}</ListItemText>
      </ListItem>
    );
  };

  return (
    <Stack>
      <List dense={true}>
        {renderAllItem()}
        {renderCharactersList()}
      </List>
      <Divider/>
      <List>
        <ListItem>
          <Box sx={{ width: '100%' }}>
            <SectionChecklist chips={chips} onToggle={toggleSection} onAll={setAllSections}/>
          </Box>
        </ListItem>
      </List>
    </Stack>
  );
};

const ALL_LABEL = 'All characters';
// The name button's room besides its label: 15 px sides, the 24 px class icon and its gap, the chevron and its margin
const NAME_BUTTON_EXTRA = 96;
const classIconOf = (classIndex) => (classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png');

// While one character shows, a step to the one before or after it, wrapping round. 40 px, 44 on touch.
const STEP_SX = {
  width: 40, height: 40, border: 1, borderColor: 'outline', borderRadius: '6px', color: 'text.primary',
  '@media (pointer: coarse)': { width: 44, height: 44 }
};

// A row of the wide bar's character list: the box ticks the character in or out and keeps the list open, the name shows
// that one alone and closes it (the drawer's checkbox and Only, as one row).
const MENU_ROW_SX = { display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 36, borderRadius: '6px', '&:hover': { bgcolor: 'action.hover' } };
const MENU_NAME_SX = {
  flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 1, py: 0.5, pr: 1, borderRadius: '4px', font: 'inherit', textAlign: 'left',
  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' }
};
const ELLIPSIS_SX = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// The wide bar's characters (a named switcher the reviewers preferred to a strip of class icons, which made players hover
// to tell two of a class apart): every character's icon, name and level under the switcher, over the page only while open.
// Never the last one shown unticked.
const CharacterMenu = ({ open, onClose, anchorRef }) => {
  const { state, dispatch } = useContext(AppContext);
  const characters = state?.characters ?? [];
  const displayed = reconcileDisplayedCharacters(shownCharacters(state), characters.length);
  const allShown = characters.every((_, index) => displayed[index]);
  const firstShown = Math.max(0, characters.findIndex((_, index) => displayed[index]));
  const totalLevels = characters.reduce((sum, { level, hasData }) => sum + (hasData ? level || 0 : 0), 0);
  const show = (data) => startTransition(() => dispatch({ type: 'displayedCharacters', data }));
  const toggle = (index) => {
    const next = { ...displayed, [index]: !displayed[index] };
    const count = characters.filter((_, other) => next[other]).length;
    if (count) show({ ...next, all: count === characters.length });
  };
  const only = (index) => {
    show(onlyCharacter(characters.length, index));
    onClose();
  };
  return <Popover open={open} anchorEl={() => anchorRef.current} onClose={onClose} disableScrollLock
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{ paper: { 'aria-label': 'Characters', sx: { p: 0.75, mt: 1, width: 320, maxWidth: 'calc(100vw - 32px)' } } }}>
    <Box sx={MENU_ROW_SX}>
      <Checkbox size="small" checked={allShown} inputProps={{ 'aria-label': 'All characters' }}
                onChange={() => show(allShown ? onlyCharacter(characters.length, firstShown) : allCharacters(characters.length, true))}/>
      <Typography variant={'body2'} sx={{ fontWeight: 500 }}>All characters</Typography>
      <Typography variant={'body2'} color={'text.secondary'} sx={{ ml: 'auto', pr: 1, fontSize: 12 }}>{formatNum(totalLevels, 'level')}</Typography>
    </Box>
    {characters.map(({ name, classIndex, level, hasData }, index) => {
      const on = Boolean(displayed[index]);
      return <Box key={`${name}-${index}`} sx={MENU_ROW_SX}>
        <Checkbox size="small" checked={on} onChange={() => toggle(index)} inputProps={{ 'aria-label': `Show ${name} beside the others` }}/>
        <ButtonBase onClick={() => only(index)} aria-label={`Show only ${name}`} sx={MENU_NAME_SX}>
          <GameIcon src={classIconOf(classIndex)} size={24} alt=""/>
          <Box component="span" sx={[ELLIPSIS_SX, { flex: 1, fontSize: 14, fontWeight: on ? 500 : 400, color: on ? 'primary.main' : 'text.primary' }]}>{name}</Box>
          <Box component="span" sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{formatNum(hasData ? level : 0, 'level')}</Box>
        </ButtonBase>
      </Box>;
    })}
    <Typography sx={{ fontSize: 12, lineHeight: '16px', color: 'text.secondary', px: 1, pt: 1, pb: 0.5, mt: 0.5, borderTop: 1, borderColor: 'divider' }}>
      Click a name to show only them. Tick boxes to compare.
    </Typography>
  </Popover>;
};

// The wide bar's sections: the drawer's checklist, under a button that names how many are on. Each tick shows at once.
const SectionsButton = ({ open, onOpenChange, buttonRef }) => {
  const { state, dispatch } = useContext(AppContext);
  const chips = shownFilters(state);
  const on = sections.filter(({ name }) => chips?.[name]).length;
  const save = (next) => startTransition(() => dispatch({ type: 'filters', data: next }));
  const toggle = (name) => {
    const next = { ...chips, [name]: !chips?.[name] };
    save(next);
    trackSection(name, next[name]);
  };
  return <>
    <Button ref={buttonRef} variant="outlined" onClick={() => onOpenChange(!open)} aria-haspopup="dialog" aria-expanded={open}
            endIcon={<IconChevronDown size={18} aria-hidden/>} sx={{ color: 'text.primary', borderColor: 'outline', whiteSpace: 'nowrap' }}>
      Sections: {formatNum(on, 'whole')} of {formatNum(sections.length, 'whole')}
    </Button>
    <Popover open={open} anchorEl={() => buttonRef.current} onClose={() => onOpenChange(false)} disableScrollLock
             anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
             slotProps={{ paper: { 'aria-label': 'Sections', sx: { p: 2, mt: 1, width: 440, maxWidth: 'calc(100vw - 32px)' } } }}>
      <SectionChecklist chips={chips} onToggle={toggle} onAll={(all) => save(sectionsOf(chips, all))}/>
    </Popover>
  </>;
};

// The characters to show and the sections to show them with, as one switcher in the pinned bar: the shown character's class
// icon and name (or "+N" more, or All characters), with steps to the one before and after. A phone's switcher says
// "1 of 11" instead, so it, the steps and Filters keep one row. From lg it opens CharacterMenu below it and Sections has its
// own button; under lg it opens the drawer beside the page (a sheet with Done on a phone) holding both. The page owns what's
// open, so its notes can open them, and which one a press opens is read at the press, so the export never depends on width.
export const CharactersPicker = ({ open, onOpenChange, menuOpen, onMenuOpenChange, buttonRef, sectionsOpen, onSectionsOpenChange, sectionsRef }) => {
  const { state, dispatch } = useContext(AppContext);
  const theme = useTheme();
  const characters = state?.characters ?? [];
  if (!characters.length) return null;
  const displayed = shownCharacters(state);
  const shown = characters.filter((_, index) => displayed?.[index]);
  const allShown = shown.length === characters.length;
  const step = (by) => {
    const from = characters.findIndex((_, index) => displayed?.[index]);
    const data = onlyCharacter(characters.length, (from + by + characters.length) % characters.length);
    startTransition(() => dispatch({ type: 'displayedCharacters', data }));
  };
  const press = () => (window.matchMedia(`(min-width: ${theme.breakpoints.values.lg}px)`).matches
    ? onMenuOpenChange(!menuOpen) : onOpenChange(!open));
  const name = allShown ? ALL_LABEL : shown[0]?.name ?? 'No characters';
  const canStep = shown.length === 1 && characters.length > 1;
  // One width while you step through the characters, the longest label it can show (a name, or "All characters"), so
  // the arrows beside it stay put (Hαlf: "locked as if a max size name"). The rest is its padding, class icon and chevron.
  const labelChars = Math.max(ALL_LABEL.length, ...characters.map((character) => character?.name?.length ?? 0));
  // From lg the switcher and Sections are the bar's own items, so Sections wraps beside the bar's filters
  return <Box sx={{ display: { xs: 'flex', lg: 'contents' }, alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
    <Stack direction={'row'} gap={0.5} alignItems={'center'}>
      <IconButton aria-label={'Previous character'} onClick={() => step(-1)} disabled={!canStep} sx={STEP_SX}><IconChevronLeft size={18}/></IconButton>
      <Button ref={buttonRef} variant="outlined" onClick={press} aria-haspopup="dialog" aria-expanded={open || menuOpen}
              aria-label={`Characters: ${allShown ? 'all' : shown.map((character) => character.name).join(', ') || 'none'}`}
              endIcon={<IconChevronDown size={18} aria-hidden/>}
              sx={{
                color: 'text.primary', bgcolor: 'primary.soft', borderColor: 'primary.edge', fontWeight: 600, gap: 1, maxWidth: 260,
                width: { sm: `calc(${labelChars}ch + ${NAME_BUTTON_EXTRA}px)` }, justifyContent: 'flex-start',
                '& .MuiButton-endIcon': { ml: 'auto' }
              }}>
        {shown.length && !allShown ? <GameIcon src={classIconOf(shown[0].classIndex)} size={24} alt=""/> : null}
        <Box component="span" sx={[ELLIPSIS_SX, { display: { xs: 'none', sm: 'inline' } }]}>{name}</Box>
        {shown.length > 1 && !allShown
          ? <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, color: 'text.secondary', fontWeight: 500 }}>+{shown.length - 1}</Box> : null}
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' }, whiteSpace: 'nowrap' }}>{shown.length} of {characters.length}</Box>
      </Button>
      <IconButton aria-label={'Next character'} onClick={() => step(1)} disabled={!canStep} sx={STEP_SX}><IconChevronRight size={18}/></IconButton>
    </Stack>
    <Box sx={{ display: { xs: 'none', lg: 'contents' } }}>
      <SectionsButton open={sectionsOpen} onOpenChange={onSectionsOpenChange} buttonRef={sectionsRef}/>
    </Box>
    <CharacterMenu open={menuOpen} onClose={() => onMenuOpenChange(false)} anchorRef={buttonRef}/>
    <AppDrawer open={open} onClose={() => onOpenChange(false)} title="Characters" phoneActions={[{ label: 'Done', main: true }]}>
      <CharactersList/>
    </AppDrawer>
  </Box>;
};

export default CharactersList;
