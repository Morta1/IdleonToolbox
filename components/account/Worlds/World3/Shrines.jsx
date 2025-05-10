import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, numberWithCommas } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import { IconWithText } from '@components/common/styles';
import ProgressBar from 'components/common/ProgressBar';
import { mapNames } from '../../../../data/website-data';
import Timer from '../../../common/Timer';

const Shrines = ({ shrines, shrinesExpBonus }) => {
  return (
    <Stack sx={{ height: 'fit-content' }} justifyContent={'center'} direction={'row'} flexWrap={'wrap'} gap={2}>
      {shrines?.map((shrine, index) => {
        const { name, rawName, shrineLevel, desc, bonus, progress } = shrine;
        const affectingCharacters = shrinesExpBonus?.breakdown?.[index]?.reduce((res, { name, value }) => value > 0
          ? [...res, name]
          : res, []);
        const progressPerHour = shrinesExpBonus?.total?.[index];
        const description = cleanUnderscore(desc?.replace('{', kFormatter(bonus, 2)));
        const hoursReq = Math.floor(20 * (shrineLevel - 1) + 6 * shrineLevel * Math.pow(1.63, shrineLevel - 1));
        const timeLeft = (hoursReq - progress) / progressPerHour * 1000 * 3600;
        return <Stack key={name + index}>
          <HtmlTooltip
            title={<ShrineTooltip {...shrine}
                                  affectingCharacters={affectingCharacters}
                                  progressPerHour={progressPerHour}
                                  hoursReq={hoursReq}
                                  timeLeft={timeLeft}
                                  description={description}/>}>
            <IconWithText stat={shrineLevel} icon={rawName} img={{ style: { width: 50, height: 50 } }}/>
          </HtmlTooltip>
          <ProgressBar percent={progress / hoursReq * 100} label={false}/>
        </Stack>
      })}
    </Stack>
  );
};

const ShrineTooltip = ({
                         name,
                         description,
                         shrineLevel,
                         progress,
                         mapId,
                         affectingCharacters,
                         progressPerHour,
                         hoursReq,
                         timeLeft,
                         crystalShrineBonus
                       }) => {
  return <>
    <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(name)} Lv.{shrineLevel}</Typography>
    <Typography variant={'body1'}>{description}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography fontWeight={'bold'} variant={'body1'}>Map: {cleanUnderscore(mapNames[mapId])}</Typography>
    <ProgressBar percent={progress / hoursReq * 100}/>
    <Typography
      variant={'body1'}>{numberWithCommas(parseInt(progress))} / {numberWithCommas(parseInt(hoursReq))}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography sx={{ fontWeight: 'bold' }} mt={1}>Exp contribution:</Typography>
    <Typography mt={1} variant={'body2'} sx={{ fontWeight: 'bold' }}>Characters:</Typography>
    <Typography variant={'body1'}>{affectingCharacters?.join(', ')}</Typography>
    {crystalShrineBonus > 0 ? <>
      <Typography mt={1} variant={'body2'} sx={{ fontWeight: 'bold' }}>Shrines:</Typography>
      <Typography variant={'body1'}>Crystal shrine ({crystalShrineBonus}%)</Typography>
    </> : null}
    <Divider sx={{ my: 1 }}/>
    <Typography sx={{ fontWeight: 'bold' }} mt={1}>Progress: {progressPerHour.toFixed(2)}/hr</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography variant={'inherit'} mt={1}>{convertMsToHHMM(timeLeft)}</Typography>
    <Timer date={new Date().getTime() + timeLeft} staticTime={true}/>
  </>
}

const convertMsToHHMM = (ms) => {
  let hours = Math.floor(ms / 3600000); // 1 Hour = 3600000 ms
  let minutes = Math.floor((ms % 3600000) / 60000); // 1 Minute = 60000 ms

  // Ensure that the values have two digits by adding a leading zero if necessary
  hours = hours.toString().padStart(2, '0');
  minutes = minutes.toString().padStart(2, '0');

  return `${hours}h:${minutes}m`;
}
export default Shrines;
