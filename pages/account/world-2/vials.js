import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Box, Stack, Typography } from "@mui/material";
import { cleanUnderscore, growth, notateNumber, pascalCase, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";

const Vials = () => {
  const { state } = useContext(AppContext);

  return <>
    <Typography variant={'h2'} mb={3}>Vials</Typography>
    <Stack direction={'row'} flexWrap={'wrap'}>
      {state?.account?.alchemy?.vials?.map((vial, index) => {
        const { name, level, mainItem } = vial;
        return <Tooltip key={`${name}${index}`} title={<VialTooltip {...vial}/>}><Box position={'relative'}>
          <ItemIcon src={`${prefix}data/${mainItem}.png`} alt=""/>
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
  const vialCost = [0, 100, 1E3, 2500, 1E4, 5E4, 1E5, 5E5, 1000001, 5E6, 25E6, 1E8, 1E9, 5E10];
  const bonus = growth(func, level, x1, x2) * multiplier;
  return <>
    <Typography variant={'h5'}>{pascalCase(cleanUnderscore(name))}</Typography>
    <Typography sx={{ color: level > 0 && multiplier > 1 ? 'multi' : '' }}
                variant={'body1'}>{cleanUnderscore(desc.replace(/{|\$/g, bonus))}</Typography>
    <Stack direction={'row'}>
      {itemReq?.map(({ name, rawName }, index) => {
        return name && name !== 'Blank' && name !== 'ERROR' ?
          <Stack alignItems={'center'} justifyContent={'center'} key={name + '' + index}>
            <ItemIcon tooltip src={`${prefix}data/${rawName}.png`} alt=""/>
            <span>{name?.includes('Liquid') ? 3 * level : notateNumber(vialCost[parseFloat(level)], 'Big')}
          </span>
          </Stack> : null
      })}
    </Stack>
  </>
}

const ItemIcon = styled.img`
  width: ${({ tooltip }) => tooltip ? '45px' : '56px'};
  height: ${({ tooltip }) => tooltip ? '45px' : '56px'};
  position: ${({ tooltip }) => tooltip ? 'inherit' : 'absolute'};
  bottom: 35px;
  left: 20px;
`

export default Vials;
