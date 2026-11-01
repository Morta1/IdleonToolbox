import { Fragment } from 'react';
import NextLink from 'next/link';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import StatusText from '@components/common/StatusText';
import { NOTICE_TONES } from '@components/common/Notice';
import { formatNum, gameLines } from '@utility/helpers';
import { useCardSize } from './CardGrid';
import { CARD_PADDING, cardState, cardSurface } from './tokens';

// The icon follows the card size unless the card passes iconSize (2b Decision 3 keeps some art at 56 on M cards).
const ICON_SIZE = { s: 32, m: 40, l: 56 };
const TITLE_SX = { m: 0, fontSize: 16, lineHeight: '22px', fontWeight: 500 };
const VALUE_SX = { fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

const show = (value, kind) => typeof value === 'number' && kind ? <Num value={value} kind={kind}/> : value;

// Icon, title, one muted meta line (the level always as "Lv 458 / 999,999"), and at the top right the
// state, a marker or the › of a link card. MealHeader uses it on its own.
export const ItemCardHeader = ({ icon, iconAlt = '', iconSize, size = 'm', title, level, meta, status, statusLabel, aside, link }) => {
  const metaParts = [level ? formatNum(level.value, 'level', { max: level.max }) : null, meta].filter(Boolean);
  return <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ minHeight: icon || title ? 40 : undefined }}>
    {typeof icon === 'string' ? <GameIcon src={icon} size={iconSize ?? ICON_SIZE[size]} alt={iconAlt}/> : icon}
    <Stack sx={{ minWidth: 0, flex: 1 }}>
      {title ? <Typography component={'h3'} sx={TITLE_SX}>{title}</Typography> : null}
      {metaParts.length ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>
        {metaParts.map((part, index) => <Fragment key={index}>{index ? ' · ' : null}{part}</Fragment>)}
      </Typography> : null}
    </Stack>
    {status || aside || link ? <Stack direction={'row'} alignItems={'center'} gap={1}
                                      sx={{ alignSelf: 'flex-start', flexShrink: 0 }}>
      {status ? <StatusText status={status}>{statusLabel}</StatusText> : null}
      {aside}
      {link ? <Box component={'span'} aria-hidden={'true'}
                   sx={{ color: 'text.muted', fontSize: 22, lineHeight: '20px' }}>›</Box> : null}
    </Stack> : null}
  </Stack>;
};

// ItemCard (Cards board): one game thing in a grid. Only the title is required; spacing, type and
// state come from the card, never from the page. A maxed card drops its footer (its cost). With href
// the whole card is the link, so it holds no buttons.
const ItemCard = ({ href, status, dimmed, size, footer, children, ...header }) => {
  const gridSize = useCardSize();
  const cardSize = size ?? gridSize;
  const root = href ? { component: NextLink, href } : { component: 'article' };
  return <Box {...root} sx={[
    (theme) => cardSurface(theme),
    (theme) => cardState(theme, status ?? (dimmed ? 'dim' : undefined)),
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      height: '100%',
      p: CARD_PADDING[cardSize],
      color: 'text.primary',
      textDecoration: 'none'
    },
    href && ((theme) => ({ '&:hover': { borderColor: (theme.vars || theme).palette.primary.main } }))
  ]}>
    {header.title || header.icon || header.level || header.meta
      ? <ItemCardHeader {...header} size={cardSize} status={status} link={Boolean(href)}/>
      : null}
    {children}
    {footer && status !== 'maxed'
      ? <Stack gap={1} sx={{ mt: 'auto', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>{footer}</Stack>
      : null}
  </Box>;
};

// The game's text, its "@" turned into lines; children for text the page builds itself.
const Desc = ({ text, children }) => <Stack gap={0.5}>
  {text !== undefined && text !== null
    ? gameLines(text).map((line, index) => <Typography key={index} variant={'body2'} color={'text.secondary'}>{line}</Typography>)
    : <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{children}</Typography>}
</Stack>;

// Label left, value right, so numbers line up down the card. A row is [label, value, kind?]; a falsy row
// is skipped, and no rows draw nothing (no empty gap in the card).
const Facts = ({ rows }) => {
  const shown = rows.filter(Boolean);
  if (!shown.length) return null;
  return <Stack gap={0.5}>
    {shown.map(([label, value, kind], index) => <Stack key={index} direction={'row'} justifyContent={'space-between'}
                                                       alignItems={'baseline'} gap={1.5}>
      <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
      <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{show(value, kind)}</Typography>
    </Stack>)}
  </Stack>;
};

// Side-by-side numbers, caption over value, each on the inset surface (the page color).
const Stats = ({ cols }) => <Box sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 1 }}>
  {cols.map(([label, value, kind], index) => <Stack key={index}
                                                    sx={{ px: 1, py: 1, borderRadius: 1, bgcolor: 'background.default' }}>
    <Typography variant={'caption'} color={'text.secondary'} sx={{ lineHeight: '16px' }}>{label}</Typography>
    <Typography variant={'value'} component={'div'}>{show(value, kind)}</Typography>
  </Stack>)}
</Box>;

// One bar: label, numbers, 6 px. percent overrides value / max for a bar that does not start at zero
// (a Menagerie mission measures from its last claim), and value and max may then be ready-made nodes.
const Progress = ({ label, value, max, kind = 'amount', percent: fill }) => {
  const percent = fill ?? (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 100);
  return <Stack gap={0.75}>
    <Stack direction={'row'} justifyContent={'space-between'} gap={1.5}>
      <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
      <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{show(value, kind)} / {show(max, kind)}</Typography>
    </Stack>
    <LinearProgress variant={'determinate'} value={percent} color={percent >= 100 ? 'success' : 'primary'}
                    aria-label={typeof label === 'string' ? label : undefined}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'divider' }}/>
  </Stack>;
};

const Section = ({ label, children }) => <Stack gap={1} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
  {label ? <Typography variant={'groupLabel'} color={'text.secondary'}>{label}</Typography> : null}
  {children}
</Stack>;

// The cost as the game prints it: green with "have X" when it is covered, the missing glyph (StatusText's "needs") and "need X more" when not.
// iconAlt names the currency: the icon stands alone here. A node icon is custom art (a plated meal). A cost is lane A:
// game names the stat's rule in gameNotation (MenagerieStuff.Cost), and a stat with no rule prints Big, the mode the
// game draws nearly every owned / cost pair in (Breeding, the Hole, the Masterclass upgrades). format replaces it for
// a currency with its own notation (Gaming bits).
const Cost = ({ icon, iconAlt = '', need, have, game = 'Big', format }) => {
  const known = typeof have === 'number';
  const short = known && have < need;
  const amount = (value) => format ? format(value) : <Num value={value} game={game}/>;
  return <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
    {typeof icon === 'string' ? <GameIcon src={icon} size={24} alt={iconAlt}/> : icon}
    <Typography variant={'body2'} component={'span'} sx={{
      fontWeight: 500,
      display: 'inline-flex',
      gap: 0.5,
      color: !known ? 'text.primary' : short ? 'text.warning' : 'text.success'
    }}>
      {short ? <NOTICE_TONES.missing.Glyph size={14} stroke={2.2} aria-hidden/> : null}
      {amount(need)}
    </Typography>
    {known ? <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
      {short ? <>need {amount(need - have)} more</> : <>have {amount(have)}</>}
    </Typography> : null}
  </Stack>;
};

ItemCard.Desc = Desc;
ItemCard.Facts = Facts;
ItemCard.Stats = Stats;
ItemCard.Progress = Progress;
ItemCard.Section = Section;
ItemCard.Cost = Cost;

export default ItemCard;
