import { CardTitleAndValue } from '@components/common/styles';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';

import React, { Fragment } from 'react';

const majiksName = ['Hole', 'Village', 'idleon'];

const Bonuses = ({ hole }) => {
  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={hole?.villagers?.[2]?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${hole?.villagers?.[2]?.exp} / ${hole?.villagers?.[2]?.expReq}`}/>
      <CardTitleAndValue title={'Exp rate'} value={`${commaNotation(hole?.villagers?.[2]?.expRate)} / hr`}/>
      <CardTitleAndValue title={'Opals invested'} value={hole?.villagers?.[2]?.opalInvested} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    {hole?.majiks?.map((majik, majikIndex) => {
      const letter = majikIndex === 0 ? 'A' : majikIndex === 1 ? 'B' : majikIndex === 2 ? 'C' : '';

      return <Fragment key={`majik-${majikIndex}`}>
        <Stack sx={{ mb: 2 }} direction={'row'} alignItems={'center'} gap={2}>
          <Typography variant={'h5'}>{majiksName[majikIndex]} majik</Typography>
          <img style={{ width: 30 }} src={`${prefix}data/HoleUIcosmoUpg${letter}1.png`} alt={`majik`}/>
        </Stack>
        <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
          {majik.map(({ description, bonus, level, hasDoot, godsLinks }, bonusIndex) => {
            let desc = description.replace('}', Math.round(100 * (1 + bonus / 100)) / 100)
              .replace('{', bonus)
              .replace('|', Math.round(bonus * hole?.cosmoSchematics));
            if (majikIndex === 2 && bonusIndex === 0 && godsLinks?.length > 0 && !hasDoot){
              desc = desc.replace('@_Y', `${godsLinks?.[0]?.name},`);
              desc = desc.replace('@_Z', godsLinks?.[1]?.name);
            }
            return <Stack key={`majik-bonus-${bonusIndex}`} direction={'row'} gap={2} flexWrap={'wrap'}
                          alignItems={'center'}>
              <Card key={`bonus-${bonusIndex}`}>
                <CardContent sx={{ width: 300, height: 170 }}>
                  <Typography>{cleanUnderscore(desc)}</Typography>
                  <Typography mt={2}>Points invested: {level}</Typography>
                  {majikIndex === 2 && bonusIndex === 0 && hasDoot ? <Typography>+{bonus}% All stats</Typography> : null}
                </CardContent>
              </Card>
            </Stack>
          })}
        </Stack>
        <Divider orientation={'horizontal'} sx={{ my: 2 }}/>
      </Fragment>
    })}
  </>;
};

export default Bonuses;
