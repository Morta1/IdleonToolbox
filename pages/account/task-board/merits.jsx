import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { cleanUnderscore, prefix, worldsArray } from '../../../utility/helpers';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';

const Merits = () => {
  const { state } = useContext(AppContext);
  const [world, setWorld] = useState(0);

  const handleWorldChange = (world) => {
    setWorld(world);
  }

  return (<>
    <NextSeo
      title="Merits | Idleon Toolbox"
      description="Keep track of your merit progression"
    />
    <Tabber tabs={worldsArray} onTabChange={handleWorldChange}>
      <Stack alignItems={'center'}>
        <CardTitleAndValue title={'Merits'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}etc/Merit_${world}.png`} alt={`merit_${world}`}/>
            <Typography>{state?.account?.tasks?.[4]?.[world + 1]}</Typography>
          </Stack>
        </CardTitleAndValue>
      </Stack>
      <Stack index={world} direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {state?.account?.meritsDescriptions?.[world]?.map(({
                                                             descLine1,
                                                             descLine2,
                                                             bonusPerLevel,
                                                             level,
                                                             extraStr,
                                                             icon,
                                                             meritCost,
                                                             totalLevels
                                                           }, index) => {
          if (descLine1 === 'IDK_YET' || meritCost === null) return null;
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
