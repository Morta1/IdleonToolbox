import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack } from '@mui/material';
import React from 'react';
import { cleanUnderscore, msToDate, notateNumber, numberWithCommas } from '@utility/helpers';
import { ExpRateCard, HoleCostRow } from '@components/account/Worlds/World5/Hole/commons';
import UpgradeCard, { CardIcon, LabelValue } from '@components/common/UpgradeCard';

const Measure = ({ hole }) => {
  const [, , , measure] = hole?.villagers || [];
  return <>
    <Stack mb={2} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Level'} value={measure?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${measure?.exp} / ${measure?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={measure?.expRate} />
      <CardTitleAndValue title={'Time to level'}
                         value={measure?.timeLeft >= 0 && measure?.expRate?.value > 0 ? msToDate(measure?.timeLeft) : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={measure?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {hole?.measurements?.map(({ description, baseBonus, totalBonus, multi, measuredBy, level, cost, owned, icon }, index) => {
        if (description === 'i') return null
        const desc = description.toLowerCase().replace('访', '&');
        const bonusText = (value) => cleanUnderscore(desc.replace('|', ' ').replace('{', notateNumber(value, 'Big')));
        return <UpgradeCard key={`measure-${index}`}
                            width={320}
                            icon={<CardIcon src={`etc/Measure_${index}.png`} alt={''} size={40}/>}
                            title={bonusText(totalBonus)}
                            subtitle={`Lv. ${level}`}
                            footer={<HoleCostRow icon={icon}>
                              {notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}
                            </HoleCostRow>}>
          <Stack gap={.5}>
            <LabelValue label={'Base'}>{bonusText(baseBonus)}</LabelValue>
            <LabelValue label={'Multi'}>{notateNumber(multi, 'MultiplierInfo')}x</LabelValue>
            <LabelValue label={measuredBy?.label}>{measuredBy?.value < 1e6
              ? numberWithCommas(measuredBy?.value)
              : notateNumber(measuredBy?.value, 'Big')}</LabelValue>
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
  </>
};

export default Measure;
