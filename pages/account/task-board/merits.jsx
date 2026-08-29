import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { cleanUnderscore, prefix, worldsArray } from '@utility/helpers';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import useTabIndex from '@hooks/useTabIndex';
import EmptyState from '@components/common/EmptyState';

const Merits = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const [hideCompleted, setHideCompleted] = useState(false);

  const worldMerits = state?.account?.meritsDescriptions?.[world]
    ?.filter(({ descLine1, meritCost }) => descLine1 !== 'IDK_YET' && meritCost !== null) ?? [];
  const visibleMerits = worldMerits.filter(({ level, totalLevels }) => !(hideCompleted && level >= totalLevels));

  return (<>
    <NextSeo
      title="Merits | Idleon Toolbox"
      description="Track your merit shop purchases, point spending, and available upgrades in Legends of Idleon"
    />
    <FormControlLabel
      control={<Checkbox checked={hideCompleted}
                         onChange={(e) => setHideCompleted(e.target.checked)}/>}
      label={'Hide completed'}/>
    <Tabber tabs={worldsArray} keepChildren>
      <Stack mb={3} alignItems={'center'}>
        <CardTitleAndValue title={'Merits'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}etc/Merit_${world}.png`} alt={`merit_${world}`}/>
            <Typography>{state?.account?.tasks?.[4]?.[world + 1]}</Typography>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Stack index={world} direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {visibleMerits?.length === 0
          ? <EmptyState hideCompleted={hideCompleted && worldMerits.length > 0} label={'merits'}/>
          : null}
        {visibleMerits?.map(({
                               descLine1,
                               descLine2,
                               bonusPerLevel,
                               level,
                               extraStr,
                               icon,
                               meritCost,
                               totalLevels
                             }, index) => {
          let desc = ('Blank420q' !== extraStr
            ? descLine1.replace(/}/, extraStr.split('|')[level])
            : descLine1.replace(/{/, bonusPerLevel * level)) + (descLine2 !== 'Descline2' ? ` ${descLine2}` : '');
          return <Card key={'key' + index} sx={{ width: 400 }}>
            <CardContent sx={{
              border: level >= totalLevels ? '1px solid' : '',
              borderColor: level >= totalLevels ? 'success.light' : '',
              height: '100%'
            }}>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/${icon}.png`} alt={'merit_icon' + icon}/>
                <Typography sx={{ mb: 1 }}>{cleanUnderscore(desc)}</Typography>
              </Stack>
              <Stack sx={{ mt: 2 }} justifyContent={'space-between'} direction={'row'}>
                <Typography>Purchases: {level} / {totalLevels}</Typography>
                <Typography>Price: {meritCost}</Typography>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>
  </>);
};

export default Merits;
