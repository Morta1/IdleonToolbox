import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { cleanUnderscore, growth, kFormatter, numberWithCommas, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Timer from "components/common/Timer";
import { getVialsBonusByEffect } from "parsers/alchemy";
import { getPostOfficeBonus } from "parsers/postoffice";
import ProgressBar from "components/common/ProgressBar";
import { getStampsBonusByEffect } from "../../../parsers/stamps";
import { getHighestLevelOfClass } from "../../../parsers/misc";
import { getFamilyBonusBonus } from "../../../parsers/family";
import { classFamilyBonuses } from "../../../data/website-data";
import { getHighestTalentByClass } from "../../../parsers/talents";

const saltsColors = ['#EF476F', '#ff8d00', '#00dcff', '#cdff68', '#d822cb', '#9a9ca4']
const boldSx = { fontWeight: 'bold' };

const Refinery = () => {
  const { state } = useContext(AppContext);
  const { refinery, alchemy, saltLick, lab, stamps, charactersLevels } = state?.account;
  const vials = alchemy?.vials;
  const redMaltVial = getVialsBonusByEffect(vials, 'Refinery_Cycle_Speed');
  const saltLickUpgrade = saltLick?.[2] ? (saltLick?.[2]?.baseBonus * saltLick?.[2]?.level) : 0;
  const labCycleBonus = lab?.labBonuses?.find((bonus) => bonus.name === 'Gilded_Cyclical_Tubing')?.active ? 3 : 1;
  const sigilRefinerySpeed = alchemy?.p2w?.sigils?.find((sigil) => sigil?.name === 'PIPE_GAUGE')?.bonus || 0;
  const stampRefinerySpeed = getStampsBonusByEffect(stamps, 'faster_refinery');
  const [includeSquireCycles, setIncludeSquireCycles] = useState(false);
  const [squiresCycles, setSquiresCycles] = useState(0);
  const [squiresCooldown, setSquiresCooldown] = useState([]);
  const [refineryCycles, setRefineryCycles] = useState([]);

  useEffect(() => {
    const highestLevelDivineKnight = getHighestLevelOfClass(charactersLevels, 'Divine_Knight');
    const theFamilyGuy = getHighestTalentByClass(state?.characters, 3, 'Divine_Knight', 'THE_FAMILY_GUY')
    const familyRefinerySpeed = getFamilyBonusBonus(classFamilyBonuses, 'Refinery_Speed', highestLevelDivineKnight);
    const amplifiedFamilyBonus = familyRefinerySpeed * (theFamilyGuy > 0 ? (1 + theFamilyGuy / 100) : 1)
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

      // 72000 (s) - cooldowns?.[refineryThrottle?.talentId] (s) - timePassed
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

    const combustion = {
      name: "Combustion",
      time: Math.ceil((900 * Math.pow(4, 0)) / ((1 + (redMaltVial + saltLickUpgrade + amplifiedFamilyBonus + sigilRefinerySpeed + stampRefinerySpeed) / 100) * labCycleBonus)),
      timePast: refinery?.timePastCombustion + timePassed
    };
    const synthesis = {
      name: "Synthesis",
      time: Math.ceil((900 * Math.pow(4, 1)) / ((1 + (redMaltVial + saltLickUpgrade + amplifiedFamilyBonus + sigilRefinerySpeed + stampRefinerySpeed) / 100) * labCycleBonus)),
      timePast: refinery?.timePastSynthesis + timePassed
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
    const combustionCyclesPerDay = (24 * 60 * 60 / (cycleByType / (1 + (redMaltVial + saltLickUpgrade) / 100))) + (includeSquireCycles ? (squiresCycles ?? 0) : 0);
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
    <Typography variant={'h2'} mb={3}>Refinery</Typography>
    <Stack my={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {squiresCooldown?.map(({ name, cooldown, talentId }, index) => {
        return <Card className={'squire'} key={name + ' ' + index} sx={{ width: 232 }}>
          <CardContent sx={{ padding: 4 }}>
            <Stack alignItems={'center'}>
              <img src={`${prefix}data/UISkillIcon130.png`} alt=""/>
              <Typography sx={boldSx}>{name}</Typography>
              <Timer placeholder={<Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>Ready</Typography>}
                     type={'countdown'} date={cooldown} lastUpdated={state?.lastUpdated}/>
            </Stack>
          </CardContent>
        </Card>
      })}
      {refineryCycles?.map((cycle, index) => {
        const { name, time, timePast } = cycle;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const nextCycle = new Date().getTime() + ((time - timePast) * 1000)
        const startDate = new Date().getTime() + (time * 1000);
        return <Card key={`${name}-${index}`} sx={{ width: 232 }}>
          <CardContent>
            <Typography sx={{ ...boldSx, color: index === 0 ? 'error.light' : 'success.light' }} mb={1}
                        variant={'h5'}>{name}</Typography>
            <Typography sx={boldSx} component={'span'}>Next Cycle In: </Typography>
            <Timer type={'countdown'} loop={true} startDate={startDate} date={nextCycle}
                   lastUpdated={state?.lastUpdated}/>
            <Typography sx={boldSx}>Max cycle time: <span
              style={{ fontWeight: 400 }}>{minutes}m:{seconds < 10 ? `0${seconds}` : seconds}s</span></Typography>
            <Typography sx={boldSx}>Cycles: <span
              style={{ fontWeight: 400 }}>{kFormatter(3600 / time, 2)}/hr</span></Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Stack my={2} direction={'row'}>
      <Card sx={{ width: 'fit-content' }}>
        <CardContent>
          <FormControlLabel
            control={<Checkbox checked={includeSquireCycles}
                               onChange={(e) => setIncludeSquireCycles(e.target.checked)}/>}
            label="Include Squires Cycles"/>
        </CardContent>
      </Card>
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
        let fuelTime;
        if (refineryCycles.length) {
          fuelTime = getFuelTime(rank, cost, saltIndex) * refineryCycles[Math.floor(saltIndex / 3)]?.time;
        }
        return <Card key={`${saltName}-${saltIndex}`} sx={{ width: 'fit-content' }}>
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
                <Typography>Rank up: {active ? <Timer
                    type={'countdown'}
                    lastUpdated={state?.lastUpdated}
                    pause={!active || !hasMaterialsForCycle}
                    placeholder={<Typography
                      component={'span'}
                      color={hasMaterialsForCycle ? 'success.light' : 'error.light'}>{hasMaterialsForCycle ? 'RANK UP' : 'Missing Mats'}</Typography>}
                    date={calcTimeToRankUp(rank, powerCap, refined, saltIndex)}/> :
                  <Typography component={'span'} color={'error'}>Inactive</Typography>}</Typography>
                <Typography>Fuel: {fuelTime ? <Timer type={'countdown'}
                                                     date={new Date().getTime() + fuelTime * 1000}
                                                     lastUpdated={state?.lastUpdated}
                /> : 'Empty'}</Typography>
                <ProgressBar percent={progressPercentage} bgColor={saltsColors?.[saltIndex]}/>
              </Stack>
              <Stack>
                <Typography fontWeight={'bold'}>Per cycle</Typography>
                <Stack flexWrap={'wrap'} direction={'row'} sx={{ width: { md: 140 } }} gap={1}>
                  {cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                    const cost = calcCost(rank, quantity, rawName, saltIndex);
                    return <Stack alignItems={'center'} key={`${rawName}-${index}`}>
                      <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                      <Typography color={cost > totalAmount ? 'error.light' : ''}>{cost}</Typography>
                    </Stack>
                  })}
                </Stack>
              </Stack>
              <Stack>
                <Typography fontWeight={'bold'}>Rank up</Typography>
                <Stack flexWrap={'wrap'} direction={'row'} width={160} gap={1}>
                  {cost?.map(({ name, rawName, quantity, totalAmount }, index) => {
                    let cost = calcCost(rank, quantity, rawName, saltIndex);
                    cost = calcResourceToRankUp(rank, refined, powerCap, cost);
                    return <Stack alignItems={'center'} key={`${rawName}-${index}`}>
                      <ItemIcon src={`${prefix}data/${rawName}.png`} alt=""/>
                      <Typography>{kFormatter(cost)}</Typography>
                      <Typography color={cost > totalAmount ? 'error.light' : ''}
                                  variant={'caption'}>({kFormatter(totalAmount)})</Typography>
                    </Stack>
                  })}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const ItemIcon = styled.img`
  width: 32px;
`

export default Refinery;
