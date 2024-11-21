import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';

const TheDen = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Best score'} icon={'etc/Amp_Best_Score.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'none' }}
                         value={hole?.caverns?.theDen?.bestScore}/>
      <CardTitleAndValue title={'Next opal'} icon={'data/Opal.png'}
                         imgStyle={{ width: 24, height: 24 }}
                         value={commaNotation(hole?.caverns?.theDen?.nextOpalAt)}/>
      <CardTitleAndValue title={'Multi'}
                         value={`${notateNumber(hole?.caverns?.theDen?.ampMulti, 'MultiplierInfo')}x`}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theDen?.amplifiers?.map(({ ampName, ampDescription, level, bonus }, index) => {
        return <Card key={`amp-${index}`}>
          <CardContent sx={{
            width: 300,
            minHeight: 170,
            '&:last-child': { pb: 0 },
            opacity: index < hole?.caverns?.theDen?.ownedAmps ? 1 : .5
          }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <img src={`${prefix}data/HoleFightAmp${index}.png`} alt={`amp-${index}`}/>
              <Typography>{cleanUnderscore(ampName)}</Typography>
            </Stack>
            <Typography>{cleanUnderscore(ampDescription).replace('{', bonus)}</Typography>
            <Typography mt={1}>Level: {level}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheDen;
