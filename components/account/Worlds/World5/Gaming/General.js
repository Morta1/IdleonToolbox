import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { cleanUnderscore, getBitIndex, notateNumber, prefix } from "../../../../../utility/helpers";
import Timer from "../../../../common/Timer";
import Tooltip from "../../../../Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import styled from "@emotion/styled";

const General = ({
                   bits,
                   availableSprouts,
                   availableDrops,
                   sproutsCapacity,
                   fertilizerUpgrades,
                   imports,
                   lastShovelClicked,
                   goldNuggets,
                   lastAcornClicked,
                   acorns,
                   nuggetsBreakpoints,
                   acornsBreakpoints,
                   lastUpdated
                 }) => {
  return <>
    <Stack direction={'row'} gap={2}>
      <Card sx={{ width: 250, display: 'flex', alignItems: 'center' }}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <img src={`${prefix}etc/Bits_${getBitIndex(bits)}.png`} alt=""/>
            <Typography>{notateNumber(bits, 'bits')}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ width: 250, display: 'flex', alignItems: 'center' }}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <img src={`${prefix}etc/Sprouts.png`} alt=""/>
            <Typography>{availableSprouts} / {sproutsCapacity ?? 0}</Typography>
          </Stack>
        </CardContent>
      </Card>
      <Card sx={{ width: 250, display: 'flex', alignItems: 'center' }}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <img src={`${prefix}etc/GamingDrop.png`} alt=""/>
            <Typography>{availableDrops} / {sproutsCapacity ?? 0}</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>

    <Stack mt={2} direction={'row'} flexWrap={'wrap'} gap={2}>
      {fertilizerUpgrades?.map(({ name, level, description, cost }) => {
        return <Card key={name} sx={{ width: 250 }}>
          <CardContent>
            <Stack direction={'row'} gap={2}>
              <Typography sx={{ width: 120 }}>{cleanUnderscore(name)}</Typography>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography mt={1}>{cleanUnderscore(description)}</Typography>
            <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
              <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
              <Typography>{cost}</Typography>
            </Stack>
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
                       acornShop,
                       maxNuggetValue,
                       level
                     }, index) => {
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
              <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
                <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
                <Typography>{notateNumber(cost, "bits")}</Typography>
              </Stack>
              {acquired && (index === 1 || index === 2) ? <Divider sx={{ my: 2 }}/> : null}
              {acquired && index === 1 ?
                <>
                  <Stack mt={1} direction={'row'} gap={1}>
                    <Timer date={new Date().getTime() - lastShovelClicked * 1000} lastUpdated={lastUpdated}/>
                    <Tooltip title={<ResourcePerTime breakpoints={nuggetsBreakpoints}/>}>
                      <InfoIcon/>
                    </Tooltip>
                  </Stack>
                  <Typography># of nuggets: {goldNuggets}</Typography>
                  <Typography>Max roll possible: {maxNuggetValue}</Typography>
                </> : null}
              {acquired && index === 2 ?
                <>
                  <Stack mt={1} direction={'row'} gap={1}>
                    <Timer date={new Date().getTime() - lastAcornClicked * 1000} lastUpdated={lastUpdated}/>
                    <Tooltip title={<ResourcePerTime breakpoints={acornsBreakpoints}/>}>
                      <InfoIcon/>
                    </Tooltip>
                  </Stack>
                  <Typography># of acorns: {acorns}</Typography>
                </> : null}
              {saveSprinklerChance ? <Typography>Save sprinkler chance: {saveSprinklerChance}%</Typography> : null}
              {acornShop ? <Stack>
                <Divider sx={{ my: 2 }}/>
                <Typography>Acorn Shop</Typography>
                <Stack direction={'row'} gap={3}>
                  {acornShop?.map(({ cost, bonus, description }, index) => <Stack key={'corn-' + index}>
                    <Stack>
                      <Typography>{description}</Typography>
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


const ResourcePerTime = ({ breakpoints }) => {
  return <Stack>
    <Typography sx={{ fontWeight: 'bold' }}>Breakpoints</Typography>
    {breakpoints?.map(({ time, amount }, index) => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.round(time / 3600 % 1 * 60)
      return <Stack key={`bp-${index}`} direction={'row'} gap={2}>
        <Typography sx={{ width: 100 }}>{`${hours}h`}{minutes > 0 ? `:${minutes}m` : ''}</Typography>
        <Typography>{amount}</Typography>
      </Stack>
    })}
  </Stack>
}

const ImportImg = styled.img`
  width: 50px;
`;

export default General;
