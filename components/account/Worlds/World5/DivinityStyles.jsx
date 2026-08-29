import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { divStyles } from '@website-data';

const DivinityStyles = ({ characters }) => {
  return <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
    {divStyles?.map(({ name, description }, styleIndex) => {
      const equippedBy = characters?.filter(({ divStyle }) => divStyle?.index === styleIndex) ?? [];
      return <Card key={name} variant={'outlined'} sx={{ height: '100%' }}>
        <CardContent>
          <Stack gap={1.5}>
            <Stack direction={'row'} alignItems={'center'} gap={1.5}>
              <img style={{ width: 58, height: 40 }} src={`${prefix}etc/Div_Style_${styleIndex}.png`} alt=""/>
              <Typography>{name}</Typography>
            </Stack>
            <Typography variant={'body2'}>{cleanUnderscore(description?.replace('@', ''))}</Typography>
            {equippedBy.length > 0 ? <>
              <Divider/>
              <Stack gap={0.5}>
                {equippedBy.map(({ name: charName, classIndex, playerId, skillsInfo }) => <Stack
                  key={`${charName}-${playerId}`} direction={'row'} alignItems={'center'} gap={1}>
                  <img style={{ width: 24, height: 24 }} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                  <Typography variant={'body2'}>{charName}</Typography>
                  <Typography variant={'body2'} color={'text.secondary'} sx={{ ml: 'auto' }}>
                    Lv. {skillsInfo?.divinity?.level ?? 0}
                  </Typography>
                </Stack>)}
              </Stack>
            </> : null}
          </Stack>
        </CardContent>
      </Card>
    })}
  </Box>;
};

export default DivinityStyles;
