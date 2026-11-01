import { Box, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatusText from '@components/common/StatusText';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import Num from '@components/common/Num';
import { formatNum } from '@utility/helpers';
import { CARD_RADIUS } from './tokens';

const isShown = (value) => value !== undefined && value !== null && value !== '';

// A tile that has only a breakdown shows the breakdown's own total, so the value can open it.
const breakdownTotal = (breakdown) => {
  const total = (Array.isArray(breakdown) ? breakdown[0] : breakdown)?.totalValue;
  return typeof total === 'number' ? formatNum(total, 'amount') : total;
};

// GameIcon owns the box, the fit and the centering, so only a state look survives from imgStyle.
const iconLook = (imgStyle) => imgStyle?.opacity !== undefined || imgStyle?.filter
  ? { opacity: imgStyle.opacity, filter: imgStyle.filter }
  : null;

const LABEL_SX = { display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12, lineHeight: '16px', color: 'text.secondary' };

// StatTile (Cards board): one number and its label, 12 px muted over the 16 px value. CardTitleAndValue
// and CardWithBreakdown are this tile under their old names, so their callers keep their props:
// title is label, tooltipTitle is info, cardSx, stackProps, variant, imgStyle and imgOnly as before.
const StatTile = ({
                    title,
                    label = title,
                    value,
                    kind,
                    children,
                    icon,
                    iconAlt,
                    imgOnly,
                    imgStyle,
                    info,
                    tooltipTitle,
                    breakdown,
                    skipNotation,
                    sub,
                    status,
                    size = 'compact',
                    variant,
                    cardSx,
                    stackProps
                  }) => {
  const shown = isShown(value) ? value : breakdown ? breakdownTotal(breakdown) : undefined;
  const hero = size === 'hero';
  const note = info ?? (imgOnly ? undefined : tooltipTitle);
  const name = typeof label === 'string' && label ? label : undefined;
  const number = typeof shown === 'number' && kind ? <Num value={shown} kind={kind}/> : shown;
  const text = status ? <StatusText status={status}>{number}</StatusText> : number;
  const look = iconLook(imgStyle);
  const sprite = icon ? <GameIcon src={icon} size={imgOnly ? 32 : 24}
                                  alt={name ? '' : (iconAlt ?? icon.split('/').pop().replace(/\.\w+$/, ''))}/> : null;
  const iconNode = sprite && look ? <Box component={'span'} sx={{ display: 'inline-flex', ...look }}>{sprite}</Box> : sprite;
  // A list breakdown has no total to show, so a tile with nothing else keeps a muted word as its way in.
  const hasBreakdown = Array.isArray(breakdown) ? breakdown.some(Boolean) : Boolean(breakdown);
  const opener = hasBreakdown && !isShown(shown) && !children && !imgOnly
    ? <Box component={'span'} sx={{ color: 'text.secondary' }}>Details</Box>
    : null;

  return <Box data-card-title-value sx={[
    {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      width: 'fit-content',
      // A row of tiles that does not wrap shrinks them on a phone, breaking words, instead of scrolling the page
      minWidth: 0,
      overflowWrap: 'anywhere',
      minHeight: 52,
      py: 0.75,
      px: 1.5,
      borderRadius: `${CARD_RADIUS}px`,
      bgcolor: 'background.paper'
    },
    hero && { alignItems: 'flex-start', gap: 2, p: 2 },
    (hero || variant === 'outlined') && { border: 1, borderColor: 'divider' },
    ...(Array.isArray(cardSx) ? cardSx : [cardSx])
  ]}>
    {imgOnly && tooltipTitle && iconNode
      ? <Tooltip title={tooltipTitle}><Box component={'span'} sx={{ display: 'inline-flex' }}>{iconNode}</Box></Tooltip>
      : iconNode}
    <Box sx={{ display: stackProps ? 'flex' : 'block', flexDirection: 'column', minWidth: 0, ...(stackProps || {}) }}>
      {label ? <Typography component={'div'} sx={LABEL_SX}>
        {label}
        {note ? <InfoButton label={name}>{note}</InfoButton> : null}
      </Typography> : null}
      {isShown(shown) || opener
        ? <Typography component={'div'} variant={hero ? 'heroValue' : 'value'}>
          {breakdown ? <Breakdown data={breakdown} skipNotation={skipNotation} asValue>{opener ?? text}</Breakdown> : text}
        </Typography>
        : imgOnly ? null : children}
      {sub ? <Typography component={'div'} variant={'caption'} color={'text.secondary'}
                         sx={{ lineHeight: '16px' }}>{sub}</Typography> : null}
    </Box>
  </Box>;
};

export default StatTile;
