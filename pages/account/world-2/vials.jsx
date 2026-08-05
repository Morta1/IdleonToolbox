import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import { getVialMultiplier, vialCostsArray } from '@parsers/world-2/alchemy';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import useCheckbox from '@components/common/useCheckbox';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Vials = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, hideMaxed] = useCheckbox('Hide maxed vials');
  const { value: vialBonus, breakdown } = getVialMultiplier(state?.account);

  return <>
    <NextSeo
      title="Vials | Idleon Toolbox"
      description="View your vial levels, upgrade costs, and bonus effects for alchemy progression in Legends of Idleon"
    />
    <Stack sx={{ flexDirection: 'row', gap: 2, mb:1 }}>
      <CardTitleAndValue title={'Vial bonus'}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Typography>{`${(vialBonus || 1).toFixed(3)}x`}</Typography>
          <Breakdown data={breakdown}>
            <Stack alignContent={'center'}>
              <IconInfoCircleFilled size={18}/>
            </Stack>
          </Breakdown>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue>
        <CheckboxEl/>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'}>
      {state?.account?.alchemy?.vials?.map((vial, index) => {
        const { name, level, mainItem } = vial;
        if (level >= 13 && hideMaxed) return null
        return <Tooltip key={`${name}${index}`} title={<VialTooltip {...vial}/>}><Box position={'relative'}>
          <img key={`${name}${index}`}
               onError={(e) => {
                 e.target.src = `${prefix}data/aVials12.png`;
                 e.target.style = 'opacity: 0;'
               }}
               src={`${prefix}data/aVials${level === 0 ? '1' : level}.png`}
               style={{ opacity: level === 0 ? .5 : 1 }}
               alt={'vial image missing'}/>
          <ItemIcon src={`${prefix}data/${mainItem}.png`} alt="vial-required-item-icon"/>
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
            <ItemIcon tooltip src={`${prefix}data/${rawName}_x1.png`} alt="vial-required-item-icon"/>
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
