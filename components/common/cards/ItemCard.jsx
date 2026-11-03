import { Fragment, isValidElement } from 'react';
import NextLink from 'next/link';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Num, { numOrNode } from '@components/common/Num';
import StatusText from '@components/common/StatusText';
import { formatNum, gameLines } from '@utility/helpers';
import { useCardSize } from './CardGrid';
import { CARD_PADDING, cardState, cardSurface } from './tokens';

// The icon follows the card size unless the card passes iconSize (2b Decision 3 keeps some art at 56 on M cards).
const ICON_SIZE = { s: 32, m: 40, l: 56 };
// A number never breaks inside itself ("25.882 / 120" stays one line): when it and its label don't fit one row, the
// value drops under the label, still at the right. A value in words (a jelly's bonus line) wraps beside its label. A
// value and its breakdown trigger's glyph are one group either way: the glyph never takes a line of its own.
const TEXT_VALUE_SX = {
  fontWeight: 500,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  '& [aria-haspopup="dialog"]': { whiteSpace: 'nowrap' }
};
const VALUE_SX = { ...TEXT_VALUE_SX, whiteSpace: 'nowrap', ml: 'auto' };
const TEXT_ROW_SX = { columnGap: 1.5 };
const ROW_SX = { ...TEXT_ROW_SX, flexWrap: 'wrap' };

// The words a value's own strings spell; a node that prints its value itself (a <Num>) spells nothing.
const textOf = (node) => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return isValidElement(node) ? textOf(node.props?.children) : '';
};

// A number, a number pair, or a value with nothing to read counts as a number: a digit and no word of four letters
// ("Lv 2,626 → 2,635", "1 in 25,000"). "1.00x Construction Build Rate (+0.25x/lv)" is words.
const isNumberLike = (value, kind) => {
  if (kind || typeof value === 'number') return true;
  const text = textOf(value);
  return !text || (/\d/.test(text) && !/[A-Za-z]{4,}/.test(text));
};

// Icon, title, one muted meta line (the level always as "Lv 458 / 999,999"), and at the top right the
// state, a marker or the › of a link card. MealHeader uses it on its own.
export const ItemCardHeader = ({ icon, iconAlt = '', iconSize, size = 'm', title, level, meta, status, statusLabel, aside, link }) => {
  const metaParts = [level ? formatNum(level.value, 'level', { max: level.max }) : null, meta].filter(Boolean);
  return <Stack direction={'row'} alignItems={'center'} gap={1.5} sx={{ minHeight: icon || title ? 40 : undefined }}>
    {typeof icon === 'string' ? <GameIcon src={icon} size={iconSize ?? ICON_SIZE[size]} alt={iconAlt}/> : icon}
    <Stack sx={{ minWidth: 0, flex: 1 }}>
      {title ? <Typography variant={'cardTitle'} component={'h3'}>{title}</Typography> : null}
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

// The game's text, its "@" turned into lines, except a break the game made mid-sentence to fit its box, which joins
// with a space (gameLines' sentences); an array is lines the page built itself, one each; children for text the page
// builds itself.
const Desc = ({ text, children }) => {
  const lines = Array.isArray(text) ? text.flatMap((line) => gameLines(line))
    : text !== undefined && text !== null ? gameLines(text, { sentences: true }) : null;
  return <Stack gap={0.5}>
    {lines
      ? lines.map((line, index) => <Typography key={index} variant={'body2'} color={'text.secondary'}>{line}</Typography>)
      : <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{children}</Typography>}
  </Stack>;
};

// Label left, value right, so numbers line up down the card. A row is [label, value, kind?]; a falsy row
// is skipped, and no rows draw nothing (no empty gap in the card).
const Facts = ({ rows }) => {
  const shown = rows.filter(Boolean);
  if (!shown.length) return null;
  return <Stack gap={0.5}>
    {shown.map(([label, value, kind], index) => {
      const numeric = isNumberLike(value, kind);
      return <Stack key={index} direction={'row'} justifyContent={'space-between'} alignItems={'baseline'}
                    sx={numeric ? ROW_SX : TEXT_ROW_SX}>
        <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
        <Typography variant={'body2'} component={'div'} sx={numeric ? VALUE_SX : TEXT_VALUE_SX}>{numOrNode(value, kind)}</Typography>
      </Stack>;
    })}
  </Stack>;
};

// Side-by-side numbers, caption over value, each on the inset surface (the page color).
const Stats = ({ cols }) => <Box sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 1 }}>
  {cols.map(([label, value, kind], index) => <Stack key={index}
                                                    sx={{ px: 1, py: 1, borderRadius: 1, bgcolor: 'background.default' }}>
    <Typography variant={'caption'} color={'text.secondary'} sx={{ lineHeight: '16px' }}>{label}</Typography>
    <Typography variant={'value'} component={'div'}>{numOrNode(value, kind)}</Typography>
  </Stack>)}
</Box>;

// One bar: label, numbers, 6 px. percent overrides value / max for a bar that does not start at zero
// (a Menagerie mission measures from its last claim), and value and max may then be ready-made nodes.
const Progress = ({ label, value, max, kind = 'amount', percent: fill }) => {
  const percent = fill ?? (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 100);
  return <Stack gap={0.75}>
    <Stack direction={'row'} justifyContent={'space-between'} sx={ROW_SX}>
      <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
      <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{numOrNode(value, kind)} / {numOrNode(max, kind)}</Typography>
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

// The cost as the game prints it, "owned / cost": the owned amount muted, the cost bold, green when it is covered,
// amber and followed by "need X more" when not. The words carry the state, so it never rests on color alone. The cost
// carries the weight because on a page that spends one currency the owned amount repeats on every card.
// iconAlt names the currency: the icon stands alone here. A node icon is custom art (a plated meal). A cost is lane A:
// game names the stat's rule in gameNotation (MenagerieStuff.Cost), and a stat with no rule prints Big, the mode the
// game draws nearly every owned / cost pair in (Breeding, the Hole, the Masterclass upgrades). format replaces it for
// a currency with its own notation (Gaming bits). icon as a function of the amount is a tiered currency's (bits: the
// notation divides by 1e18 per tier), so each amount carries its own tier's sprite.
const Cost = ({ icon, iconAlt = '', need, have, game = 'Big', format }) => {
  const known = typeof have === 'number';
  const short = known && have < need;
  const perAmount = typeof icon === 'function';
  const amount = (value) => <>
    {format ? format(value) : <Num value={value} game={game}/>}
    {perAmount ? <GameIcon src={icon(value)} size={16} alt={iconAlt}/> : null}
  </>;
  return <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
    {perAmount ? null : typeof icon === 'string' ? <GameIcon src={icon} size={24} alt={iconAlt}/> : icon}
    <Typography variant={'body2'} component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {known ? <>
        <Box component={'span'} sx={{ color: 'text.secondary' }}>{amount(have)}</Box>
        <Box component={'span'} sx={{ color: 'text.muted' }}>/</Box>
      </> : null}
      <Box component={'span'} sx={{
        fontWeight: 600,
        color: !known ? 'text.primary' : short ? 'text.warning' : 'text.success'
      }}>
        {amount(need)}
      </Box>
    </Typography>
    {short ? <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
      need {amount(need - have)} more
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
