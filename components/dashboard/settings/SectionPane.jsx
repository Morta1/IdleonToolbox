import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { matchesFilter } from '@utility/dashboard/settingsModel';
import TrackerCard, { CompactRow } from './TrackerCard';

const SectionPane = ({ section, filter, expanded, onToggleExpanded, target, onAction, onBulk, onShowAll, extraTop = null }) => {
  const visible = section.trackers.filter((tracker) => matchesFilter(tracker, filter) || tracker.path === target?.path);
  const compact = visible.filter(({ compact: isCompact }) => isCompact);
  const cards = visible.filter(({ compact: isCompact }) => !isCompact);
  const allOff = section.onCount === 0;
  const buttonSx = { minHeight: { xs: 44, sm: 30 } };
  return <Stack gap={1.25}>
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
      <Box>
        <Typography variant="h6" component="h2">{section.label}</Typography>
        <Typography variant="body2" color="text.secondary">{section.total} alerts · {section.onCount} on</Typography>
      </Box>
      <Stack direction="row" gap={0.5} sx={{ ml: 'auto' }}>
        <Button size="small" color="inherit" sx={buttonSx}
                onClick={() => onBulk(`${section.label} alerts turned ${allOff ? 'on' : 'off'}`, 'setSectionOn', section, allOff)}>
          {allOff ? 'Turn all on' : 'Turn all off'}
        </Button>
        {section.edited ? <Button size="small" color="inherit" sx={buttonSx}
                                  onClick={() => onBulk(`${section.label} reset to defaults`, 'resetPath', section.key)}>
          Reset {section.label}
        </Button> : null}
      </Stack>
    </Stack>
    {extraTop}
    {!visible.length ? <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
      <Typography fontWeight={500}>{filter === 'off' ? `Every ${section.label} alert is on` : `No ${section.label} alerts match this filter`}</Typography>
      <Button sx={{ mt: 1.5, ...buttonSx }} variant="outlined" onClick={onShowAll}>Show all alerts</Button>
    </Paper> : null}
    {compact.length ? <Box sx={{ display: 'grid', gap: 1 }}>
      {compact.map((tracker) => <CompactRow key={tracker.path} tracker={tracker} onAction={onAction}
                                            highlight={target?.path === tracker.path} highlightKey={target}/>)}
    </Box> : null}
    {cards.map((tracker) => <TrackerCard key={tracker.path} tracker={tracker} onAction={onAction}
                                         expanded={Boolean(expanded[tracker.path])}
                                         onToggleExpanded={() => onToggleExpanded(tracker.path)}
                                         highlight={target?.path === tracker.path} highlightKey={target}
                                         highlightOption={target?.path === tracker.path ? target.optionName : null}/>)}
  </Stack>;
};

export default SectionPane;
