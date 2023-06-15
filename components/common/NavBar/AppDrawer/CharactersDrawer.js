import { Checkbox, Chip, Divider, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppProvider';
import { prefix, sections } from 'utility/helpers';
import Tooltip from '../../../Tooltip';
import Kofi from '../../Kofi';

const CharactersDrawer = () => {
  const { state, dispatch } = useContext(AppContext);
  const [checked, setChecked] = React.useState(state?.displayedCharacters ? state?.displayedCharacters : {
    all: false, ...state?.characters?.reduce((res, { name }) => ({
      ...res,
      [name]: false
    }), {})
  });
  const [chips, setSelectedChips] = useState(state.filters ? state.filters : sections.reduce((res, { name }) => ({
    ...res,
    [name]: false
  }), {}));

  const handleCharacterChange = (event) => {
    let newState;
    if (event === 'all') {
      newState = {
        all: !checked.all,
        ...state?.characters?.reduce((res, { name }) => ({ ...res, [name]: !checked.all }), {})
      };
    } else {
      newState = {
        ...checked,
        [event.target.name]: event.target.checked,
      }
    }
    setChecked(newState);
    dispatch({ type: 'displayedCharacters', data: newState })
  };

  const totalLevels = useMemo(() => state?.characters?.reduce((res, { level }) => res + level, 0), [state]);

  const handleChipClick = (name) => {
    const newChipsState = {
      ...chips,
      [name]: !chips?.[name]
    };
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'filter_selection', {
        event_category: name,
        event_label: 'engagement',
        value: !chips?.[name],
      })
    }
    setSelectedChips(newChipsState);
    dispatch({ type: 'filters', data: newChipsState })
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Divider/>
      <List dense={true}>
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
        {state?.characters?.map((character, index) => {
          const { name, classIndex, level } = character;
          return <ListItem
            key={`${name}-${index}`}
            secondaryAction={
              <Checkbox
                edge="end"
                name={`${name}`}
                onChange={handleCharacterChange}
                checked={checked?.[name]}
                role={"checkbox"}
                aria-label={`Check to see stats for ${name}`}
              />}>
            <ListItemIcon>
              <Tooltip title={`Lv. ${level}`}>
                <img style={{ width: 38, height: 36 }} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
              </Tooltip>
            </ListItemIcon>
            <ListItemText id={name} primary={name}/>
          </ListItem>
        })}
      </List>
      <Divider/>
      <List>
        <ListItem>
          <Stack gap={2}>
            <Typography>Filter by section</Typography>
            <Stack direction={'row'} rowGap={1.5} columnGap={1} flexWrap={'wrap'}>
              {sections.map(({ name }, index) => {
                return <Chip key={`${name}-${index}`}
                             sx={{
                               borderRadius: '8px',
                               height: 24,
                               minWidth: 60,
                               maxWidth: 150,
                               border: '1px solid gray'
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
      <List style={{ marginTop: 'auto' }}>
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
