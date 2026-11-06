import { useContext } from 'react';
import { Typography } from '@mui/material';
import { IconBolt, IconCheck } from '@tabler/icons-react';
import { NOTICE_TONES } from '@components/common/Notice';
import UpTriangle from '@components/common/UpTriangle';
import { SummaryFailed } from '@components/common/cards/PageSummary';

// Controls board, Status text: a state is a glyph and a word in its color, never a chip and never
// color alone. children replace the default word ("Purchased", "12 unspent"); the look stays.
// info, needs, locked and problem take Notice's glyph and color for the same tone (2c Decision 6), so a
// state never looks different from a notice of its tone; icon replaces the glyph, as Notice's does. Under SummaryFailed it
// prints nothing: a catalog at zero stands in for a save it couldn't read, so "Locked" or "Ready" would be a guess.
const STATUS = {
  maxed: { color: 'text.success', glyph: <IconCheck size={14} stroke={3}/>, word: 'Maxed' },
  // The board's Done group for a state that is not a cap (a won match): the caller names it.
  done: { color: 'text.success', glyph: <IconCheck size={14} stroke={3}/> },
  ready: { color: 'text.success', glyph: '●', word: 'Ready' },
  active: { color: 'text.success', glyph: '●', word: 'Active' },
  // A pick the page recommends (Gaming's fastest palette to level). The board folds "best" ambers into warning.
  best: { color: 'text.warning', glyph: <IconBolt size={14} stroke={2.2}/> },
  // Not capped yet, a tile's can level up triangle and the reason beside it (the Library can still raise a talent).
  up: { color: 'text.secondary', glyph: <UpTriangle/> },
  // A to-do that is not a shortfall (the item planner's Not crafted).
  info: { color: NOTICE_TONES.info.color, glyph: <NOTICE_TONES.info.Glyph size={14} stroke={2.2}/> },
  needs: { color: NOTICE_TONES.missing.color, glyph: <NOTICE_TONES.missing.Glyph size={14} stroke={2.2}/> },
  locked: { color: NOTICE_TONES.locked.color, glyph: <NOTICE_TONES.locked.Glyph size={14} stroke={2.2}/>, word: 'Locked' },
  problem: { color: NOTICE_TONES.error.color, glyph: <NOTICE_TONES.error.Glyph size={14} stroke={2.2}/> },
  selected: { color: 'primary.main' }
};

const StatusText = ({ status, icon: Icon, children, wrap, sx }) => {
  const failed = useContext(SummaryFailed);
  const { color, glyph: toneGlyph, word } = STATUS[status] ?? {};
  const glyph = Icon ? <Icon size={14} stroke={2.2}/> : toneGlyph;
  const label = children ?? word;
  if (failed || label === undefined || label === null || label === '') return null;
  return <Typography component={'span'} variant={'body2'} fontWeight={500} color={color}
                     sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: wrap ? 'normal' : 'nowrap', ...sx }}>
    {glyph ? <span aria-hidden={'true'} style={{ display: 'inline-flex' }}>{glyph}</span> : null}
    {label}
  </Typography>;
};

export default StatusText;
