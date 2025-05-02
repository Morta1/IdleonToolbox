import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import React from 'react';
import useCheckbox from '@components/common/useCheckbox';
import { CardTitleAndValue } from '@components/common/styles';

const Abominations = ({ abominations }) => {
  const [CheckboxEl, hideKilledAbominations] = useCheckbox('Hide killed abominations');
  const [CheckboxFutureEl, hideFutureAbominations] = useCheckbox('Hide future abominations', true);

  return <>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      <CardTitleAndValue title={''} value={<CheckboxEl/>}/>
      <CardTitleAndValue title={''} value={<CheckboxFutureEl/>}/>
    </Stack>
    <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
      {abominations?.map(({
                            name,
                            unlocked,
                            weakness,
                            hp,
                            map,
                            world
                          }, index) => {
        if (hideKilledAbominations && unlocked) return null;
        return (
          <Card key={name + index}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 370,
                minHeight: 250,
                height: '100%',
                opacity: unlocked > 0 ? 1 : 0.5
              }}
            >
              <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" sx={{ position: 'relative' }}>
                {unlocked || (!unlocked && !hideFutureAbominations)
                  ? <img style={{ width: 32, height: 32, zIndex: 1 }}
                         src={`${prefix}data/CompassUpg${119 + index}.png`}/>
                  : <Box sx={{ width: 32, height: 32 }}></Box>}
                <Typography>{cleanUnderscore(name)}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Stack direction="row" gap={.5} flexWrap="wrap" alignItems="center" sx={{ position: 'relative' }}>
                <Typography>Weakness: {cleanUnderscore(weakness?.name)}</Typography>
                <img style={{ width: 24, height: 24, zIndex: 1 }} src={`${prefix}data/WWeffect${weakness?.index}.png`}/>
              </Stack>
              <Typography>HP: {notateNumber(hp)}</Typography>
              <Typography>Map: {cleanUnderscore(map)} (World: {world})</Typography>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  </>
};

export default Abominations;
