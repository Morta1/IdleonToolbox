import {
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { forwardRef, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, kFormatter, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import ProgressBar from 'components/common/ProgressBar';
import { NextSeo } from 'next-seo';
import Tooltip from '../../../components/Tooltip';
import { calcTotals } from '@parsers/printer';
import Box from '@mui/material/Box';
import { Breakdown, CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { calcCost, calcResourceToRankUp, calcTimeToRankUp, getRefineryCycles } from '@parsers/refinery';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const saltsColors = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4']
const boldSx = { fontWeight: 'bold' };

const Refinery = () => {
  const { state } = useContext(AppContext);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const { refinery } = state?.account;
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresCycles, setSquiresCycles] = useState(0);
  const [showNextLevelCost, setShowNextLevelCost] = useState(false);
  const [squiresCooldown, setSquiresCooldown] = useState([]);
  const [refineryCycles, setRefineryCycles] = useState([]);
  const activePrints = useMemo(() => calcTotals(state?.account), [state?.account]);

  useEffect(() => {
    const {
      squiresCycles,
      squiresCooldowns,
      cycles
    } = getRefineryCycles(state?.account, state?.characters, state?.lastUpdated);

    setSquiresCycles(squiresCycles);
    setSquiresCooldown(squiresCooldowns);
    setRefineryCycles(cycles);
  }, [state?.lastUpdated]);

  const getFuelTime = (rank, costs, saltIndex) => {
    if (!costs) return [];
    const timeArray = [];
    costs.forEach((cost) => {
      const baseCost = calcCost(state?.account?.refinery, rank, cost?.quantity, cost?.rawName, saltIndex);
      if (baseCost > cost?.totalAmount) {
        timeArray.push(0)
      }
      timeArray.push((cost?.totalAmount ?? 0) / (baseCost));
    });

    return Math.min(...timeArray);
  }

  return <>
    <NextSeo
      title="Refinery | Idleon Toolbox"
      description="Keep track of your refinery levels, timing, required materials and more"
    />
    <Stack mt={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {squiresCooldown?.map(({ name, cooldown, talentId }, index) => {
        return <Card sx={{ display: 'flex', alignItems: 'center' }} key={name + ' ' + index}>
          <CardContent sx={{ '&:last-child': { padding: 2 } }}>
            <Stack direction={'row'} gap={1} alignItems={'center'}>
              <img src={`${prefix}data/UISkillIcon130.png`} alt="skill-icon"/>
              <Stack alignItems={'center'}>
                <Typography sx={boldSx}>{name}</Typography>
                <Timer placeholder={<Typography component={'span'}
                                                sx={{ color: 'success.main', fontWeight: 'bold' }}>Ready</Typography>}
                       type={'countdown'} date={cooldown} lastUpdated={state?.lastUpdated}/>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
      {refineryCycles?.map((cycle, index) => {
        const { name, time, timePast, breakdown } = cycle;
        const minutes = Math.floor((time) / 60);
        const seconds = Math.floor(time % 60);
        return <Card key={`${name}-${index}`}>
          <CardContent>
            <Stack direction={'row'} gap={2} alignItems={'center'}>
              <Typography sx={{ ...boldSx, color: index === 0 ? 'error.light' : 'success.light' }}
                          variant={'body1'}>{name}</Typography>
              <Tooltip title={<Breakdown breakdown={breakdown} notation={'MultiplierInfo'}/>}>
                <IconInfoCircleFilled size={18}/>
              </Tooltip>
            </Stack>
            <Typography sx={boldSx}>Max cycle time: <span
              style={{ fontWeight: 400 }}>{minutes}m:{seconds < 10 ? `0${seconds}` : seconds}s</span></Typography>
            <Typography sx={boldSx}>Cycles: <span
              style={{ fontWeight: 400 }}>{kFormatter(3600 / time, 2)}/hr</span></Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Stack direction={'row'} gap={2}>
      <CardTitleAndValue title={'More cycles'} stackProps>
        <FormControlLabel
          control={<Checkbox checked={includeSquireCycles}
                             onChange={(e) => setIncludeSquireCycles(e.target.checked)}/>}
          label="Include squires cycles"/>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Material cost'} stackProps>
        <FormControlLabel
          control={<Checkbox checked={showNextLevelCost}
                             onChange={(e) => setShowNextLevelCost(e.target.checked)}/>}
          label="Show next level cost"/>
      </CardTitleAndValue>
    </Stack>
    <Stack gap={3} direction={'row'} flexWrap={'wrap'}>
      {refinery?.salts?.map((salt, saltIndex) => {
        const { saltName, refined, powerCap, rawName, rank, active, cost, autoRefinePercentage } = salt;
        const progressPercentage = refined / powerCap * 100;
        const hasMaterialsForCycle = cost?.every(({
                                                    rawName,
                                                    quantity,
                                                    totalAmount
                                                  }) => totalAmount >= calcCost(state?.account?.refinery, rank, quantity, rawName, saltIndex));
        const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
        let fuelTime, combustionTime, saltPerHour, previousSaltPerHour, previousPowerPerCycle, gainValuePerHour,
          gainValuePerCycle;
        if (refineryCycles.length) {
          fuelTime = getFuelTime(rank, cost, saltIndex) * refineryCycles[Math.floor(saltIndex / 3)]?.time;
          combustionTime = refineryCycles[Math.floor(saltIndex / 3)]?.time;
          saltPerHour = powerPerCycle * 3600 / combustionTime;
          if (saltIndex !== 0) {
            const previousCombustionTime = refineryCycles[Math.floor((saltIndex - 1) / 3)]?.time;
            const previousRank = refinery?.salts?.[saltIndex - 1]?.rank;
            previousPowerPerCycle = previousRank ? Math.floor(Math.pow(previousRank, 1.3)) : null;
            previousSaltPerHour = previousPowerPerCycle ? previousPowerPerCycle * 3600 / previousCombustionTime : null;
          }
        }
        const {
          timeLeft,
          totalTime
        } = calcTimeToRankUp(state?.account, state?.characters, state?.lastUpdated, { squiresCycles }, includeSquireCycles, rank, powerCap, refined, saltIndex);
        return <Card key={`${saltName}-${saltIndex}`} sx={{ width: 'fit-content', pr: 3 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'flex-start'} gap={3} flexWrap={'wrap'}>
              <Stack alignItems={'center'} alignSelf={'center'}>
                <img src={`${prefix}data/${rawName}.png`} alt="salt-icon"/>
                Rank: {rank}
              </Stack>
              <Stack alignSelf={'center'} sx={{ width: { md: 250 } }} gap={.5}>
                <Typography variant={'h6'}>{cleanUnderscore(saltName)}</Typography>
                <Typography>Power: {numberWithCommas(refined)} / {numberWithCommas(powerCap)}</Typography>
                <Typography>Auto refine: {autoRefinePercentage}%</Typography>
                <Typography component={'span'}>Total time: <Timer staticTime date={totalTime}
                                                                  lastUpdated={state?.lastUpdated}/></Typography>
                <Typography component={'span'}>Rank up: {active ? <Timer
                    type={'countdown'}
                    lastUpdated={state?.lastUpdated}
                    pause={!active || !hasMaterialsForCycle}
                    component={'span'}
                    placeholder={<Typography
                      component={'span'}
                      color={hasMaterialsForCycle ? 'success.light' : 'error.light'}>{hasMaterialsForCycle
                      ? 'RANK UP'
                      : 'Missing Mats'}</Typography>}
                    date={timeLeft}/> :
                  <Typography component={'span'} color={'error'}>Inactive</Typography>}</Typography>
                <Typography component={'span'}>Fuel: {fuelTime ? <Timer type={'countdown'}
                                                                        date={new Date().getTime() + fuelTime * 1000}
                                                                        lastUpdated={state?.lastUpdated}
                /> : 'Empty'}</Typography>
                <ProgressBar percent={progressPercentage} bgColor={saltsColors?.[saltIndex]}/>
              </Stack>
              {isXs ? null : <Divider sx={{ mx: 2 }} orientation={'vertical'} flexItem/>}
              <Stack>
                <Stack direction={'row'} justifyContent={'center'} gap={5}>
                  <Typography sx={{ width: 60, textAlign: 'center' }} fontWeight={'bold'}>Cycle</Typography>
                  <Typography sx={{ width: 60, textAlign: 'center' }} fontWeight={'bold'}>Hour</Typography>
                  <Typography sx={{ width: 60, textAlign: 'center' }} fontWeight={'bold'}>Rankup</Typography>
                  <Typography sx={{ width: 60, textAlign: 'center' }} fontWeight={'bold'}>Owned</Typography>
                </Stack>
                <Stack flexWrap={'wrap'} direction={'row'} sx={{ width: 350 }} gap={1} alignItems={'center'}
                       justifyContent={'center'}>
                  {cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                    const cost = calcCost(state?.account?.refinery, rank, quantity, rawName, saltIndex);
                    const nextLevelCost = calcCost(state?.account?.refinery, rank + 1, quantity, rawName, saltIndex);
                    const nextLevelPerHour = nextLevelCost * 3600 / combustionTime;
                    const nextLevelRankUp = calcResourceToRankUp(rank + 1, refined, powerCap, nextLevelCost);
                    const costPerHour = cost * 3600 / combustionTime;
                    const costRankUp = calcResourceToRankUp(rank, refined, powerCap, cost);
                    const isSalt = rawName?.includes('Refinery');
                    const isCritter = rawName?.includes('Critter');
                    gainValuePerCycle = isCritter ? 0 : isSalt
                      ? previousPowerPerCycle
                      : (activePrints?.[rawName]?.boostedValue || 0);
                    gainValuePerHour = isCritter ? 0 : isSalt
                      ? previousSaltPerHour
                      : (activePrints?.[rawName]?.boostedValue || 0);
                    return <Box display="grid" gridTemplateColumns="repeat(4, 60px)" gap={5}
                                key={`${rawName}-${index}`}>
                      <Tooltip
                        title={<PrintingTooltip isCritter={isCritter} amount={gainValuePerCycle}/>}>
                        <ItemCell rawName={rawName}
                                  showNextLevelCost={showNextLevelCost}
                                  mainValue={cost}
                                  mainError={cost > totalAmount && gainValuePerHour < cost}
                                  secondaryValue={nextLevelCost}
                                  secondaryError={cost > totalAmount && gainValuePerHour < nextLevelCost}
                        />
                      </Tooltip>
                      <Tooltip
                        title={<PrintingTooltip isCritter={isCritter} amount={gainValuePerHour}/>}>
                        <ItemCell rawName={rawName}
                                  showNextLevelCost={showNextLevelCost}
                                  mainValue={costPerHour}
                                  mainError={(cost > totalAmount && gainValuePerHour < costPerHour) || isSalt && costPerHour > previousSaltPerHour}
                                  secondaryError={(cost > totalAmount && gainValuePerHour < nextLevelPerHour) || isSalt && nextLevelPerHour > previousSaltPerHour}
                                  secondaryValue={nextLevelPerHour}
                        />
                      </Tooltip>
                      <Tooltip
                        title={<PrintingTooltip isCritter={isCritter} amount={gainValuePerHour}/>}>
                        <ItemCell rankUp
                                  showNextLevelCost={showNextLevelCost}
                                  rawName={rawName}
                                  mainValue={costRankUp}
                                  mainError={cost > totalAmount}
                                  secondaryValue={nextLevelRankUp}
                                  secondaryError={nextLevelCost > totalAmount}
                        />
                      </Tooltip>
                      <ItemCell rawName={rawName} mainValue={totalAmount}/>
                    </Box>
                  })}
                </Stack>
              </Stack>
              {isXs ? null : <Divider sx={{ mx: 2 }} orientation={'vertical'} flexItem/>}
              <Stack>
                <Stack direction={'row'} justifyContent={'center'} gap={5}>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Cycle</Typography>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Hour</Typography>
                </Stack>
                <Stack direction={'row'} gap={5} alignItems={'center'}
                       justifyContent={'center'}>
                  <Stack sx={{ width: 50 }} alignSelf={'center'} alignItems={'center'}>
                    <img width={32} height={32} src={`${prefix}data/${rawName}.png`} alt=""/>
                    <Typography>{notateNumber(powerPerCycle)}</Typography>
                  </Stack>
                  <Stack sx={{ width: 50 }} alignSelf={'center'} alignItems={'center'}>
                    <img width={32} height={32} src={`${prefix}data/${rawName}.png`} alt=""/>
                    <Typography>{notateNumber(saltPerHour)}</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ItemCell = forwardRef((props, ref) => {
  const {
    rankUp,
    rawName,
    mainValue,
    secondaryValue,
    mainError,
    secondaryError,
    showNextLevelCost,
    ...rest
  } = props;
  return <Stack
    {...rest}
    ref={ref}
    direction={'row'}
    alignItems={'center'}>
    <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
    <Stack>
      <Typography
        fontSize={14}
        color={mainError ? 'error.light' : ''}>{notateNumber(mainValue)}</Typography>
      {showNextLevelCost && secondaryValue ? <Typography
        variant={'caption'}
        color={secondaryError ? 'error.light' : ''}>({notateNumber(secondaryValue)})</Typography> : null}
    </Stack>
  </Stack>
})
const PrintingTooltip = ({ isCritter, amount }) => {
  return <Stack>
    <Typography variant={'button'}>{isCritter ? 'Trapping' : 'Printing'}</Typography>
    <Typography>{amount ? notateNumber(amount) : 0}</Typography>
  </Stack>
}

const ItemIcon = styled.img`
  width: 32px;
`

const BreakdownTooltip = ({ breakdown, titleWidth = 120, notate = '' }) => {
  if (!breakdown) return '';
  return <Stack>
    {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                               titleStyle={{ width: titleWidth }}
                                                               title={name}
                                                               value={!isNaN(value)
                                                                 ? notateNumber(value, notate)
                                                                 : value}/>)}
  </Stack>
}

export default Refinery;
