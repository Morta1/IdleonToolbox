import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import React, { useState } from "react";
import styled from "@emotion/styled";

const Pets = ({ pets }) => {
  const [minimized, setMinimized] = useState(true);
  return <>
    <Stack justifyContent={'center'} flexWrap={'wrap'} gap={2}>
      <FormControlLabel
        control={<Checkbox name={'mini'} checked={minimized}
                           size={'small'}
                           onChange={() => setMinimized(!minimized)}/>}
        label={'Compact view'}/>
      {pets?.map((world, worldIndex) => {
        return <React.Fragment key={`world-${worldIndex}`}>
          <Typography variant={'h3'}>World {worldIndex + 1}</Typography>
          <Card key={`world-${worldIndex}`}>
            <CardContent>
              <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
                {world?.map(({ monsterName, icon, passive, level, shinyLevel, gene, unlocked }) => {
                  return <Card key={`${monsterName}-${worldIndex}`} variant={'outlined'} sx={{
                    opacity: unlocked ? 1 : .6
                  }}>
                    <CardContent sx={{ width: 300 }}>
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <MonsterIcon src={`${prefix}data/${icon}.png`}
                                     alt=""/>
                        <Stack>
                          <Typography>{cleanUnderscore(monsterName)}</Typography>
                          <Typography variant={'caption'}>Lv. {level}</Typography>
                          <Typography variant={'caption'} sx={{ opacity: shinyLevel > 0 ? 1 : .6 }}>Shiny
                            Lv. {shinyLevel}</Typography>
                        </Stack>
                      </Stack>
                      <Divider sx={{ my: 1 }}/>
                      <Stack sx={{ opacity: shinyLevel > 0 ? 1 : .6 }}>
                        <Typography variant={'caption'}>Shiny Passive:</Typography>
                        <Typography>{cleanUnderscore(passive)}</Typography>
                      </Stack>
                      <Divider sx={{ my: 1 }}/>
                      <Stack>
                        <Typography variant={'caption'}>Gene:</Typography>
                        <Stack direction={'row'} gap={1}>
                          <GeneIcon src={`${prefix}data/GeneReady${gene?.index}.png`} alt=""/>
                          <Typography>{cleanUnderscore(gene?.name)}</Typography>
                        </Stack>
                      </Stack>
                      {!minimized ? <>
                        <Stack sx={{ mt: 2 }}>
                          <Typography variant={'caption'} sx={{ color: 'error.light' }}>Combat Ability:</Typography>
                          <Typography>{cleanUnderscore(gene?.combatAbility)}</Typography>
                        </Stack>
                        <Stack sx={{ mt: 1 }}>
                          <Typography variant={'caption'} sx={{ color: 'success.light' }}>Bonus Ability:</Typography>
                          <Typography>{cleanUnderscore(gene?.bonusAbility)}</Typography>
                        </Stack>
                      </> : null}
                    </CardContent>
                  </Card>
                })}
              </Stack>
            </CardContent>
          </Card>
        </React.Fragment>
      })}
    </Stack>
  </>
};


const GeneIcon = styled.img`
  width: 44px;
  height: 44px;
`
const MonsterIcon = styled.img`
  width: 34px;
  height: 30px;
  object-fit: none;
  object-position: 0 100%;
`
export default Pets;
