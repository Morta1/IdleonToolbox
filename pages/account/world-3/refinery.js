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
import { cleanUnderscore, growth, kFormatter, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Timer from 'components/common/Timer';
import { getVialsBonusByEffect } from 'parsers/alchemy';
import { getPostOfficeBonus } from 'parsers/postoffice';
import ProgressBar from 'components/common/ProgressBar';
import { getStampsBonusByEffect } from '../../../parsers/stamps';
import { getHighestLevelOfClass } from '../../../parsers/misc';
import { getFamilyBonusBonus } from '../../../parsers/family';
import { classFamilyBonuses } from '../../../data/website-data';
import { getHighestTalentByClass } from '../../../parsers/talents';
import { NextSeo } from 'next-seo';
import { getShinyBonus } from '../../../parsers/breeding';
import { isRiftBonusUnlocked } from '../../../parsers/world-4/rift';
import { constructionMasteryThresholds } from '../../../parsers/construction';
import Tooltip from '../../../components/Tooltip';
import { calcTotals } from '../../../parsers/printer';
import { calcTotalCritters } from '../../../parsers/traps';
import Box from '@mui/material/Box';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import InfoIcon from '@mui/icons-material/Info';

const saltsColors = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4']
const boldSx = { fontWeight: 'bold' };

const Refinery = () => {
  const { state } = useContext(AppContext);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const {
    refinery,
    alchemy,
    saltLick,
    lab,
    stamps,
    charactersLevels,
    breeding,
    rift,
    towers
  } = state?.account;
  const vials = alchemy?.vials;
  const redMaltVial = getVialsBonusByEffect(vials, 'Refinery_Cycle_Speed');
  const saltLickUpgrade = saltLick?.[2] ? (saltLick?.[2]?.baseBonus * saltLick?.[2]?.level) : 0;
  const labCycleBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Gilded_Cyclical_Tubing')?.active ? 3 : 1;
  const sigilRefinerySpeed = alchemy?.p2w?.sigils?.find((sigil) => sigil?.name === 'PIPE_GAUGE')?.bonus || 0;
  const stampRefinerySpeed = getStampsBonusByEffect(stamps, 'Faster_refinery_cycles');
  const shinyRefineryBonus = getShinyBonus(breeding?.pets, 'Faster_Refinery_Speed');
  let constructionMastery = 0;
  const isConstructUnlocked = isRiftBonusUnlocked(rift, 'Construct_Mastery');
  if (isConstructUnlocked) {
    constructionMastery = towers?.totalLevels >= constructionMasteryThresholds?.[0]
      ? Math.floor(towers?.totalLevels / 10)
      : 0
  }
  const highestLevelDivineKnight = getHighestLevelOfClass(charactersLevels, 'Divine_Knight');
  const theFamilyGuy = getHighestTalentByClass(state?.characters, 3, 'Divine_Knight', 'THE_FAMILY_GUY')
  const familyRefinerySpeed = getFamilyBonusBonus(classFamilyBonuses, 'Refinery_Speed', highestLevelDivineKnight);
  const amplifiedFamilyBonus = (familyRefinerySpeed * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1) || 0)
  const additive = redMaltVial + saltLickUpgrade + amplifiedFamilyBonus + sigilRefinerySpeed + stampRefinerySpeed + shinyRefineryBonus + constructionMastery;
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresCycles, setSquiresCycles] = useState(0);
  const [showNextLevelCost, setShowNextLevelCost] = useState(false);
  const [squiresCooldown, setSquiresCooldown] = useState([]);
  const [refineryCycles, setRefineryCycles] = useState([]);
  const activePrints = useMemo(() => calcTotals(state?.account), [state?.account]);

  useEffect(() => {
    const squires = state?.characters?.filter((character) => character?.class === 'Squire' || character?.class === 'Divine_Knight');
    const squiresDataTemp = squires.reduce((res, character) => {
      const { name, talents, cooldowns, postOffice, afkTime } = character;
      const cooldownBonus = getPostOfficeBonus(postOffice, 'Magician_Starterpack', 2);
      const cdReduction = Math.max(0, cooldownBonus);
      const refineryThrottle = talents?.[2]?.orderedTalents.find((talent) => talent?.name === 'REFINERY_THROTTLE');
      let cyclesNum = 0;
      if (refineryThrottle?.maxLevel > 0) {
        cyclesNum = growth(refineryThrottle?.funcX, refineryThrottle?.maxLevel, refineryThrottle?.x1, refineryThrottle?.x2) || 0;
      }

      const timePassed = (new Date().getTime() - afkTime) / 1000;
      const calculatedCooldown = (1 - cdReduction / 100) * (cooldowns?.[130]);
      const actualCd = calculatedCooldown - timePassed;
      return {
        cycles: res?.cycles + cyclesNum,
        cooldowns: [...res?.cooldowns, {
          name,
          cooldown: actualCd < 0 ? actualCd : new Date().getTime() + (actualCd * 1000)
        }]
      };
    }, { cycles: 0, cooldowns: [] });
    setSquiresCycles(squiresDataTemp?.cycles);
    setSquiresCooldown(squiresDataTemp?.cooldowns);
    const timePassed = (new Date().getTime() - (state?.lastUpdated ?? 0)) / 1000;
    const breakdown = [
      { name: 'Vials', value: redMaltVial / 100 },
      { name: 'Salt lick', value: saltLickUpgrade / 100 },
      { name: 'Family', value: amplifiedFamilyBonus / 100 },
      { name: 'Sigils', value: sigilRefinerySpeed / 100 },
      { name: 'Stamps', value: stampRefinerySpeed / 100 },
      { name: 'Shinies', value: shinyRefineryBonus / 100 },
      { name: 'Const mastery', value: constructionMastery / 100 },
      { name: 'Lab', value: labCycleBonus },
    ];
    // const additive = redMaltVial + saltLickUpgrade + amplifiedFamilyBonus + sigilRefinerySpeed + stampRefinerySpeed + shinyRefineryBonus + constructionMastery;

    const combustion = {
      name: 'Combustion',
      time: Math.ceil((900 * Math.pow(4, 0)) / ((1 + additive / 100) * labCycleBonus)) - (refinery?.timePastCombustion % 1),
      timePast: refinery?.timePastCombustion + timePassed,
      breakdown: [{ name: 'Base', value: 900 * Math.pow(4, 0) }, ...breakdown]
    };
    const synthesis = {
      name: 'Synthesis',
      time: Math.ceil((900 * Math.pow(4, 1)) / ((1 + additive / 100) * labCycleBonus)) - (refinery?.timePastSynthesis % 1),
      timePast: refinery?.timePastSynthesis + timePassed,
      breakdown: [{ name: 'Base', value: 900 * Math.pow(4, 1) }, ...breakdown]
    }
    setRefineryCycles([combustion, synthesis]);
  }, [state?.lastUpdated]);

  const calcCost = (rank, quantity, item, index) => {
    const isSalt = item?.includes('Refinery');
    return Math.floor(Math.pow(rank, (isSalt && index <= refinery?.refinerySaltTaskLevel) ? 1.3 : 1.5)) * quantity;
  };

  const calcResourceToRankUp = (rank, refined, powerCap, itemCost) => {
    const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
    const remainingProgress = powerCap - refined;
    return (remainingProgress / powerPerCycle) * itemCost;
  }


  const calcTimeToRankUp = (rank, powerCap, refined, index) => {
    // Cycles per day = (24 * 60 * 60 / ((900 || 3600) / (1 + VIAL + saltLicks[2]))) + SQUIRE PER
    const powerPerCycle = Math.floor(Math.pow(rank, 1.3));
    const cycleByType = index <= 2 ? 900 : 3600;
    const combustionCyclesPerDay = (24 * 60 * 60 / (cycleByType / (1 + (additive) / 100))) + (includeSquireCycles
      ? (squiresCycles ?? 0)
      : 0);
    const timeLeft = ((powerCap - refined) / powerPerCycle) / combustionCyclesPerDay * 24 / (labCycleBonus);
    return new Date().getTime() + (timeLeft * 3600 * 1000);
  };

  const getFuelTime = (rank, costs, saltIndex) => {
    const timeArray = [];
    costs.forEach((cost) => {
      const baseCost = calcCost(rank, cost?.quantity, cost?.rawName, saltIndex);
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
    <Typography variant={'h2'} mb={3}>Refinery</Typography>
    <Stack my={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {squiresCooldown?.map(({ name, cooldown, talentId }, index) => {
        return <Card className={'squire'} key={name + ' ' + index} sx={{ width: 232 }}>
          <CardContent sx={{ padding: 4 }}>
            <Stack alignItems={'center'}>
              <img src={`${prefix}data/UISkillIcon130.png`} alt=""/>
              <Typography sx={boldSx}>{name}</Typography>
              <Timer placeholder={<Typography component={'span'}
                                              sx={{ color: 'success.main', fontWeight: 'bold' }}>Ready</Typography>}
                     type={'countdown'} date={cooldown} lastUpdated={state?.lastUpdated}/>
            </Stack>
          </CardContent>
        </Card>
      })}
      {refineryCycles?.map((cycle, index) => {
        const { name, time, timePast, breakdown } = cycle;
        const minutes = Math.floor((time) / 60);
        const seconds = Math.floor(time % 60);
        return <Card key={`${name}-${index}`} sx={{ width: 232 }}>
          <CardContent>
            <Stack direction={'row'} gap={2} alignItems={'center'}>
              <Typography sx={{ ...boldSx, color: index === 0 ? 'error.light' : 'success.light' }} mb={1}
                          variant={'h5'}>{name}</Typography>
              <Tooltip title={<BreakdownTooltip breakdown={breakdown} notate={'MultiplierInfo'}/>}>
                <InfoIcon/>
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
    <Stack my={2} direction={'row'} gap={2}>
      <CardTitleAndValue title={'More cycles'}>
        <FormControlLabel
          control={<Checkbox checked={includeSquireCycles}
                             onChange={(e) => setIncludeSquireCycles(e.target.checked)}/>}
          label="Include squires cycles"/>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Material cost'}>
        <FormControlLabel
          control={<Checkbox checked={showNextLevelCost}
                             onChange={(e) => setShowNextLevelCost(e.target.checked)}/>}
          label="Show next level cost"/>
      </CardTitleAndValue>
    </Stack>
    <Stack gap={3} justifyContent={'center'}>
      {refinery?.salts?.map((salt, saltIndex) => {
        const { saltName, refined, powerCap, rawName, rank, active, cost, autoRefinePercentage } = salt;
        const progressPercentage = refined / powerCap * 100;
        const hasMaterialsForCycle = cost?.every(({
                                                    rawName,
                                                    quantity,
                                                    totalAmount
                                                  }) => totalAmount >= calcCost(rank, quantity, rawName, saltIndex));
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
        return <Card key={`${saltName}-${saltIndex}`} sx={{ width: 'fit-content', pr: 3 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'flex-start'} gap={3} flexWrap={'wrap'}>
              <Stack alignItems={'center'} alignSelf={'center'}>
                <img src={`${prefix}data/${rawName}.png`} alt=""/>
                Rank: {rank}
              </Stack>
              <Stack alignSelf={'center'} sx={{ width: { md: 200 } }} gap={.5}>
                <Typography variant={'h6'}>{cleanUnderscore(saltName)}</Typography>
                <Typography>Power: {numberWithCommas(refined)} / {numberWithCommas(powerCap)}</Typography>
                <Typography>Auto refine: {autoRefinePercentage}%</Typography>
                <Typography component={'span'}>Rank up: {active ? <Timer
                    type={'countdown'}
                    lastUpdated={state?.lastUpdated}
                    pause={!active || !hasMaterialsForCycle}
                    placeholder={<Typography
                      component={'span'}
                      color={hasMaterialsForCycle ? 'success.light' : 'error.light'}>{hasMaterialsForCycle
                      ? 'RANK UP'
                      : 'Missing Mats'}</Typography>}
                    date={calcTimeToRankUp(rank, powerCap, refined, saltIndex)}/> :
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
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Cycle</Typography>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Hour</Typography>
                  <Typography sx={{ width: 50, textAlign: 'center' }} fontWeight={'bold'}>Rankup</Typography>
                </Stack>
                <Stack flexWrap={'wrap'} direction={'row'} sx={{ width: 250 }} gap={1} alignItems={'center'}
                       justifyContent={'center'}>
                  {cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                    const cost = calcCost(rank, quantity, rawName, saltIndex);
                    const nextLevelCost = calcCost(rank + 1, quantity, rawName, saltIndex);
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
                    return <Box display="grid" gridTemplateColumns="repeat(3, 60px)" gap={5}
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
