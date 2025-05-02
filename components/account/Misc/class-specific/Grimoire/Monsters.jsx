
import { Card, CardContent, Divider, Stack, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React, { useState } from 'react';
import { boneNames } from '@parsers/grimoire';

const Monsters = ({ monsters }) => {
  const [selectedBoneType, setSelectedBoneType] = useState('');

  const filterMonsters = (list) => {
    if (selectedBoneType === '') return list;
    return list.filter(monster => monster.boneType === parseInt(selectedBoneType));
  };

  const filteredMonsters = filterMonsters(monsters);

  return <>
    <Stack direction="column" gap={2}>
      <FormControl size="small" sx={{ width: 250, mb: 2 }}>
        <InputLabel id="bone-type-select-label">Filter by Bone Type</InputLabel>
        <Select
          labelId="bone-type-select-label"
          id="bone-type-select"
          value={selectedBoneType}
          label="Filter by Bone Type"
          onChange={(e) => setSelectedBoneType(e.target.value)}
        >
          <MenuItem value="">All Bone Types</MenuItem>
          {boneNames.map((name, index) => (
            <MenuItem key={index} value={index}>
              <Stack direction="row" gap={1} alignItems="center">
                <img
                  style={{ width: 24, height: 24, objectPosition: '0 -6px' }}
                  src={`${prefix}data/Bone${index}_x1.png`}
                />
                {name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {filteredMonsters?.map(({
                                  Name,
                                  description = '',
                                  boneType,
                                  boneQuantity
                                }, index) => {
          return (
            <Card key={Name + index}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 300,
                  minHeight: 76
                }}
              >
                <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center"
                       sx={{ position: 'relative' }}>
                  <img style={{ width: 41, height: 41, objectFit: 'contain' }}
                       src={`${prefix}afk_targets/${Name}.png`}/>
                  <Stack>
                    <Typography>{cleanUnderscore(Name)}</Typography>
                    <Typography variant={'caption'}>{description ? `(${description})` : ''}</Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1 }}/>
                <Stack sx={{ width: '100%' }} direction={'row'} alignItems={'center'} gap={2}>
                  <Stack direction={'row'} alignItems="center" sx={{ ml: 'auto' }}>
                    <Typography variant={'body1'}>{numberWithCommas(Math.floor(boneQuantity))}</Typography>
                    <img style={{ width: 42, height: 42, marginTop: -15 }}
                         src={`${prefix}data/Bone${boneType}_x1.png`}/>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  </>
};

export default Monsters;