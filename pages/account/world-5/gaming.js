import React, { useContext, useState } from 'react';
import { AppContext } from "../../../components/common/context/AppProvider";
import { Card, CardContent, Divider, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import { cleanUnderscore, kFormatter, notateNumber, prefix } from "../../../utility/helpers";
import styled from "@emotion/styled";

const Gaming = () => {
  const { state } = useContext(AppContext);
  const { bits, fertilizerUpgrades, imports } = state?.account?.gaming || {};

  return <>
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Gaming</Typography>

    <Card sx={{ width: 250 }}>
      <CardContent>
        <Stack direction={'row'} gap={1} alignItems={'center'}>
          <img src={`${prefix}data/Bits_x1.png`} alt=""/>
          <Typography>{kFormatter(bits, 2)}</Typography>
        </Stack>
      </CardContent>
    </Card>

    <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
      {fertilizerUpgrades?.map(({ name, level, description }) => {
        return <Card key={name} sx={{ width: 250 }}>
          <CardContent>
            <Stack direction={'row'} gap={2}>
              <Typography sx={{ width: 120 }}>{cleanUnderscore(name)}</Typography>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography mt={1}>{cleanUnderscore(description)}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>

    <Typography variant={'h3'} my={3}>Imports</Typography>
    <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
      {imports?.map(({
                       boxName,
                       boxDescription,
                       name,
                       description,
                       majorBonus,
                       minorBonus,
                       cost,
                       rawName,
                       saveSprinklerChance,
                       acquired,
                       acornShop
                     }) => {
        return <Card key={name} sx={{ width: 380 }} variant={acquired ? 'elevation' : 'outlined'}>
          <CardContent>
            <Stack sx={{ minHeight: 200 }}>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <ImportImg src={`${prefix}data/${rawName}.png`} alt=""/>
                <Typography>{cleanUnderscore(name)} ({cleanUnderscore(boxName)})</Typography>
              </Stack>
              <Divider sx={{ my: 2 }}/>
              {majorBonus ? <><Typography> {cleanUnderscore(majorBonus.split("|").join(" "))}</Typography>
                <Divider sx={{ my: 2 }}/> </> : null}
              <Typography>{cleanUnderscore(minorBonus)}</Typography>
              <Typography>Cost: {notateNumber(cost, "bits")} bits</Typography>
              {saveSprinklerChance ? <Typography>Save sprinkler chance: {saveSprinklerChance}%</Typography> : null}
              {acornShop ? <Stack>
                <Divider sx={{ my: 2 }}/>
                <Typography>Acorn Shop</Typography>
                <Stack direction={'row'} gap={3}>
                  {acornShop?.map(({ cost, bonus, description }, index) => <Stack key={'corn-' + index}>
                    <Stack>
                      <Typography>{description}</Typography>
                      {/*<Typography>Bonus: {bonus.toFixed(2)}%</Typography>*/}
                      <Typography>Cost: {cost}</Typography>
                    </Stack>
                  </Stack>)}
                </Stack>
              </Stack> : null}
              <Divider sx={{ my: 2 }}/>
            </Stack>
            <Stack mt={'auto'}>
              <Typography mb={1} variant={'body2'}>Box info</Typography>
              <Stack>
                <Typography variant={'caption'}>{cleanUnderscore(boxDescription)}</Typography>
                <Typography mt={1} variant={'caption'}>{cleanUnderscore(description)}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ImportImg = styled.img`
  width: 50px;
`;

export default Gaming;
