import InfoIcon from "@mui/icons-material/Info";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { kFormatter, notateNumber, pascalCase } from "utility/helpers";
import Timer from "../common/Timer";
import Tooltip from "../Tooltip";
import Activity from "./Activity";
import { TitleAndValue } from "../common/styles";
import { getAfkGain, getCashMulti, getDropRate, getRespawnRate } from "../../parsers/character";
import { useMemo } from "react";

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
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Cash Multi</Typography>
              <Tooltip title={<BreakdownTooltip breakdown={breakdown} notate={'Smaller'}/>}>
                <Typography>{notateNumber(cashMulti)}%</Typography>
              </Tooltip>
            </CardContent>
          </Card>
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Drop Rate</Typography>
              <Tooltip title={<BreakdownTooltip breakdown={drBreakdown} notate={'Smaller'}/>}>
                <Typography>{notateNumber(dropRate, 'MultiplierInfo')}x</Typography>
              </Tooltip>
            </CardContent>
          </Card>
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Respawn Time</Typography>
              <Tooltip title={<BreakdownTooltip breakdown={rtBreakdown} notate={'Smaller'}/>}>
                <Typography>{notateNumber(respawnRate, 'MultiplierInfo')}%</Typography>
              </Tooltip>
            </CardContent>
          </Card>
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Afk Gains</Typography>
              <Tooltip title={<BreakdownTooltip breakdown={agBreakdown} notate={'Smaller'}/>}>
                <Typography>{notateNumber(afkGains * 100, 'MultiplierInfo')}%</Typography>
              </Tooltip>
            </CardContent>
          </Card>
          <Card variant={"outlined"}>
            <CardContent>
              <Typography color={"info.light"}>Chance not to consume food</Typography>
              <Typography>{kFormatter(nonConsumeChance, 2)}%</Typography>
            </CardContent>
          </Card>
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

const BreakdownTooltip = ({ breakdown, titleWidth = 120, notate = '' }) => {
  if (!breakdown) return '';
  return <Stack>
    {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                               titleStyle={{ width: titleWidth }}
                                                               title={name}
                                                               value={!isNaN(value) ? notateNumber(value, notate) : value}/>)}
  </Stack>
}

export default Stats;
