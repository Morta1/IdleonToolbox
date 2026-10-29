import React, { forwardRef, useEffect } from 'react';
import { cleanUnderscore, growth, numberWithCommas, prefix } from 'utility/helpers';
import { Badge, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { IconAlertTriangle, IconBrandDiscord, IconInfoCircle } from '@tabler/icons-react';
import Tooltip from '../Tooltip';
import { DISCORD_SERVER_URL } from '../discordLinks';
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
    background-color: #d5d5dc;
    color: rgba(0, 0, 0, 0.87);
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
    <Typography fontWeight={'bold'} variant={'h6'}>{cleanUnderscore(displayName)}</Typography>
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

// The identity banner's blue, so the info state reads as the same family of notice.
const NOTICE_BLUE = '#94baee';

// The page returns early with this, so it is the whole body: a panel, not a bare line.
export const MissingData = ({ name, failed }) => {
  useEffect(() => {
    // Parse errors only reach the console otherwise; this surfaces breaks nobody reports.
    if (failed) trackEvent('section_failed', { section: name });
  }, [failed, name]);

  const Icon = failed ? IconAlertTriangle : IconInfoCircle;
  return <Card variant={'outlined'} sx={{ maxWidth: 520, mt: 2 }}>
    <CardContent>
      <Stack direction={'row'} gap={2} alignItems={'flex-start'}>
        <Stack alignItems={'center'} justifyContent={'center'} sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          color: failed ? 'error.light' : NOTICE_BLUE,
          bgcolor: (theme) => alpha(failed ? theme.palette.error.light : NOTICE_BLUE, 0.14)
        }}>
          <Icon size={22}/>
        </Stack>
        <Stack gap={0.5}>
          <Typography variant={'subtitle1'} component={'h2'} fontWeight={500}>
            {failed ? `Couldn't load ${name}` : `No ${name} data yet`}
          </Typography>
          <Typography variant={'body2'} color={'text.secondary'}>
            {failed
              ? `Something in this save tripped up the toolbox. That's a bug on my end: let me know on Discord and I'll fix it.`
              : `Your save doesn't have ${name} yet. It shows up here once it does.`}
          </Typography>
          {failed ? <Stack direction={'row'} gap={1} alignItems={'center'} mt={1}>
            <Button size={'small'} variant={'outlined'} href={DISCORD_SERVER_URL} target={'_blank'} rel={'noreferrer'}
                    startIcon={<IconBrandDiscord size={16}/>}>
              Report on Discord
            </Button>
            <Button size={'small'} onClick={() => window.location.reload()}>Reload page</Button>
          </Stack> : null}
        </Stack>
      </Stack>
    </CardContent>
  </Card>
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
                                    iconAlt,
                                    tooltipTitle,
                                    stackProps,
                                    contentPadding
                                  }) => {
  const hasValue = value !== undefined && value !== null && value !== '';
  return <Tooltip title={tooltipTitle || ''}>
    <Card variant={variant} raised={raised} data-card-title-value
          sx={{ width: 'fit-content', ...cardSx }}>
      <CardContent sx={{ '&:last-child': contentPadding ? { p: contentPadding } : {}, height: '100%' }}>
        <Stack sx={{ display: stackProps ? 'flex' : 'block', ...(stackProps || {}) }}>
          {title ? <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom
                               component={'span'}>{title}</Typography> : null}
          {(hasValue || imgOnly) ? icon ? <Stack direction={'row'} gap={2} alignItems={'center'}>
            <img style={{ objectFit: 'contain', ...imgStyle }} src={`${prefix}${icon}`}
                 alt={typeof title === 'string' && title
                   ? ''
                   : (iconAlt ?? icon.split('/').pop().replace(/\.\w+$/, ''))}/>
            {hasValue ? <Typography component={'div'}>{value}</Typography> : null}
          </Stack> : <Typography component={'div'}>{value}</Typography> : children}
        </Stack>
      </CardContent>
    </Card>
  </Tooltip>
}


export const CenteredStack = ({ direction = 'row', children }) => {
  return <Stack gap={1} direction={direction} alignItems={'center'}>
    {children}
  </Stack>
}


