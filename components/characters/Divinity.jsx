import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';

const Divinity = ({ character, account }) => {
  const { linkedDeity, deityMinorBonus = 0, secondLinkedDeityIndex, secondDeityMinorBonus = 0, divStyle } = character;
  const deities = account?.divinity?.deities;
  const links = [
    { slot: linkedDeity, bonus: deityMinorBonus },
    { slot: secondLinkedDeityIndex, bonus: secondDeityMinorBonus }
  ].filter(({ slot }) => slot != null && slot >= 0 && deities?.[slot]);
  const hasStyle = divStyle?.name != null;

  return <Stack sx={{ width: { xs: '100%', sm: 340 } }}>
    <Typography variant={'h5'}>Divinity</Typography>
    <Card variant={'outlined'}>
      <CardContent>
        <Stack gap={1.5}>
          {links.length === 0 ? <Typography variant={'body2'}>No god linked</Typography> : links.map(({ slot, bonus }) => {
            const { name, minorBonus } = deities[slot];
            return <Stack key={slot} direction={'row'} alignItems={'center'} gap={1.5}>
              <img style={{ width: 42, height: 42, objectFit: 'contain' }} src={`${prefix}data/DivGod${slot}.png`} alt=""/>
              <Stack>
                <Typography fontWeight={'bold'}>{cleanUnderscore(name)}</Typography>
                <Typography variant={'body2'}>{cleanUnderscore(minorBonus?.replace(/{/g, bonus.toFixed(2)))}</Typography>
              </Stack>
            </Stack>;
          })}
          <Divider/>
          {hasStyle ? <Stack direction={'row'} alignItems={'center'} gap={1.5}>
            <img style={{ width: 58, height: 40, objectFit: 'contain' }} src={`${prefix}etc/Div_Style_${divStyle?.index}.png`}
                 alt=""/>
            <Stack>
              <Typography fontWeight={'bold'}>{cleanUnderscore(divStyle?.name)}</Typography>
              <Typography variant={'body2'}>{cleanUnderscore(divStyle?.description?.replace('@', ''))}</Typography>
            </Stack>
          </Stack> : <Typography variant={'body2'}>No style selected</Typography>}
        </Stack>
      </CardContent>
    </Card>
  </Stack>;
};

export default Divinity;
