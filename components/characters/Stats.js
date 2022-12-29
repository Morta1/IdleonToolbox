import InfoIcon from "@mui/icons-material/Info";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { differenceInHours, differenceInMinutes } from "date-fns";
import { kFormatter, pascalCase } from "utility/helpers";
import Timer from "../common/Timer";
import Tooltip from "../Tooltip";
import Activity from "./Activity";
import { isArtifactAcquired } from "../../parsers/sailing";
import { TitleAndValue } from "../common/styles";

const colors = {
  strength: "error.light",
  agility: "success.light",
  wisdom: "secondary",
  luck: "warning.light"
};
const Stats = ({ activityFilter, statsFilter, character, lastUpdated, account }) => {
  const { name, playerId, stats, afkTime, crystalSpawnChance, nextPortal, afkTarget, nonConsumeChance } = character;

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
        {activityFilter ? <Activity afkTarget={afkTarget} divStyle={character?.divStyle} playerId={playerId} account={account}/> : null}
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
            const socrates = isArtifactAcquired(account?.sailing?.artifacts, 'Socrates');
            const enhancedStat = socrates ? statValue * (1 + socrates?.bonus / 100) : statValue;
            return statName !== "level" ? (
              <Card variant={"outlined"} key={`${name}-${statName}-${index}`}>
                <CardContent>
                  <Typography sx={{ width: 80, display: "inline-block" }} variant={"body1"}
                              color={colors?.[statName] || "info.light"}>
                    {pascalCase(statName)}
                  </Typography>
                  <Typography variant={"body1"} component={"span"}>
                    {" "}
                    {Math.floor(enhancedStat)}
                  </Typography>
                </CardContent>
              </Card>
            ) : null;
          })}
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
                <Tooltip title={<CrystalChanceTooltip breakdown={crystalSpawnChance?.breakdown}/>}>
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

const CrystalChanceTooltip = ({ breakdown }) => {
  return <Stack>
    {Object.entries(breakdown)?.map(([name, value]) => <TitleAndValue key={`${name}-${value}`} boldTitle title={name}
                                                                      value={value}/>)}
  </Stack>
}

export default Stats;
