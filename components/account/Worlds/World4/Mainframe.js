import React from 'react'
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";

const Mainframe = ({ characters, jewels, labBonuses, playersCords, divinity }) => {
  return (
    <>
      <Stack my={4} direction={'row'} flexWrap={'wrap'} justifyContent={'center'} gap={2}>
        {playersCords?.map((playerCord, index) => {
          if (index > 9) return null;
          const playerName = characters?.[index]?.name;
          const classIndex = characters?.[index]?.classIndex;
          const isUploaded = characters?.[index]?.afkTarget === 'Laboratory' || divinity?.linkedDeities?.[index] === 1;
          return isUploaded ?
            <Card sx={{ width: 200 }} variant={'outlined'} key={`${playerCord.x}${playerCord.y}-${index}`}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'} gap={2}>
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
                <JewelIcon style={{ borderRadius: "50%" }}
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

const BonusTooltip = ({ name, description, bonusDesc }) => {
  const desc = bonusDesc ? description.replace(/{/, bonusDesc) : description?.split("@_-_@")[0];
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
      sx={{ color: multiplier > 1 ? 'multi' : '' }}>{cleanUnderscore(effect?.replace(/}/g, bonus * multiplier)).split('@')[0]}</Typography>
  </>
}


export default Mainframe;
