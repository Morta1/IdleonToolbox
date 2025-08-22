import { FormControl, InputLabel, Select } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';

const BuildSelector = ({ handleChange, value }) => {
  return <FormControl sx={{ width: 350 }}>
    <InputLabel id="build-select-label">Build</InputLabel>
    <Select
      size={'small'}
      placeholder={'Choose a build'}
      labelId="build-select-label"
      id="build-select"
      value={value?.index}
      label="Build"
      onChange={handleChange}>
      {value?.list?.map((build, index) => {
        const { title } = build;
        return <MenuItem key={`${title}-${index}`}
                         value={index}>{title || 'Press + to add the first build!'}</MenuItem>;
      })}
    </Select>
  </FormControl>
}

export default BuildSelector;