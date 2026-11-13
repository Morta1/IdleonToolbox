import { Fragment } from 'react';
import NextLink from 'next/link';
import { Box, LinearProgress, Link, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Num, { numOrNode } from '@components/common/Num';
import StatusText from '@components/common/StatusText';
import WithLastWord from '@components/common/WithLastWord';
import { formatNum, gameLines } from '@utility/helpers';
import { useCardDetails, useCardRows, useCardSize } from './CardGrid';
import { CARD_PADDING, cardState, cardSurface, dimKeepingMeta, isNumberLike, textOf } from './tokens';

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
// A row keeps its text on one baseline, except one that holds a sprite on either side: a sprite's baseline is its bottom
// edge, which sat the other side 8 to 10 px off, so that row centres its two sides.
const TEXT_ROW_SX = { columnGap: 1.5, '&:has(img)': { alignItems: 'center' } };
const ROW_SX = { ...TEXT_ROW_SX, flexWrap: 'wrap' };
// Beside a value in words a short label ("Last sold", "Shiny passive": up to SHORT_LABEL characters) never breaks: the
// value wraps instead. A longer one ("Next tier (Verisimilitude)") still shares the row's width with its value, or both
// would stack into a narrow column.
const SHORT_LABEL = 16;
const SHORT_LABEL_SX = { flexShrink: 0 };

// The title block and the state share one wrapping row: the title block asks for its one-line width, so when the title
// and the state don't fit side by side the state takes its own line under the title instead of squeezing it to a
// narrow column. The title row and the markers are one group centred beside the icon, the state and markers at its top:
// on the title's first line. Pinned to the header's top instead, they sat above a title centred beside a taller icon.
const TITLE_GROUP_SX = { minWidth: 0, flex: 1, alignSelf: 'center', display: 'flex', alignItems: 'flex-start', gap: 1.5 };
const TITLE_ROW_SX = { minWidth: 0, flex: 1, display: 'flex', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 };
const TITLE_BLOCK_SX = { minWidth: 0, flex: '1 1 auto' };
const STATUS_SX = { alignSelf: 'flex-start', flexShrink: 0 };
const STATUS_OWN_LINE_SX = { ...STATUS_SX, flexBasis: '100%' };
// The marker group after the state: none when the marker draws nothing (a doubler tag with nothing to say), and 8 px
// from a shown state (a span in the title row) as when the two shared one group
const HEADER_SX = { '& [data-title-row]:has(> span) + [data-aside]': { ml: -0.5 } };
// The markers take the title's line (cardTitle's 22 px) and centre on it: a marker taller than the line (Summoning's 40 px
// boss) overhangs it instead of growing the group, which pushed the title above the icon's middle.
const ASIDE_SX = { flexShrink: 0, height: 22, '&:empty': { display: 'none' } };

// The › of a thing that opens a page: at a link card's top right, and after a title that is a link.
export const LinkMark = ({ sx }) => <Box component={'span'} aria-hidden={'true'} sx={{ color: 'text.muted', ...sx }}>›</Box>;

// "Lv 458" with its cap a step dimmer (Cards board).
const levelLine = ({ value, max }) => {
  const [current, cap] = formatNum(value, 'level', { max }).split(' / ');
  return cap ? <>{current}<Box component={'span'} sx={{ color: 'text.muted' }}>{' / '}{cap}</Box></> : current;
};

// Icon, title, one muted meta line at 13/400 (the level always as "Lv 458 / 999,999"), and at the top right the
// state, a marker or the › of a link card. MealHeader uses it on its own. statusOwnLine: the state under the title at every
// width, for a grid of one kind of card where some have it (the leaderboards' boards): their titles stay level.
// titleState: a state word that says something about the thing but puts no look on the card (a plot keeps growing while
// its evo is locked, so status="locked" would lie): it sits where status does, and drops under a squeezed title with it.
export const ItemCardHeader = ({ icon, iconAlt = '', iconSize, size = 'm', title, level, meta, status, statusLabel, statusOwnLine, titleState, aside, link }) => {
  const metaParts = [level ? levelLine(level) : null, meta].filter(Boolean);
  return <Stack data-card-header direction={'row'} alignItems={'center'} gap={1.5} sx={{ ...HEADER_SX, minHeight: icon || title ? 40 : undefined }}>
    {typeof icon === 'string' ? <GameIcon src={icon} size={iconSize ?? ICON_SIZE[size]} alt={iconAlt}/> : icon}
    <Box data-title-group sx={TITLE_GROUP_SX}>
      <Box data-title-row sx={TITLE_ROW_SX}>
        <Stack data-title-block sx={TITLE_BLOCK_SX}>
          {title ? <Typography variant={'cardTitle'} component={'h3'}>{title}</Typography> : null}
          {metaParts.length ? <Typography data-card-meta color={'text.secondary'} component={'div'} sx={{ fontSize: 13, lineHeight: '18px' }}>
            {metaParts.map((part, index) => <Fragment key={index}>{index ? ' · ' : null}{part}</Fragment>)}
          </Typography> : null}
        </Stack>
        {status ? <StatusText status={status} sx={statusOwnLine ? STATUS_OWN_LINE_SX : STATUS_SX}>{statusLabel}</StatusText> : null}
        {titleState ? <Box component={'span'} sx={STATUS_SX}>{titleState}</Box> : null}
      </Box>
      {aside || link ? <Stack data-aside direction={'row'} alignItems={'center'} gap={1} sx={ASIDE_SX}>
        {aside}
        {link ? <LinkMark sx={{ fontSize: 22, lineHeight: '20px' }}/> : null}
      </Stack> : null}
    </Box>
  </Stack>;
};

// ItemCard (Cards board): one game thing in a grid. Only the title is required; spacing, type and
// state come from the card, never from the page. A maxed card drops its footer (its cost). With href
// the whole card is the link, so it holds no buttons; onClick opens it in place (a page that keeps its query), and
// prefetch false leaves a large page's data until it is opened. keepMeta: a dimmed card whose meta line is its state in
// words (Gallery's "Not acquired") keeps that line at full strength, so it reads at AA.
// A card at its level's max is Maxed unless the page names another state, so it drops its cost by itself: a page that
// forgot to say so priced a level past the cap (Statue flair's Lv 4 / 4 asking for marble).
// more: the card's secondary rows (the next milestone, kills to charge, an outpost's units), drawn under its own rows
// while its grid shows details: the page's Details pill (CardGrid details). Off, the card is compact and a desktop fits
// more of them; on, every card on the page opens at once and the rows stay even. In the card rather than a note, so what
// it holds can be a control (Outposts' unit tiles). Not on a link card, which holds no buttons.
const reachedMax = (level) => Number.isFinite(level?.max) && level.max > 0 && (level.value ?? 0) >= level.max;
const ItemCard = ({ href, onClick, prefetch, status: givenStatus, dimmed, keepMeta, size, footer, more, children, ...props }) => {
  const gridSize = useCardSize();
  const showDetails = useCardDetails();
  const alignRows = useCardRows();
  const cardSize = size ?? gridSize;
  const derivedMax = givenStatus == null && reachedMax(props.level);
  const status = derivedMax ? 'maxed' : givenStatus;
  // A label the page wrote for its own state never names the derived one
  const header = derivedMax ? { ...props, statusLabel: undefined } : props;
  const root = href ? { component: NextLink, href, onClick, prefetch } : { component: 'article' };
  return <Box {...root} sx={[
    (theme) => cardSurface(theme),
    (theme) => (dimmed && keepMeta && !status ? dimKeepingMeta(theme) : cardState(theme, status ?? (dimmed ? 'dim' : undefined))),
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      height: '100%',
      p: CARD_PADDING[cardSize],
      color: 'text.primary',
      textDecoration: 'none'
    },
    href && ((theme) => ({ '&:hover': { borderColor: (theme.vars || theme).palette.primary.main } })),
    // Unused rows at the foot take no gap: the card's last part closes it
    alignRows > 0 && { display: 'grid', gridTemplateRows: 'subgrid', gridRow: `span ${alignRows}`, rowGap: 0,
      '& > *:not(:last-child)': { mb: 1.5 } }
  ]}>
    {header.title || header.icon || header.level || header.meta
      ? <ItemCardHeader {...header} size={cardSize} status={status} link={Boolean(href)}/>
      : null}
    {children}
    {more && showDetails && !href ? more : null}
    {footer && status !== 'maxed'
      ? <Stack gap={1} sx={{ mt: 'auto', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>{footer}</Stack>
      : null}
  </Box>;
};

// A title that opens a page while the card stays a card, in the title's own color: a phone has no hover to find it by, so
// the › says so. inline-block keeps it out of the hover's underline. Its role is a step up from a link card's: this one sits
// on cards that dim (Hat Rack's, Gallery's, and every one a guest sees), and the dim takes text.muted to 2.5:1.
const TitleLink = ({ text, onClick }) => <Link component={'button'} type={'button'} color={'inherit'} onClick={onClick}
                                               sx={{ font: 'inherit', textAlign: 'left', verticalAlign: 'baseline' }}>
  <WithLastWord text={text}><LinkMark sx={{ display: 'inline-block', ml: 0.5, color: 'text.secondary' }}/></WithLastWord>
</Link>;

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

// Label left, value right, so numbers line up down the card. A row is [label, value, how?], how being what numOrNode takes;
// a falsy row is skipped, and no rows draw nothing (no empty gap in the card).
const Facts = ({ rows }) => {
  const shown = rows.filter(Boolean);
  if (!shown.length) return null;
  return <Stack gap={0.5}>
    {shown.map(([label, value, how], index) => {
      const numeric = isNumberLike(value, how);
      return <Stack key={index} direction={'row'} justifyContent={'space-between'} alignItems={'baseline'}
                    sx={numeric ? ROW_SX : TEXT_ROW_SX}>
        <Typography variant={'body2'} color={'text.secondary'} component={'div'}
                    sx={!numeric && textOf(label).length <= SHORT_LABEL ? SHORT_LABEL_SX : undefined}>{label}</Typography>
        <Typography variant={'body2'} component={'div'} sx={numeric ? VALUE_SX : TEXT_VALUE_SX}>{numOrNode(value, how)}</Typography>
      </Stack>;
    })}
  </Stack>;
};

// Side-by-side numbers, caption over value, each on the inset surface (the page color).
const Stats = ({ cols }) => <Box sx={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 1 }}>
  {cols.map(([label, value, how], index) => <Stack key={index}
                                                    sx={{ px: 1, py: 1, borderRadius: 1, bgcolor: 'background.default' }}>
    <Typography variant={'caption'} color={'text.secondary'} sx={{ lineHeight: '16px' }}>{label}</Typography>
    <Typography variant={'value'} component={'div'}>{numOrNode(value, how)}</Typography>
  </Stack>)}
</Box>;

// One bar: label, numbers, 6 px. percent overrides value / max for a bar that does not start at zero
// (a Menagerie mission measures from its last claim), and value and max may then be ready-made nodes. barLabel names the
// bar where the label is a node (a name with its i). kind is what numOrNode takes.
const Progress = ({ label, barLabel, value, max, kind = 'amount', percent: fill }) => {
  const percent = fill ?? (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 100);
  return <Stack gap={0.75}>
    <Stack direction={'row'} justifyContent={'space-between'} sx={ROW_SX}>
      <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
      <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{numOrNode(value, kind)} / {numOrNode(max, kind)}</Typography>
    </Stack>
    <LinearProgress variant={'determinate'} value={percent} color={percent >= 100 ? 'success' : 'primary'}
                    aria-label={barLabel ?? (typeof label === 'string' ? label : undefined)}
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
// notation divides by 1e18 per tier), so each amount carries its own tier's sprite. needBelow keeps "need X more" on a
// line of its own, so only the amounts set the width a narrow column has to leave the cost.
const Cost = ({ icon, iconAlt = '', need, have, game = 'Big', format, needBelow }) => {
  const known = typeof have === 'number';
  const short = known && have < need;
  const perAmount = typeof icon === 'function';
  const amount = (value) => <>
    {format ? format(value) : <Num value={value} game={game} whole/>}
    {perAmount ? <GameIcon src={icon(value)} size={16} alt={iconAlt}/> : null}
  </>;
  const amounts = <>
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
  </>;
  // Under one whole unit of gap there's no amount to name: "need 0 more" on Spelunking's first upgrade, which costs 0.18
  const needLine = short && need - have >= 1 ? <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
    need {amount(need - have)} more
  </Typography> : null;
  return needBelow
    ? <Stack gap={0.5}><Stack direction={'row'} alignItems={'center'} gap={1}>{amounts}</Stack>{needLine}</Stack>
    : <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>{amounts}{needLine}</Stack>;
};

ItemCard.TitleLink = TitleLink;
ItemCard.Desc = Desc;
ItemCard.Facts = Facts;
ItemCard.Stats = Stats;
ItemCard.Progress = Progress;
ItemCard.Section = Section;
ItemCard.Cost = Cost;

export default ItemCard;
