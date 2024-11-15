import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, notateNumber } from '@utility/helpers';

const Grotto = ({ hole }) => {
  const { grotto } = hole?.caverns;
  const mushKills =  2E9 > grotto?.mushroomKills ? commaNotation(Math.ceil(grotto?.mushroomKills)) : (commaNotation(Math.ceil(grotto?.mushroomKills / 1E9)));
  // const mushKillsLeft =  2E9 > grotto?.mushroomKillsLeft ? commaNotation(Math.ceil(grotto?.mushroomKillsLeft)) : (commaNotation(Math.ceil(grotto?.mushroomKillsLeft / 1E9)));
  const mushKillsReq =  2E9 > grotto?.mushroomKillsReq ? commaNotation(Math.ceil(grotto?.mushroomKillsReq)) : (commaNotation(Math.ceil(grotto?.mushroomKillsReq / 1E9)));

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Layer'} value={grotto?.layer}/>
      <CardTitleAndValue title={'Monarch HP'} value={notateNumber(grotto?.monarchHp, 'Big')}/>
      <CardTitleAndValue title={'Mushroom kills left'} value={`${mushKills}/${mushKillsReq}`}/>
    </Stack>
  </>
};

export default Grotto;
