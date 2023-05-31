import InfoIcon from "@mui/icons-material/Info";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { kFormatter, notateNumber, pascalCase, prefix } from "utility/helpers";
import Timer from "../common/Timer";
import Tooltip from "../Tooltip";
import Activity from "./Activity";
import { TitleAndValue } from "../common/styles";
import { getAfkGain, getCashMulti, getDropRate, getRespawnRate } from "../../parsers/character";
import React, { useMemo } from "react";
import { getMaxDamage, notateDamage } from "../../parsers/damage";
import processString from "react-process-string";
import styled from "@emotion/styled";

const colors = {
  strength: "error.light",
  agility: "success.light",
  wisdom: "secondary",
  luck: "warning.light"
};

const Stats = ({ activityFilter, statsFilter, character, lastUpdated, account, characters }) => {
  const { name, playerId, stats, afkTime, crystalSpawnChance, nextPortal, afkTarget, nonConsumeChance } = character;
  const { cashMulti, breakdown } = useMemo(() => getCashMulti(character, account, characters) || {},
    [character, account]);
  const { dropRate, breakdown: drBreakdown } = useMemo(() => getDropRate(character, account, characters) || {},
    [character, account]);
  const { respawnRate, breakdown: rtBreakdown } = useMemo(() => getRespawnRate(character, account) || {},
    [character, account]);
  const { afkGains, breakdown: agBreakdown } = useMemo(() => getAfkGain(character, characters, account), [character,
    account]);
  const playerInfo = useMemo(() => getMaxDamage(character, characters, account), [character, account]);

  const isOvertime = () => {
    const hasUnendingEnergy = character?.activePrayers?.find(({ name }) => name === "Unending_Energy");
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const hours = differenceInHours(new Date(), new Date(timePassed));
    return hasUnendingEnergy && hours > 10;
  };

  const isAfk = () => {
    const timePassed = new Date().getTime() + (afkTime - lastUpdated);
    const minutes = differenceInMinutes(new Date(), new Date(timePassed));
    return minutes <= 5;
  };

  return (
    <>
      <Stack gap={2} flexWrap={"wrap"}>
        {activityFilter ?
          <Activity afkTarget={afkTarget} divStyle={character?.divStyle} playerId={playerId} account={account}/> : null}
        {statsFilter ? <>
          {nextPortal?.goal > 10 && nextPortal?.current < nextPortal?.goal ? (
            <Card variant={"outlined"}>
              <CardContent>
                <Typography color={"info.light"}>Next Portal</Typography>
                <Typography>{`${kFormatter(nextPortal?.current)} / ${kFormatter(nextPortal?.goal)}`}</Typography>
              </CardContent>
            </Card>
          ) : null}
          {Object.entries(stats)?.map(([statName, statValue], index) => {
            return statName !== "level" ? (
              <Card variant={"outlined"} key={`${name}-${statName}-${index}`}>
                <CardContent>
                  <Typography sx={{ width: 80, display: "inline-block" }} variant={"body1"}
                              color={colors?.[statName] || "info.light"}>
                    {pascalCase(statName)}
                  </Typography>
                  <Typography variant={"body1"} component={"span"}>
                    {" "}
                    {Math.floor(statValue)}
                  </Typography>
                </CardContent>
              </Card>
            ) : null;
          })}
          <Stack direction={'row'} flexWrap={'wrap'}>
            <Stat title={'Hp'} value={notateNumber(playerInfo?.maxHp)}/>
            <Stat title={'Mp'} value={notateNumber(playerInfo?.maxMp)}/>
            <Stat title={'Accuracy'} value={notateNumber(playerInfo?.accuracy)}/>
            <Stat title={'M. Speed'} value={notateNumber(playerInfo?.movementSpeed)}/>
          </Stack>
          <Stat title={'Damage'} damage value={notateDamage(playerInfo)}/>
          <Stat title={'Cash Multi'} value={`${kFormatter(cashMulti, 2)}%`}
                breakdown={breakdown} breakdownNotation={'Smaller'}/>
          <Stat title={'Drop Rate'} value={`${notateNumber(dropRate, 'MultiplierInfo')}x`}
                breakdown={drBreakdown} breakdownNotation={'Smaller'}/>
          <Stat title={'Respawn Time'}
                value={`${notateNumber(respawnRate, 'MultiplierInfo')}%`}
                breakdown={rtBreakdown} breakdownNotation={'Smaller'}/>
          <Stat title={'Afk Gains'}
                value={`${notateNumber(afkGains * 100, 'MultiplierInfo')}%`}
                breakdown={agBreakdown} breakdownNotation={'Smaller'}/>
          <Stat title={'Chance not to consume food'}
                value={`${kFormatter(nonConsumeChance, 2)}%`}
          />
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Crystal Chance</Typography>
              <Stack direction={'row'} gap={1}>
                <Typography>1 in {Math.floor(1 / crystalSpawnChance?.value)}</Typography>
                <Tooltip title={<BreakdownTooltip titleWidth={180} breakdown={crystalSpawnChance?.breakdown}/>}>
                  <InfoIcon/>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Afk time</Typography>
              <Stack direction={"row"} alignItems={"center"} gap={1} color={isOvertime() ? "error.light" : ""}>
                {!isAfk() ? <Timer type={'up'} date={afkTime} lastUpdated={lastUpdated}/> :
                  <Typography color={"success.light"}>Active</Typography>}
                {isOvertime() ? (
                  <Tooltip title={"This character is afk more than 10 hours with Unending Energy prayer"}>
                    <InfoIcon/>
                  </Tooltip>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </> : null}
      </Stack>
    </>
  );
};

const Stat = ({ title, value, breakdown = '', breakdownNotation = 'Smaller', damage }) => {
  return <Card variant={"outlined"}>
    <CardContent>
      <Typography color={"info.light"}>{title}</Typography>
      <Tooltip title={breakdown ? <BreakdownTooltip breakdown={breakdown}
                                                    notate={breakdownNotation}/> : ''}>
        {!damage ? <Typography>{value}</Typography> : <Typography color={'#fffcc9'}>
          {processString([{
            regex: /\[/g,
            fn: (key) => {
              return <DamageIcon key={key} src={`${prefix}etc/Damage_M.png`} alt="" />
            }
          }])(value)}
        </Typography>}
      </Tooltip>
    </CardContent>
  </Card>
}

const BreakdownTooltip = ({ breakdown, titleWidth = 120, notate = '' }) => {
  if (!breakdown) return '';
  return <Stack>
    {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                               titleStyle={{ width: titleWidth }}
                                                               title={name}
                                                               value={!isNaN(value) ? notateNumber(value, notate) : value}/>)}
  </Stack>
}

const DamageIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`

export default Stats;
