import {
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import React, { startTransition, useContext, useEffect, useState } from 'react';
import { AppContext, shownCharacters, shownFilters } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { formatNum, sections } from 'utility/helpers';
import AppDrawer from '@components/common/Overlays/AppDrawer';
import GameIcon from '@components/common/GameIcon';
import { FilterPill } from '@components/common/Toolbar';
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
        const newAllState = !checked.all;
        newState = {
          all: newAllState,
          ...Array(state?.characters?.length).fill(false).reduce((res, _, index) => ({
            ...res,
            [index]: newAllState
          }), {})
        };
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
    if (typeof window.gtag !== 'undefined') {
      setTimeout(() => {
        window.gtag('event', 'filter_selection', {
          event_category: name,
          event_label: 'engagement',
          value: !chips?.[name]
        });
      }, 0);
    }
  }

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
          <Stack gap={2}>
            <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>Sections</Typography>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
              {sections.map(({ name }, index) => <FilterPill key={`${name}-${index}`} label={name} on={chips?.[name]}
                                                             onToggle={() => toggleSection(name)}/>)}
            </Stack>
          </Stack>
        </ListItem>
      </List>
    </Stack>
  );
};

const classIconOf = (classIndex) => (classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png');

// While one character shows, a step to the one before or after it, wrapping round. 40 px, 44 on touch.
const STEP_SX = {
  width: 40, height: 40, border: 1, borderColor: 'outline', borderRadius: '6px', color: 'text.primary',
  '@media (pointer: coarse)': { width: 44, height: 44 }
};

// The characters to show and the sections to show them with, behind one control (phase 4 Decision 9): the shown
// characters' class icons and how many of all, opening this list in a drawer beside the page, or a sheet with Done
// on a phone. Not modal on desktop, so a tick shows on the page at once. The page owns open, so its note can open it.
export const CharactersPicker = ({ open, onOpenChange, buttonRef }) => {
  const { state, dispatch } = useContext(AppContext);
  const characters = state?.characters ?? [];
  if (!characters.length) return null;
  const displayed = shownCharacters(state);
  const shown = characters.filter((_, index) => displayed?.[index]);
  const step = (by) => {
    const from = characters.findIndex((_, index) => displayed?.[index]);
    const data = onlyCharacter(characters.length, (from + by + characters.length) % characters.length);
    startTransition(() => dispatch({ type: 'displayedCharacters', data }));
  };
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Button ref={buttonRef} variant="outlined" onClick={() => onOpenChange(true)} aria-haspopup="dialog" aria-expanded={open}
            endIcon={<IconChevronDown size={18} aria-hidden/>}
            sx={{ color: 'text.primary', bgcolor: 'primary.soft', borderColor: 'primary.edge', fontWeight: 600 }}>
      {shown.length ? <Box component="span" aria-hidden sx={{ display: 'flex', mr: 1 }}>
        {shown.slice(0, 3).map(({ name, classIndex }, index) => (
          <Box key={`${name}-${index}`} component="span" sx={{ display: 'inline-flex', mr: -0.5 }}>
            <GameIcon src={classIconOf(classIndex)} size={24} alt=""/>
          </Box>
        ))}
      </Box> : null}
      Characters: {shown.length} of {characters.length}
    </Button>
    {shown.length === 1 && characters.length > 1 ? <Stack direction={'row'} gap={0.5}>
      <IconButton aria-label={'Previous character'} onClick={() => step(-1)} sx={STEP_SX}><IconChevronLeft size={18}/></IconButton>
      <IconButton aria-label={'Next character'} onClick={() => step(1)} sx={STEP_SX}><IconChevronRight size={18}/></IconButton>
    </Stack> : null}
    <AppDrawer open={open} onClose={() => onOpenChange(false)} title="Characters" phoneActions={[{ label: 'Done', main: true }]}>
      <CharactersList/>
    </AppDrawer>
  </Box>;
};

export default CharactersList;
