import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, msToDate, prefix } from '@utility/helpers';

import React, { Fragment } from 'react';
import { ExpRateCard } from '@components/account/Worlds/World5/Hole/commons';
import UpgradeCard, { LabelValue } from '@components/common/UpgradeCard';

const majiksName = ['Hole', 'Village', 'Idleon'];

const Bonuses = ({ hole }) => {
  const [,,bonuses] = hole?.villagers || [];

  return <>
    <Stack mb={2} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={bonuses?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${bonuses?.exp} / ${bonuses?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={bonuses?.expRate} />
      <CardTitleAndValue title={'Time to level'} value={bonuses?.timeLeft >= 0 && bonuses?.expRate?.value ? msToDate(bonuses?.timeLeft) : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={bonuses?.opalInvested || '0'} icon={'data/Opal.png'}
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
          {majik.map(({ description, bonus, level, hasDoot, godsLinks, maxLevel }, bonusIndex) => {
            let desc = description.replace('}', Math.round(100 * (1 + bonus / 100)) / 100)
              .replace('{', bonus)
              .replace('|', Math.round(bonus * hole?.cosmoSchematics))
              .replace('\$', Math.round(Math.floor((hole?.leastOpalInvestedVillager ?? 0) / 5) * bonus));
            if (hasDoot){
              desc = desc.replace('@_Y', '').replace('@_Z', '');
            }
            else if (majikIndex === 2 && bonusIndex === 0 && godsLinks?.length > 0 && !hasDoot){
              desc = desc.replace('@_Y', `${godsLinks?.[0]?.name},`);
              desc = desc.replace('@_Z', godsLinks?.[1]?.name);
            }
            return <UpgradeCard key={`majik-bonus-${bonusIndex}`}
                                dimmed={level === 0}
                                footer={<LabelValue label={'Points invested'}>{level} / {maxLevel}</LabelValue>}>
              <Typography variant={'body2'}>{cleanUnderscore(desc)}</Typography>
              {majikIndex === 2 && bonusIndex === 0 && hasDoot && level > 0
                ? <Typography variant={'body2'} color={'success.light'}>+{15 * bonus}% All stats</Typography>
                : null}
            </UpgradeCard>
          })}
        </Stack>
        <Divider orientation={'horizontal'} sx={{ my: 2 }}/>
      </Fragment>
    })}
  </>;
};

export default Bonuses;
