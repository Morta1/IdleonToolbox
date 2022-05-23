import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import React from "react";
import Tooltip from "components/Tooltip";
import styled from "@emotion/styled";
import Box from "@mui/material/Box";

const chipSlotReq = [5, 10, 15, 25, 35, 50, 75];
const Console = ({ chips, playersChips, characters }) => {
  return (
    <>
      <Stack gap={3} alignItems={'center'}>
        {playersChips?.map((playerChips, index) => {
          const playerName = characters?.[index]?.name;
          const classIndex = characters?.[index]?.classIndex;
          const playerLabLevel = characters?.[index]?.skillsInfo?.laboratory?.level ?? 0;
          return <Card key={`player-${index}`}>
            <CardContent>
              <Stack direction='row' alignItems={'center'} gap={3}>
                <Stack sx={{ width: 175, textAlign: 'center' }} direction='row' alignItems={'center'} gap={2}>
                  <Stack alignItems={'center'} justifyContent={'center'}>
                    <img className={'class-icon'} src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                    <Typography>Lv. {playerLabLevel}</Typography>
                  </Stack>
                  <Typography className={'character-name'}>{playerName}</Typography>
                </Stack>
                <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
                  {playerChips?.map((chip, chipIndex) => {
                    const isSlotAvailable = playerLabLevel >= chipSlotReq[chipIndex];
                    return <Card elevation={5} key={`${chip?.name}-${chipIndex}`}>
                      <CardContent>
                        <Stack justifyContent={'center'}>
                          {chip !== -1 ? <Tooltip title={<ChipTooltip {...chip}/>}>
                            <ChipIcon src={`${prefix}data/ConsoleChip${chip?.index}.png`} alt=""/>
                          </Tooltip> : <Box sx={{
                            width: 42,
                            height: 42, display: 'flex', alignItems: 'center'
                          }}>{isSlotAvailable ? '' : `Lv. ${chipSlotReq?.[chipIndex]}`}</Box>}
                        </Stack>
                      </CardContent>
                    </Card>
                  })}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack direction={'row'} gap={3} justifyContent={'center'} my={5} alignItems={'center'}>
        <Card>
          <CardContent>
            <Stack direction={'row'} gap={2} justifyContent={'center'} flexWrap={'wrap'}>
              {chips?.map((chip, index) => {
                return <Card elevation={5} key={`${chip?.name}-${index}`}>
                  <CardContent>
                    <Stack justifyContent={'center'} alignItems={'center'}>
                      <Tooltip title={<ChipTooltip {...chip}/>}>
                        <img src={`${prefix}data/ConsoleChip${index}.png`}
                             alt=""/>
                      </Tooltip>
                      {chip?.amount >= 0 ? <div className="amount">{chip?.amount}</div> : null}
                    </Stack>
                  </CardContent>
                </Card>
              })}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};

const ChipIcon = styled.img`
`;

const ChipTooltip = ({ name, bonus, baseVal }) => {
  return <>
    <Typography mb={1} fontWeight={'bold'}
                variant={'h6'}>{cleanUnderscore(name.toLowerCase().capitalize())}</Typography>
    <Typography>{cleanUnderscore(bonus?.replace(/{/g, baseVal))}</Typography>
  </>
}

export default Console;
