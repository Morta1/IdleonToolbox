import React, { forwardRef } from 'react';
import { cleanUnderscore, growth, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import { Badge, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import { calcCardBonus } from 'parsers/cards';

export const IconWithText = forwardRef((props, ref) => {
  const { stat, icon, img, title = '', ...rest } = props
  return <Tooltip title={title}>
    <Stack alignItems={'center'} {...rest} ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
      <img {...img} src={`${prefix}data/${icon}.png`} alt=""/>
      <Typography variant={'body1'}
                  component={'span'}>{stat}</Typography>
    </Stack>
  </Tooltip>
})
IconWithText.displayName = 'IconWithText'

export const TitleAndValue = ({ title, value, boldTitle, titleStyle = {}, valueStyle = {}, stackStyle }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'} sx={stackStyle}>
    {title ? <Typography sx={titleStyle} fontWeight={boldTitle ? 'bold' : 500}
                         component={'span'}>{title}:&nbsp;</Typography> : null}
    <Typography fontSize={15} component={'span'} sx={valueStyle}>{value}</Typography>
  </Stack>
}

export const StyledBadge = styled(Badge)`
  & .MuiBadge-badge {
    background-color: #d5d5dc;
    color: rgba(0, 0, 0, 0.87);
  }
`

export const CardAndBorder = (cardProps) => {
  const { cardName, stars, cardIndex, name, variant, rawName, amount, nextLevelReq, forceDisable } = cardProps;
  const iconSrc = variant === 'cardSet' ? `${prefix}data/${rawName}.png` : `${prefix}data/2Cards${cardIndex}.png`;
  const realCardName = variant === 'cardSet' ? name : cardName;

  return <>
    {stars > 0 && !forceDisable ?
      <BorderIcon src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
    <Tooltip title={<CardTooltip {...{ ...cardProps, cardName: realCardName, nextLevelReq, amount }}/>}>
      <CardIcon
        forceDisable={forceDisable}
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
      {[1, 2, 3, 4, 5, 6].map((_, index) => {
        return <Stack key={`${displayName}-${index}`} alignItems={'center'} justifyContent={'space-between'}>
          {index === 0 ? <Typography>Base</Typography> : <StarIcon src={`${prefix}etc/Star${index}.png`} alt=""/>}
          <Typography>{bonus * (index + 1)}</Typography>
        </Stack>
      })}
    </Stack> : null}
    {amount >= nextLevelReq ? <Stack>You've collected {numberWithCommas(amount)} cards</Stack> : nextLevelReq > 0 ?
      <Stack>
        Progress: {numberWithCommas(amount)} / {numberWithCommas(nextLevelReq)}
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
  opacity: ${({ amount, isCardSet, forceDisable }) => (!amount && !isCardSet) || forceDisable ? .5 : 1};
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
      <img
        style={{ width: 24, height: 24 }}
        src={`${prefix}data/ClassIcons${characters?.[index]?.classIndex}.png`}
        alt=""
      />
    </Tooltip>)}
  </Stack>
}

export const MissingData = ({ name }) => {
  return <Typography variant={'h3'}>Your account is missing data for {name}</Typography>
}

export const CardTitleAndValue = ({
                                    variant,
                                    raised,
                                    cardSx,
                                    imgOnly,
                                    imgStyle,
                                    title,
                                    value,
                                    children,
                                    icon,
                                    tooltipTitle,
                                    stackProps,
                                    contentPadding
                                  }) => {
  return <Tooltip title={tooltipTitle || ''}>
    <Card variant={variant} raised={raised}
          sx={{ my: { xs: 0, md: 3 }, mb: { xs: 2 }, width: 'fit-content', ...cardSx }}>
      <CardContent sx={{ '&:last-child': contentPadding ? { p: contentPadding } : {}, height: '100%' }}>
        <Stack sx={{ display: stackProps ? 'flex' : 'block', ...(stackProps || {}) }}>
          {title ? <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom
                               component={'span'}>{title}</Typography> : null}
          {(value || imgOnly) ? icon ? <Stack direction={'row'} gap={2} alignItems={'center'}>
            <img style={{ objectFit: 'contain', ...imgStyle }} src={`${prefix}${icon}`} alt=""/>
            {value ? <Typography component={'div'}>{value}</Typography> : null}
          </Stack> : <Typography component={'div'}>{value}</Typography> : children}
        </Stack>
      </CardContent>
    </Card>
  </Tooltip>
}

export const Breakdown = ({ breakdown, titleStyle = {}, notation = 'Big', skipNotation }) => {
  return <>
    {breakdown?.map(({ name, value, title }, index) => {
      return title ? <Stack key={`${title}-${index}`}>
          {index > 0 ? <Divider sx={{ my: 1 }}/> : null}
          <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
          <Divider sx={{ my: 1 }}/>
        </Stack>
        : <TitleAndValue
          key={`${name}-${index}`}
          titleStyle={{ width: 120, ...titleStyle }}
          title={name}
          value={skipNotation ? value : !isNaN(value)
            ? notateNumber(value, notation).replace('.00', '')
            : value}/>
    })}
  </>
}


export const CenteredStack = ({ direction = 'row', children }) => {
  return <Stack gap={1} direction={direction} alignItems={'center'}>
    {children}
  </Stack>
}


