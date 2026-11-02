import React, { forwardRef, useEffect } from 'react';
import { cleanUnderscore, growth, numberWithCommas, prefix } from 'utility/helpers';
import { Badge, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Tooltip from '../Tooltip';
import Notice from '@components/common/Notice';
import { trackEvent } from '@utility/analytics';
import { calcCardBonus } from 'parsers/cardMath';

export const IconWithText = forwardRef((props, ref) => {
  const { stat, icon, img, title = '', ...rest } = props
  return <Tooltip title={title}>
    <Stack alignItems={'center'} {...rest} ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
      <img {...img} src={`${prefix}data/${icon}.png`} alt={typeof title === 'string' && title ? title : icon}/>
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
    background-color: var(--mui-palette-text-secondary);
    color: var(--mui-palette-background-default);
  }
`

export const CardAndBorder = (cardProps) => {
  const { cardName, stars, cardIndex, name, variant, rawName, amount, nextLevelReq, forceDisable, tooltipProps } = cardProps;
  const iconSrc = variant === 'cardSet' ? `${prefix}data/${rawName}.png` : `${prefix}data/2Cards${cardIndex}.png`;
  const realCardName = variant === 'cardSet' ? name : cardName;

  return <>
    {stars > 0 && !forceDisable ?
      <BorderIcon src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
    <Tooltip {...tooltipProps} title={<CardTooltip {...{ ...cardProps, cardName: realCardName, nextLevelReq, amount }}/>}>
      <CardIcon
        forceDisable={forceDisable}
        isCardSet={variant === 'cardSet'}
        amount={amount}
        src={iconSrc} alt={cleanUnderscore(realCardName ?? rawName ?? '')}/>
    </Tooltip>
  </>
}

const CardTooltip = ({ displayName, effect, bonus, stars, showInfo, nextLevelReq, amount }) => {
  let realBonus = bonus;
  if (showInfo) {
    realBonus = calcCardBonus({ bonus, stars });
  }
  return <>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(displayName)}</Typography>
    <Typography>{cleanUnderscore(effect.replace('{', realBonus))}</Typography>
    {showInfo ? <Stack mt={1} direction={'row'} gap={1} flexWrap={'wrap'}>
      {[1, 2, 3, 4, 5, 6, 7].map((_, index) => {
        return <Stack key={`${displayName}-${index}`} alignItems={'center'} justifyContent={'space-between'}>
          {index === 0 ? <Typography>Base</Typography> : <StarIcon src={`${prefix}etc/Star${index}.png`} alt={`${index} star`}/>}
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

const StarIcon = styled('img')`
  height: 20px;
  object-fit: contain;
`

const CardIcon = styled('img')`
  width: 56px;
  height: 72px;
  object-fit: contain;
  opacity: ${({ amount, isCardSet, forceDisable }) => (!amount && !isCardSet) || forceDisable ? .5 : 1};
`

const BorderIcon = styled('img')`
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
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
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
        alt={characters?.[index]?.name ?? 'character'}
      />
    </Tooltip>)}
  </Stack>
}

// A section that throws in the parser comes back as its fallback (often {}), so only
// account.failedSections tells a parse error apart from a save that has no data yet.
// '*' is set when the whole parse failed.
export const isSectionFailed = (account, section) => {
  const failed = account?.failedSections;
  return !!failed?.includes(section) || !!failed?.includes('*');
};

// The page returns early with this, so it is the whole body: a panel, not a bare line.
// Until phase 5 renders each page's zero catalog under it, the page returns early with this, so the
// note is all the page shows.
export const MissingData = ({ name, failed }) => {
  useEffect(() => {
    // Parse errors only reach the console otherwise; this surfaces breaks nobody reports.
    if (failed) trackEvent('section_failed', { section: name });
  }, [failed, name]);

  // The name leads (or stands alone): some names carry their own article ("The Button").
  return failed
    ? <Notice tone={'error'} sx={{ mt: 2 }}>{`Couldn't load ${name}. That's a bug on my end.`}</Notice>
    : <Notice tone={'missing'} sx={{ mt: 2 }}>{`${name} has no data in your save yet: it shows up here once it does.`}</Notice>;
};

// CardTitleAndValue is StatTile under its old name: callers move to StatTile by name with their pages.
export { default as CardTitleAndValue } from '@components/common/cards/StatTile';


export const CenteredStack = ({ direction = 'row', children }) => {
  return <Stack gap={1} direction={direction} alignItems={'center'}>
    {children}
  </Stack>
}


