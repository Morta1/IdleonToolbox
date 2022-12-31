import React, { forwardRef } from "react";
import { cleanUnderscore, growth, prefix } from "utility/helpers";
import { Badge, Stack, Typography } from "@mui/material";
import styled from "@emotion/styled";
import Tooltip from "../Tooltip";
import { calcCardBonus } from "parsers/cards";

export const floatingText = {
  position: 'absolute',
  bottom: '-14px',
  textShadow: '6px 6px 0px rgb(0 0 0 / 20%)',
  left: '50%',
  transform: 'translateX(-50%)'
}

export const IconWithText = forwardRef((props, ref) => {
  const { stat, icon } = props
  return <Stack alignItems={'center'} {...props} ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
    <img {...props?.img} src={`${prefix}data/${icon}.png`} alt=""/>
    <Typography variant={'body1'}
                component={'span'}>{stat}</Typography>
  </Stack>
})
IconWithText.displayName = 'IconWithText'

export const TitleAndValue = ({ title, value, boldTitle }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'}>
    {title ? <Typography fontWeight={boldTitle ? 'bold' : 500} component={'span'}>{title}:&nbsp;</Typography> : null}
    <Typography fontSize={15} component={'span'}>{value}</Typography>
  </Stack>
}

export const StyledBadge = styled(Badge)`
  & .MuiBadge-badge {
    background-color: #d5d5dc;
    color: rgba(0, 0, 0, 0.87);
  }
`

export const CardAndBorder = (cardProps) => {
  const { cardName, stars, cardIndex, name, variant, rawName, amount, nextLevelReq } = cardProps;
  const iconSrc = variant === 'cardSet' ? `${prefix}data/${rawName}.png` : `${prefix}data/2Cards${cardIndex}.png`;
  const realCardName = variant === 'cardSet' ? name : cardName;
  return <>
    {stars > 0 ?
      <BorderIcon src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
    <Tooltip title={<CardTooltip {...{ ...cardProps, cardName: realCardName, nextLevelReq, amount }}/>}>
      <CardIcon
        isCardSet={variant === 'cardSet'}
        amount={amount}
        src={iconSrc} alt=""/>
    </Tooltip>
  </>
}

const CardTooltip = ({ displayName, effect, bonus, stars, showInfo, nextLevelReq, amount }) => {
  let realBonus = bonus;
  if (showInfo) {
    realBonus = calcCardBonus({ bonus, stars });
  }
  return <>
    <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(displayName)}</Typography>
    <Typography>{cleanUnderscore(effect.replace('{', realBonus))}</Typography>
    {showInfo ? <Stack mt={1} direction={'row'} gap={1} flexWrap={'wrap'}>
      {[1, 2, 3, 4, 5].map((_, index) => {
        return <Stack key={`${displayName}-${index}`} alignItems={'center'} justifyContent={'space-between'}>
          {index === 0 ? <Typography>Base</Typography> : <StarIcon src={`${prefix}etc/Star${index}.png`} alt=""/>}
          <Typography>{bonus * (index + 1)}</Typography>
        </Stack>
      })}
    </Stack> : null}
    {nextLevelReq > 0 ? <Stack>
      Progress: {amount} / {nextLevelReq}
    </Stack> : null}
  </>
}

const StarIcon = styled.img`
  height: 20px;
  object-fit: contain;
`

const CardIcon = styled.img`
  width: 56px;
  height: 72px;
  object-fit: contain;
  opacity: ${({ amount, isCardSet }) => !amount && !isCardSet ? .5 : 1};
`

const BorderIcon = styled.img`
  position: absolute;
  left: 50%;
  top: -3px;
  pointer-events: none;
  transform: translateX(-50%);
`


export const TalentTooltip = ({ level, funcX, x1, x2, funcY, y1, y2, description, name, talentId }) => {
  const mainStat = level > 0 ? growth(funcX, level, x1, x2) : 0;
  const secondaryStat = level > 0 ? growth(funcY, level, y1, y2) : 0;
  return <>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/UISkillIcon${talentId}.png`} alt=""/>
      <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(name)}</Typography>
    </Stack>
    <Typography>{cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat)}</Typography>
  </>
}

export const PlayersList = ({ players, characters }) => {
  return <Stack gap={1} direction={'row'}>
    {players.map(({ index }) => <Tooltip key={name + '-head-' + index}
                                         title={characters?.[index]?.name}>
      <img src={`${prefix}data/headBIG.png`} alt=""/>
    </Tooltip>)}
  </Stack>
}

export const MissingData = ({ name }) => {
  return <Typography variant={'h3'}>Your account is missing data for {name}</Typography>
}