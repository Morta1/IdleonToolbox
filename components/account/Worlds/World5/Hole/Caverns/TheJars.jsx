import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, msToDate, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const TheJars = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theJars?.rupies?.map((amount, index) => <CardTitleAndValue
        title={''} key={`rupie-${index}`} stackProps icon={`data/HoleJarR${index}.png`}
        value={amount}/>)}
    </Stack>
    <Divider sx={{ mt: 1 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Progress per hour'}
                         value={notateNumber(hole?.caverns?.theJars?.perHour, 'Big')}/>
      <CardTitleAndValue title={'Progress per minute'}
                         value={notateNumber(hole?.caverns?.theJars?.perHour / 60, 'Big')}/>
      <CardTitleAndValue title={'Rupie value'}
                         value={notateNumber(hole?.caverns?.theJars?.rupieValue, 'Big')}/>
      <Divider orientation={'vertical'} sx={{ my: 2 }} flexItem/>
      {hole?.caverns?.theJars?.activeSlots?.map(({ progress, req, jarType }, index) => <CardTitleAndValue
        title={'Rupie value'} key={`slots-${index}`}
        icon={`etc/Jar_${jarType}.png`}
        imgStyle={{ width: 26, height: 26 }}
        value={`${numberWithCommas(Math.floor(progress))} / ${numberWithCommas(Math.floor(req))}`}/>)}
    </Stack>
    <Divider sx={{ mb: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theJars?.jars?.map(({ name, unlocked, req, effect, perHour }, index) => {
        return <Card key={`jar-${index}`}>
          <CardContent sx={{
            width: 350,
            minHeight: 215,
            opacity: unlocked ? 1 : .5
          }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <img style={{ width: 26, height: 26, objectFit: 'contain' }} src={`${prefix}etc/Jar_${index}.png`}
                   alt={`jar-${index}`}/>
              <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Typography sx={{ height: 41, display: 'flex', alignItems: 'center' }}
                        variant={'body1'}>{effect}</Typography>
            <Divider sx={{ mt: .5, mb: 1 }}/>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Typography variant={'body1'}>Jars per
                hour: {Math.floor(hole?.caverns?.theJars?.perHour / req)}</Typography>
              <Tooltip title={<Stack>
                <Typography variant={'body2'}>2
                  slots: {Math.floor((hole?.caverns?.theJars?.perHour * 2) / req)} / hr</Typography>
                <Typography variant={'body2'}>3
                  slots: {Math.floor((hole?.caverns?.theJars?.perHour * 3) / req)} / hr</Typography>
              </Stack>}>
                <IconInfoCircleFilled size={18}/>
              </Tooltip>
            </Stack>
            <Typography variant={'body1'}>Time to
              full: {msToDate(req / hole?.caverns?.theJars?.perHour * 1000 * 3600)}</Typography>
            <Typography variant={'body1'}>Req: {numberWithCommas(Math.floor(req))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheJars;
