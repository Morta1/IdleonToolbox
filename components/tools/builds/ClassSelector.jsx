import { FormControl, InputLabel, Select, Stack, Typography } from '@mui/material';
import allBuilds from '../../../data/builds.json';
import MenuItem from '@mui/material/MenuItem';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { classes } from '../../../data/website-data';
import React from 'react';
import styled from '@emotion/styled';

const ClassSelector = ({ handleChange, value }) => {
  return <FormControl sx={{ width: 270 }}>
    <InputLabel id="class-select-label">Class</InputLabel>
    <Select
      size={'small'}
      labelId="class-select-label"
      id="class-select"
      value={value}
      label="Class"
      onChange={handleChange}
    >
      {Object.keys(allBuilds).map((name, index) => {
        return <MenuItem key={`${name}-${index}`} value={name}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <ClassIcon src={`${prefix}data/ClassIcons${classes.indexOf(name)}.png`} alt="class-icon"/>
            <Typography>{cleanUnderscore(name)}</Typography>
          </Stack>
        </MenuItem>;
      })}
    </Select>
  </FormControl>
}

const ClassIcon = styled.img`
  height: 25px;
  width: 25px;
  object-fit: contain;
`

export default ClassSelector;