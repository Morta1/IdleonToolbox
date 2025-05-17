import {
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
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppProvider';
import { prefix, sections } from 'utility/helpers';
import Tooltip from '../../../Tooltip';
import Kofi from '../../Kofi';

const CharactersDrawer = () => {
  const { state, dispatch } = useContext(AppContext);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [checked, setChecked] = React.useState(state?.displayedCharacters ? state?.displayedCharacters : {
    all: false,
    ...Array(state?.characters?.length).fill(false).reduce((res, _, index) => ({
      ...res,
      [index]: false
    }), {})
  });
  const [chips, setSelectedChips] = useState(state.filters ? state.filters : sections.reduce((res, { name }) => ({
    ...res,
    [name]: false
  }), {}));

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
    dispatch({ type: 'displayedCharacters', data: newState })
  };

  const totalLevels = useMemo(() => state?.characters?.reduce((res, { level }) => res + (level || 0), 0), [state]);

  const handleChipClick = (name) => {
    const newChipsState = {
      ...chips,
      [name]: !chips?.[name]
    };
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'filter_selection', {
        event_category: name,
        event_label: 'engagement',
        value: !chips?.[name]
      })
    }
    setSelectedChips(newChipsState);
    dispatch({ type: 'filters', data: newChipsState })
  }

  // Render character skeleton loaders while data is loading
  const renderCharactersList = () => {
    if (state.isLoading || !state?.characters?.length) {
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
      const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png'
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

  // Render "All" item with skeleton when loading
  const renderAllItem = () => {
    if (state.isLoading || !state?.characters?.length) {
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
    <Stack sx={{ height: '100%' }}>
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
                               border: '1px solid #454545',
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
      <Divider/>
      <List style={{ marginTop: 'auto', paddingBottom: 0 }}>
        <ListItem>
          <ListItemText>
            <Kofi display={'inline-block'}/>
          </ListItemText>
        </ListItem>
      </List>
    </Stack>
  );
};

export default CharactersDrawer;
