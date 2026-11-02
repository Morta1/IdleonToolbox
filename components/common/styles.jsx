import React, { forwardRef, useEffect } from 'react';
import { cleanUnderscore, formatNum, growth, prefix } from 'utility/helpers';
import { Badge, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Tooltip from '../Tooltip';
import Notice from '@components/common/Notice';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import ItemCard from '@components/common/cards/ItemCard';
import { trackEvent } from '@utility/analytics';
import { calcCardBonus } from 'parsers/cardMath';

// A sprite over its count. size is a GameIcon size; a title is the thing's name, a note that opens on a tap. A title
// that is more than a name (a note with lines) takes label as the thing's name.
export const IconWithText = forwardRef((props, ref) => {
  const { stat, icon, size = 32, title = '', label, ...rest } = props
  const name = typeof title === 'string' ? title : label ?? '';
  const body = <Stack alignItems={'center'} {...rest} ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
    <GameIcon src={`data/${icon}.png`} size={size} alt={name}/>
    <Typography variant={'body2'} component={'span'}>{stat}</Typography>
  </Stack>;
  return title ? <NoteTrigger note={title} label={name || undefined}>{body}</NoteTrigger> : body;
})
IconWithText.displayName = 'IconWithText'

export const TitleAndValue = ({ title, value, boldTitle, titleStyle = {}, valueStyle = {}, stackStyle }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'} sx={stackStyle}>
    {title ? <Typography variant={'body2'} sx={titleStyle} fontWeight={boldTitle ? 'bold' : 500}
                         component={'span'}>{title}:&nbsp;</Typography> : null}
    <Typography variant={'body2'} component={'span'} sx={valueStyle}>{value}</Typography>
  </Stack>
}

export const StyledBadge = styled(Badge)`
  & .MuiBadge-badge {
    background-color: var(--mui-palette-text-secondary);
    color: var(--mui-palette-background-default);
  }
`

// A card is 56x72, not a square item box, so its art keeps its own box (5a Decision 1), dimmed when not owned.
// Its details open on a tap. tooltipProps marks a card whose cell is itself a button (card search's picking): a
// note there would nest a button and take the pick's click, so that card keeps its hover preview.
export const CardAndBorder = (cardProps) => {
  const { cardName, displayName, stars, cardIndex, name, variant, rawName, amount, nextLevelReq, forceDisable, tooltipProps } = cardProps;
  const iconSrc = variant === 'cardSet' ? `${prefix}data/${rawName}.png` : `${prefix}data/2Cards${cardIndex}.png`;
  const realCardName = variant === 'cardSet' ? name : cardName;
  const label = cleanUnderscore(displayName ?? realCardName ?? rawName ?? '');
  const dim = (!amount && variant !== 'cardSet') || forceDisable;
  const art = <img src={iconSrc} alt={label} style={{ width: 56, height: 72, objectFit: 'contain', opacity: dim ? .5 : 1 }}/>;
  const details = <CardTooltip {...{ ...cardProps, cardName: realCardName, nextLevelReq, amount }}/>;

  return <>
    {tooltipProps
      ? <Tooltip {...tooltipProps} title={details}>{art}</Tooltip>
      : <NoteTrigger note={details} label={label}>{art}</NoteTrigger>}
    {/* After the art, so the equipped border draws over it */}
    {stars > 0 && !forceDisable ?
      <BorderIcon src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
  </>
}

// A card set has no displayName: its note is titled by the set's name (cardName), as its trigger is.
const CardTooltip = ({ displayName, cardName, effect, bonus, stars, showInfo, nextLevelReq, amount }) => {
  let realBonus = bonus;
  if (showInfo) {
    realBonus = calcCardBonus({ bonus, stars });
  }
  return <>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(displayName ?? cardName ?? '')}</Typography>
    <Typography variant={'body2'}>{cleanUnderscore(effect.replace('{', realBonus))}</Typography>
    {showInfo ? <Stack mt={1} direction={'row'} gap={1} flexWrap={'wrap'}>
      {[1, 2, 3, 4, 5, 6, 7].map((_, index) => {
        return <Stack key={`${displayName}-${index}`} alignItems={'center'} justifyContent={'space-between'}>
          {index === 0 ? <Typography variant={'body2'}>Base</Typography> :
            <GameIcon src={`etc/Star${index}.png`} size={16} alt={`${index} star`}/>}
          <Typography variant={'body2'}>{bonus * (index + 1)}</Typography>
        </Stack>
      })}
    </Stack> : null}
    {amount >= nextLevelReq ? <Typography variant={'body2'}>You've collected {formatNum(amount)} cards</Typography> : nextLevelReq > 0 ?
      <ItemCard.Facts rows={[['Progress', `${formatNum(amount)} / ${formatNum(nextLevelReq)}`]]}/> : null}
  </>
}

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
      <GameIcon src={`data/UISkillIcon${talentId}.png`} size={32} alt=""/>
      <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
    </Stack>
    <Typography variant={'body2'}>{cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat)}</Typography>
  </>
}

export const PlayersList = ({ players, characters }) => {
  return <Stack gap={1} direction={'row'}>
    {players.map(({ index }) => {
      const name = characters?.[index]?.name ?? 'Character';
      return <NoteTrigger key={`player-${index}`} note={name} label={name}>
        <GameIcon src={`data/ClassIcons${characters?.[index]?.classIndex}.png`} size={24} alt=""/>
      </NoteTrigger>;
    })}
  </Stack>
}

// A section that throws in the parser comes back as its fallback (often {}), so only
// account.failedSections tells a parse error apart from a save that has no data yet.
// '*' is set when the whole parse failed.
export const isSectionFailed = (account, section) => {
  const failed = account?.failedSections;
  return !!failed?.includes(section) || !!failed?.includes('*');
};

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


