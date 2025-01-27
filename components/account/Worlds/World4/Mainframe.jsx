import React from 'react'
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import { isGodEnabledBySorcerer } from '../../../../parsers/lab';
import Box from '@mui/material/Box';

const Mainframe = ({ characters, jewels, labBonuses, playersCords, divinity }) => {
  return (
    <>
      {/*<Map playersCords={playersCords} jewels={jewels} labBonuses={labBonuses}/>*/}
      <Stack my={4} direction={'row'} flexWrap={'wrap'} justifyContent={'center'} gap={2}>
        {playersCords?.map((playerCord, index) => {
          if (index > 9) return null;
          const playerName = characters?.[index]?.name;
          const classIndex = characters?.[index]?.classIndex;
          const connectedByGod = divinity?.linkedDeities?.[index] === 1 || isGodEnabledBySorcerer(characters?.[index], 1);
          const isUploaded = characters?.[index]?.afkTarget === 'Laboratory' || connectedByGod;
          return isUploaded ?
            <Card sx={{ width: 200, border: playerCord?.soupedUp ? '1px solid orange' : '' }} variant={'outlined'}
                  key={`${playerCord.x}${playerCord.y}-${index}`}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ position: 'relative' }}>
                  {connectedByGod ? <img style={{ position: 'absolute', top: -16, right: -16 }}
                                         width={24} height={24}
                                         src={`${prefix}data/DivGod1.png`}
                                         alt=""/> : null}
                  <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                  <Stack>
                    <Typography>{playerName}</Typography>
                    <Typography>{playerCord?.lineWidth}px</Typography>
                    <Typography variant={'caption'}>({playerCord.x},{playerCord.y})</Typography>
                  </Stack>
                  {/*<img src={`${prefix}data/head.png`} alt={''}/>*/}
                </Stack>
              </CardContent>
            </Card> : null;
        })}
      </Stack>
      <Stack direction={'row'} justifyContent={'center'} gap={2} flexWrap={'wrap'}>
        {labBonuses?.map((labBonus, index) => {
          return <Card key={`bonus-${labBonus?.name}-${index}`} variant={'outlined'}
                       sx={{ borderColor: labBonus?.active ? 'success.dark' : '' }}>
            <CardContent>
              <Tooltip title={<BonusTooltip {...labBonus}/>}>
                <BonusIcon src={`${prefix}data/LabBonus${labBonus?.index}.png`}
                           alt=""/>
              </Tooltip>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack my={4} direction={'row'} justifyContent={'center'} gap={2} flexWrap={'wrap'}>
        {jewels?.map((jewel, index) => {
          return <Card key={`${jewel?.name}-${index}`} variant={'outlined'}
                       sx={{ borderColor: jewel?.active ? 'success.dark' : '', opacity: jewel?.acquired ? 1 : .3 }}>
            <CardContent>
              <Tooltip title={<JewelTooltip {...jewel}/>}>
                <JewelIcon style={{ borderRadius: '50%' }}
                           src={`${prefix}data/${jewel?.rawName}.png`} alt=""/>
              </Tooltip>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};

const BonusIcon = styled.img`
  width: 64px;
`

const JewelIcon = styled.img`
  width: 64px;
`

const BonusTooltip = ({ name, description, bonusDesc, extraData }) => {
  let desc = extraData ? description?.replace(/\+[0-9]+%/, `+${extraData}%`) : description;
  desc = bonusDesc ? desc.replace(/{/, bonusDesc) : desc?.split('@_-_@')[0];
  return <>
    <Typography my={1} fontWeight={'bold'}
                variant={'h5'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography>{cleanUnderscore(desc)}</Typography>
  </>
}

const JewelTooltip = ({ effect, bonus, name, multiplier = 1 }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h5'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography
      sx={{
        color: multiplier > 1
          ? 'multi'
          : ''
      }}>{cleanUnderscore(effect?.replace(/}/g, bonus * multiplier)).split('@')[0]}</Typography>
  </>;
}

const Map = ({ playersCords, labBonuses, jewels }) => {
  return <Box sx={{ position: 'relative', height: 200 }}>
    <Box sx={{ position: 'absolute', left: 43 / 2, top: 229 / 2.5, height: 24, width: 24, backgroundColor: 'yellow' }}/>
    {playersCords.map(({ x, y, playerName }) => {
      return <Tooltip title={playerName} key={'map' + playerName}>
        <Box
          sx={{
            position: 'absolute',
            left: x / 2,
            top: y / 2.5,
            backgroundColor: 'white',
            height: 24,
            width: 24,
            border: '1px solid red',
            borderRadius: '50%'
          }}/>
      </Tooltip>
    })}
    {labBonuses.map(({ x, y, name, index, active }) => {
      return <Box key={'map' + name}
                  sx={{
                    position: 'absolute',
                    left: x / 2,
                    top: y / 2.5,
                    opacity: active ? 1 : .5
                  }}>
        <BonusIcon style={{ width: 24 }} src={`${prefix}data/LabBonus${index}.png`}
                   alt=""/>
      </Box>
    })}
    {jewels.map(({ x, y, name, rawName, active }) => {
      return <Box key={'map' + name}
                  sx={{
                    position: 'absolute',
                    left: x / 2,
                    top: y / 2.5,
                    opacity: active ? 1 : .5
                  }}>
        <JewelIcon style={{ width: 24 }}
                   src={`${prefix}data/${rawName}.png`} alt=""/>
      </Box>
    })}
  </Box>
}


export default Mainframe;
