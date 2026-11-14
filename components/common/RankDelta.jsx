import { styled } from '@mui/material/styles';
import { IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import { formatNum } from '@utility/helpers';

// A plain element styled once: the guilds table mounts hundreds of them at a time.
const Root = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  color: (theme.vars || theme).palette.text.success,
  '&[data-fell]': { color: (theme.vars || theme).palette.text.error },
  '&[data-caption]': { ...theme.typography.caption, fontWeight: 500 }
}));

// A rank's move: a caret and how many places. delta > 0 is up (a better rank). The caret is the sign, so the colour is
// never alone. caption: the caption type size, for a move beside a name in a row.
const RankDelta = ({ delta, suffix = '', caption = false }) => (
  <Root data-fell={delta < 0 ? '' : undefined} data-caption={caption ? '' : undefined}>
    {delta > 0 ? <IconCaretUpFilled size={caption ? 14 : '1.2em'} aria-label="Up"/> : <IconCaretDownFilled size={caption ? 14 : '1.2em'} aria-label="Down"/>}
    {formatNum(Math.abs(delta), 'whole')}{suffix}
  </Root>
);

export default RankDelta;
