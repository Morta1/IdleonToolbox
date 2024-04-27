import { calculateSnailEncouragementForSuccessChance } from '../../../../../parsers/gaming';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, prefix } from '../../../../../utility/helpers';
import Timer from '../../../../common/Timer';
import Tooltip from '../../../../Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import styled from '@emotion/styled';
import React from 'react';

const Imports = ({ account, lastUpdated }) => {
  const {
    bits,
    snailLevel,
    snailEncouragement,
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
    envelopes,
    bestNugget
  } = account?.gaming || {};
  return (
    <>
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
                {majorBonus ? <><Typography> {cleanUnderscore(majorBonus.split('|').join(' '))}</Typography>
                  <Divider sx={{ my: 2 }}/> </> : null}
                <Typography>{cleanUnderscore(minorBonus)}</Typography>
                <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
                  <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
                  <Typography>{notateNumber(cost, 'bits')}</Typography>
                </Stack>
                {acquired && (index === 1 || index === 2) ? <Divider sx={{ my: 2 }}/> : null}
                {acquired && index === 1 ? <Nuggets account={account} bestNugget={bestNugget} lastUpdated={lastUpdated}
                                                    goldNuggets={goldNuggets}
                                                    lastShovelClicked={lastShovelClicked}
                                                    maxNuggetValue={maxNuggetValue}
                                                    nuggetsBreakpoints={nuggetsBreakpoints}/> : null}
                {acquired && index === 2 ? <Acorns acorns={acorns} lastUpdated={lastUpdated}
                                                   acornsBreakpoints={acornsBreakpoints}
                                                   lastAcornClicked={lastAcornClicked}/> : null}
                {acquired && index === 7 ? <Snail snailLevel={snailLevel}
                                                  snailEncouragement={snailEncouragement}/> : null}
                {saveSprinklerChance ? <Typography>Save sprinkler chance: {saveSprinklerChance}%</Typography> : null}
                {acornShop ? <AcornShop acornShop={acornShop}/> : null}
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
  );
};


const Snail = ({ snailLevel, snailEncouragement }) => {
  const successChance = Math.min(1, (1 - 0.1 * Math.pow(snailLevel, 0.72)) * (1 + (100 * snailEncouragement) / (25 + snailEncouragement) / 100));
  const resetChance = Math.max(0, (Math.pow(snailLevel + 1, 0.07) - 1) / (1 + (300 * snailEncouragement) / (100 + snailEncouragement) / 100));
  const realResetChance = (resetChance * (1 - successChance));
  const averageAttempts = 1 / successChance;
  const succeedBeforeReset = 1 - Math.pow(1 - successChance, 1 / realResetChance);
  const encNeededForProbableSuccess = calculateSnailEncouragementForSuccessChance(snailLevel, 0.9);
  return <Stack>
    <Divider sx={{ my: 1 }}/>
    <Typography>Level: {snailLevel}</Typography>
    <Typography>Encouragement: {snailEncouragement}</Typography>
    <Typography>Success chance: {notateNumber(successChance * 100, 'MultiplierInfo')}%</Typography>
    <Typography>Reset chance: {notateNumber(resetChance * 100, 'MultiplierInfo')}%</Typography>
    <Typography>Real Reset
      chance: {notateNumber(realResetChance * 100, 'MultiplierInfo')}%</Typography>
    <Typography>Avg # attempts: {notateNumber(averageAttempts, 'MultiplierInfo')}</Typography>
    <Typography>Chance to Succeed Before Reset: {notateNumber(succeedBeforeReset, 'MultiplierInfo')}</Typography>
    <Typography>Enc. needed for 90% success
      chance: {encNeededForProbableSuccess}</Typography>
  </Stack>
}

const Nuggets = ({
                   account,
                   goldNuggets,
                   nuggetsBreakpoints,
                   lastShovelClicked,
                   lastUpdated,
                   maxNuggetValue
                 }) => {
  return <>
    <Stack mt={1} direction={'row'} gap={1}>
      <Timer date={new Date().getTime() - lastShovelClicked * 1000} lastUpdated={lastUpdated}/>
      <Tooltip title={<ResourcePerTime breakpoints={nuggetsBreakpoints}/>}>
        <InfoIcon/>
      </Tooltip>
    </Stack>
    <Typography># of nuggets: {goldNuggets}</Typography>
    <Typography>Rolls
      possible: {(notateNumber(maxNuggetValue / 1584.89))}-{notateNumber(maxNuggetValue)}</Typography>
    <Typography>Nuggets since upgrade: {account?.accountOptions?.[192]}</Typography>
  </>
}

const Acorns = ({ lastAcornClicked, lastUpdated, acornsBreakpoints, acorns }) => {
  return <>
    <Stack mt={1} direction={'row'} gap={1}>
      <Timer date={new Date().getTime() - lastAcornClicked * 1000} lastUpdated={lastUpdated}/>
      <Tooltip title={<ResourcePerTime breakpoints={acornsBreakpoints}/>}>
        <InfoIcon/>
      </Tooltip>
    </Stack>
    <Typography># of acorns: {acorns}</Typography>
  </>
}
const AcornShop = ({ acornShop }) => {
  return <Stack>
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
  </Stack>
}


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

export default Imports;
