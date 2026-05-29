import { Box, Card, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { numberWithCommas } from '@utility/helpers';
import Sparkline from './Sparkline';

/**
 * StatCard — an ecosystem-level metric: value, optional delta, and a sparkline.
 * Text and sparkline sit side by side on a wide card; the sparkline wraps
 * below the text when the card is too narrow for both.
 *
 * Props:
 *   label         — metric name string
 *   value         — current numeric value (formatted with numberWithCommas)
 *   delta         — change vs the previous period (number | null). null → no delta shown.
 *   history       — chronological array of values for the sparkline (oldest → newest)
 *   caption       — optional extra caption string rendered below the value
 *   goodDirection — 'up' (default) or 'down': which direction is positive for this
 *                   metric. 'down' flips the delta's green/red (e.g. "abandoned"
 *                   counts, where a rising number is bad news).
 *   deltaBelow    — when true, render the delta on its own line below the value
 *                   instead of inline beside it.
 *   deltaLabel    — optional text rendered after the delta (e.g. "vs last week").
 */
export default function StatCard({
  label, value, delta, history, caption, goodDirection = 'up', deltaBelow = false, deltaLabel, hint
}) {
  const muiTheme = useTheme();
  const isFlat = delta === 0;
  const deltaIsGood = goodDirection === 'down' ? delta < 0 : delta > 0;
  const deltaColor = isFlat ? 'text.secondary' : (deltaIsGood ? '#81c784' : '#cf6679');

  const deltaNode = delta == null ? null : (
    <Stack direction="row" alignItems="center" component="span">
      <Stack
        direction="row"
        alignItems="center"
        component="span"
        sx={{ color: deltaColor }}
      >
        {isFlat
          ? <RemoveIcon fontSize="small" sx={{ mr: -0.25, fontSize: 16 }} />
          : delta > 0
            ? <ArrowDropUpIcon fontSize="small" sx={{ mr: -0.25 }} />
            : <ArrowDropDownIcon fontSize="small" sx={{ mr: -0.25 }} />}
        <Typography variant="caption" component="span" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {isFlat ? '0' : numberWithCommas(Math.abs(delta))}
        </Typography>
      </Stack>
      {deltaLabel && (
        <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
          {deltaLabel}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.6}
            >
              {label}
            </Typography>
            {hint && (
              <Tooltip title={hint}>
                <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.6 }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" alignItems="baseline" gap={0.75} sx={{ mt: 0.5 }}>
            <Typography variant="h5" fontWeight={700} lineHeight={1.1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {value != null ? numberWithCommas(value) : '—'}
            </Typography>
            {!deltaBelow && deltaNode}
          </Stack>
          {deltaBelow && deltaNode && (
            <Box sx={{ mt: 0.5 }}>{deltaNode}</Box>
          )}
          {caption && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {caption}
            </Typography>
          )}
        </Box>
        {history && history.length >= 2 && (
          <Box sx={{ flexShrink: 0 }}>
            <Sparkline values={history} width={200} height={56} color={muiTheme.palette.primary.main} />
          </Box>
        )}
      </Box>
    </Card>
  );
}
