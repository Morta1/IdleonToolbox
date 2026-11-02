import {
  Box,
  Button,
  Checkbox,
  Chip,
  chipClasses,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import React, { startTransition, useContext, useEffect, useState } from 'react';
import { AppContext, shownFilters } from '@components/common/context/AppProvider';
import Notice from '@components/common/Notice';
import { prefix, sections } from 'utility/helpers';
import Tooltip from '@components/Tooltip';
import AppDrawer from '@components/common/Overlays/AppDrawer';
import { IconChevronDown } from '@tabler/icons-react';

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

const CharactersList = () => {
  const { state, dispatch } = useContext(AppContext);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [checked, setChecked] = useState(() =>
    reconcileDisplayedCharacters(state?.displayedCharacters, state?.characters?.length));
  const [chips, setSelectedChips] = useState(shownFilters(state) ? shownFilters(state) : sections.reduce((res, { name }) => ({
    ...res,
    [name]: false
  }), {}));

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
    setChecked(reconcileDisplayedCharacters(state?.displayedCharacters, state?.characters?.length));
    if (shownFilters(state)) setSelectedChips(shownFilters(state));
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
      newState = {
        ...Array(state?.characters?.length).fill(false).reduce((res, _, index) => ({
          ...res,
          [index]: index === charIndex
        }), {}),
        all: false
      }
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

  const handleChipClick = (name) => {
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
            : <Notice tone={'missing'}>This account has no characters yet.</Notice>}
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
      const { name, classIndex, level } = character;
      const classIcon = classIconOf(classIndex);
      return <ListItem
        onMouseEnter={() => setHoverIndex(index)}
        onMouseLeave={() => setHoverIndex(null)}
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
          <Tooltip title={`Lv. ${level}`}>
            <img style={{ width: 38, height: 36 }} src={`${prefix}${classIcon}`} alt=""/>
          </Tooltip>
        </ListItemIcon>
        <ListItemText
          sx={{ height: 30, margin: 0 }} id={name} primary={name}
          secondary={hoverIndex === index ? <span
            onClick={() => handleCharacterChange(null, null, index)}
            style={{
              textDecoration: 'underline',
              cursor: 'pointer'
            }}>Only</span> : ''}/>
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
        <ListItemText>All (Lv. {totalLevels})</ListItemText>
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
            <Typography variant={'body1'}>Filter by section</Typography>
            <Stack direction={'row'} rowGap={1.5} columnGap={1} flexWrap={'wrap'}>
              {sections.map(({ name }, index) => {
                return <Chip key={`${name}-${index}`}
                             sx={{
                               borderRadius: '8px',
                               height: 24,
                               minWidth: 60,
                               maxWidth: 150,
                               border: '1px solid var(--mui-palette-divider)',
                               [`.${chipClasses.label}`]: {
                                 px: 1
                               }
                             }}
                             onClick={() => handleChipClick(name)} size={'small'}
                             variant={chips?.[name] ? 'filled' : 'outlined'}
                             color={chips?.[name] ? 'primary' : 'default'}
                             label={name}/>
              })}
            </Stack>
          </Stack>
        </ListItem>
      </List>
    </Stack>
  );
};

const classIconOf = (classIndex) => (classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png');

// The characters to show and the sections to show them with, behind one control (phase 4 Decision 9): the shown
// characters' class icons and how many of all, opening this list in a drawer beside the page, or a sheet with Done
// on a phone. Not modal on desktop, so a tick shows on the page at once.
export const CharactersPicker = () => {
  const { state } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const characters = state?.characters ?? [];
  if (!characters.length) return null;
  const shown = characters.filter((_, index) => state?.displayedCharacters?.[index]);
  return <>
    <Button variant="outlined" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
            endIcon={<IconChevronDown size={18} aria-hidden/>}
            sx={{ alignSelf: 'flex-start', color: 'text.primary', bgcolor: 'primary.soft', borderColor: 'primary.edge', fontWeight: 600 }}>
      {shown.length ? <Box component="span" aria-hidden sx={{ display: 'flex', mr: 1 }}>
        {shown.slice(0, 3).map(({ name, classIndex }, index) => (
          <Box key={`${name}-${index}`} component="img" src={`${prefix}${classIconOf(classIndex)}`} alt=""
               sx={{ width: 24, height: 22, objectFit: 'contain', mr: -0.5 }}/>
        ))}
      </Box> : null}
      Characters: {shown.length} of {characters.length}
    </Button>
    <AppDrawer open={open} onClose={() => setOpen(false)} title="Characters" phoneActions={[{ label: 'Done', main: true }]}>
      <CharactersList/>
    </AppDrawer>
  </>;
};

export default CharactersList;
