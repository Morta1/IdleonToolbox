import { Stack, Typography } from "@mui/material";
import { cleanUnderscore, kFormatter, numberWithCommas } from "utility/helpers";
import HtmlTooltip from "components/Tooltip";
import { IconWithText } from "components/common/styles";
import ProgressBar from "components/common/ProgressBar";

const Shrines = ({ shrines }) => {
  return (
    <Stack justifyContent={'center'} direction={'row'} flexWrap={'wrap'} gap={2}>
      {shrines?.map((shrine, index) => {
        const { name, rawName, shrineLevel, desc, bonus } = shrine;
        const description = cleanUnderscore(desc?.replace('{', kFormatter(bonus, 2)));
        return <HtmlTooltip title={<ShrineTooltip {...shrine} description={description}/>} key={name + index}>
          <IconWithText stat={shrineLevel} icon={rawName}/>
        </HtmlTooltip>
      })}
    </Stack>
  );
};

const ShrineTooltip = ({ name, description, shrineLevel, progress }) => {
  const hoursReq = Math.floor(20 * (shrineLevel - 1) + 6 * shrineLevel * Math.pow(1.63, shrineLevel - 1));
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(name)} Lv.{shrineLevel}</Typography>
    <Typography variant={'body1'}>{description}</Typography>
    <Typography fontWeight={'bold'}>Progress:</Typography>
    <ProgressBar percent={progress / hoursReq * 100} label={false}/>
    <Typography
      variant={'body1'}>{numberWithCommas(parseInt(progress))} / {numberWithCommas(parseInt(hoursReq))}</Typography>
  </>
}

export default Shrines;
