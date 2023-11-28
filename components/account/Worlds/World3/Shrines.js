import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, numberWithCommas } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import { IconWithText } from 'components/common/styles';
import ProgressBar from 'components/common/ProgressBar';
import { mapNames } from '../../../../data/website-data';
import Timer from '../../../common/Timer';

const Shrines = ({ shrines, shrinesExpBonus }) => {
  return (
    <Stack sx={{ height: 'fit-content' }} justifyContent={'center'} direction={'row'} flexWrap={'wrap'} gap={2}>
      {shrines?.map((shrine, index) => {
        const { name, rawName, shrineLevel, desc, bonus } = shrine;
        const affectingCharacters = shrinesExpBonus?.breakdown?.[index]?.reduce((res, { name, value }) => value > 0
          ? [...res, name]
          : res, []);
        const progressPerHour = shrinesExpBonus?.total?.[index];
        const description = cleanUnderscore(desc?.replace('{', kFormatter(bonus, 2)));
        return <HtmlTooltip
          title={<ShrineTooltip {...shrine} affectingCharacters={affectingCharacters} progressPerHour={progressPerHour}
                                description={description}/>} key={name + index}>
          <IconWithText stat={shrineLevel} icon={rawName} img={{ style: { width: 50, height: 50 } }}/>
        </HtmlTooltip>
      })}
    </Stack>
  );
};

const ShrineTooltip = ({ name, description, shrineLevel, progress, mapId, affectingCharacters, progressPerHour }) => {
  const hoursReq = Math.floor(20 * (shrineLevel - 1) + 6 * shrineLevel * Math.pow(1.63, shrineLevel - 1));
  const timeLeft = (hoursReq - progress) / progressPerHour * 1000 * 3600;
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(name)} Lv.{shrineLevel}</Typography>
    <Typography variant={'body1'}>{description}</Typography>
    <Typography fontWeight={'bold'} variant={'body1'}>Map: {cleanUnderscore(mapNames[mapId])}</Typography>
    <Typography fontWeight={'bold'}>Progress:</Typography>
    <ProgressBar percent={progress / hoursReq * 100} label={false}/>
    <Typography
      variant={'body1'}>{numberWithCommas(parseInt(progress))} / {numberWithCommas(parseInt(hoursReq))}</Typography>
    <Typography sx={{ fontWeight: 'bold' }} mt={1}>Affected by:</Typography>
    <Typography variant={'body1'}>{affectingCharacters.join(', ')}</Typography>
    <Typography sx={{ fontWeight: 'bold' }} mt={1}>{progressPerHour.toFixed(2)}/hr</Typography>
    <Timer date={new Date().getTime() + timeLeft} staticTime={true}/>
  </>
}

export default Shrines;
