import { Typography } from '@mui/material';
import Panel from '@components/common/cards/Panel';
import { formatNum } from '@utility/helpers';

const Side = ({ names, label }) => <Panel.KV label={<span style={{ whiteSpace: 'nowrap' }}>{label} ({formatNum(names?.length ?? 0, 'whole')})</span>} value={names?.length ? names.join(', ') : 'None'}/>;

export default function RosterDiff({ joined, left }) {
  if (!joined?.length && !left?.length) {
    return <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.25 }}>No roster changes this week</Typography>;
  }
  return <>
    <Side names={joined} label="Joined"/>
    <Side names={left} label="Left"/>
  </>;
}
