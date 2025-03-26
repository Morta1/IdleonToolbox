import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import { vialCostsArray } from '../../../parsers/alchemy';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { isRiftBonusUnlocked } from '../../../parsers/world-4/rift';
import useCheckbox from '@components/common/useCheckbox';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { getLabBonus } from '@parsers/lab';

const Vials = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, hideMaxed] = useCheckbox('Hide maxed vials');

  const getVialBonus = () => {
    let vialMastery = 0;
    const upgradeVaultBonus = getUpgradeVaultBonus(state?.account?.upgradeVault?.upgrades, 42);
    if (isRiftBonusUnlocked(state?.account?.rift, 'Vial_Mastery')) {
      const maxedVials = state?.account?.alchemy?.vials?.filter(({ level }) => level >= 13);
      vialMastery = 2 * maxedVials?.length;
      vialMastery = isNaN(vialMastery) ? 0 : vialMastery;
    }
    const myFirstChemistrySet = getLabBonus(state?.account.lab.labBonuses, 10); // vial multi
    return myFirstChemistrySet * (1 + (vialMastery + upgradeVaultBonus) / 100);
  }

  return <>
    <NextSeo
      title="Vials | Idleon Toolbox"
      description="Vials progressions and upgrade requirements"
    />
    <Stack sx={{ flexDirection: 'row', gap: 2, mb:1 }}>
      <CardTitleAndValue title={'Vial bonus'}
                         value={`${(getVialBonus() || 1).toFixed(3)}x`}/>
      <CardTitleAndValue>
        <CheckboxEl/>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'}>
      {state?.account?.alchemy?.vials?.map((vial, index) => {
        const { name, level, mainItem } = vial;
        if (level >= 13 && hideMaxed) return null
        return <Tooltip key={`${name}${index}`} title={<VialTooltip {...vial}/>}><Box position={'relative'}>
          <ItemIcon src={`${prefix}data/${mainItem}.png`} alt="vial-required-item-icon"/>
          <img key={`${name}${index}`}
               onError={(e) => {
                 e.target.src = `${prefix}data/aVials12.png`;
                 e.target.style = 'opacity: 0;'
               }}
               src={`${prefix}data/aVials${level === 0 ? '1' : level}.png`}
               style={{ opacity: level === 0 ? .5 : 1 }}
               alt={'vial image missing'}/>
        </Box></Tooltip>
      })}
    </Stack>
  </>;
};

const VialTooltip = ({ name, itemReq, func, x1, x2, level, desc, multiplier = 1 }) => {
  const bonus = growth(func, level, x1, x2) * multiplier;
  return <>
    <Typography variant={'h5'}>{pascalCase(cleanUnderscore(name))}</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'multi' : '' }}
                variant={'body1'}>{cleanUnderscore(desc.replace(/{|\$/g, notateNumber(bonus, 'MultiplierInfo')))}</Typography>
    <Stack direction={'row'}>
      {itemReq?.map(({ name, rawName }, index) => {
        return name && name !== 'Blank' && name !== 'ERROR' ?
          <Stack alignItems={'center'} justifyContent={'center'} key={name + '' + index}>
            <ItemIcon tooltip src={`${prefix}data/${rawName}.png`} alt="vial-required-item-icon"/>
            <span>{name?.includes('Liquid') ? 3 * level : notateNumber(vialCostsArray[parseFloat(level)], 'Big')}
          </span>
          </Stack> : null
      })}
    </Stack>
  </>;
}

const ItemIcon = styled.img`
  width: ${({ tooltip }) => tooltip ? '45px' : '56px'};
  height: ${({ tooltip }) => tooltip ? '45px' : '56px'};
  position: ${({ tooltip }) => tooltip ? 'inherit' : 'absolute'};
  bottom: 35px;
  left: 20px;
`

export default Vials;
