import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, notateNumber } from '@utility/helpers';

const Grotto = ({ hole }) => {
  const { grotto } = hole?.caverns;
  const mushKills = commaNotation(Math.ceil(grotto?.mushroomKills));
  const mushKillsReq = commaNotation(Math.ceil(grotto?.mushroomKillsReq));
  const mushroomKillsLeftNotation = commaNotation(Math.ceil(grotto?.mushroomKillsLeft));

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Layer'} value={grotto?.layer}/>
      <CardTitleAndValue title={'Monarch HP'} value={notateNumber(grotto?.monarchHp, 'Big')}/>
      <CardTitleAndValue title={'Mushroom kills progress'} value={`${mushKills} / ${mushKillsReq}`}/>
      <CardTitleAndValue title={'Mushroom kills left'} value={mushroomKillsLeftNotation}/>
    </Stack>
  </>
};

export default Grotto;
