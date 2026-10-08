import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { optionExtras } from '@utility/dashboard/settingsModel';
import OptionRow from './OptionRow';
import TrackerCard, { CompactRow } from './TrackerCard';

const groupKey = ({ tab, section }) => [tab.label, section.section ? section.label : null].filter(Boolean).join(' · ');

const SearchResults = ({ results, query, onAction, onShow }) => {
  if (!results.length) {
    return <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography fontWeight={500}>{`No alerts match "${query}"`}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        Searched names, options and descriptions in all three tabs.
      </Typography>
    </Box>;
  }
  const groups = results.reduce((acc, result) => {
    const key = groupKey(result);
    (acc[key] ??= []).push(result);
    return acc;
  }, {});
  return <Stack gap={1.25}>
    {Object.entries(groups).map(([key, items]) => <Stack key={key} gap={1}>
      <Typography variant="overline" color="text.secondary">{key}</Typography>
      {items.map((result) => <Paper key={result.option?.path ?? result.tracker.path} variant="outlined" sx={{ p: 1.5 }}>
        {/* The link shares the breadcrumb's row so the result itself gets the full width (a phone squeezed it). */}
        <Stack direction="row" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>{key} › {result.tracker.label}</Typography>
          <Button size="small" sx={{ whiteSpace: 'nowrap', minHeight: { xs: 44, sm: 30 } }} onClick={() => onShow(result)}>
            Show in {result.section.label}
          </Button>
        </Stack>
        {result.option
          ? <OptionRow option={result.option} tracker={result.tracker} onAction={onAction} {...optionExtras(result.tracker, result.option)}/>
          : result.tracker.inline
            ? <TrackerCard tracker={result.tracker} expanded={false} onToggleExpanded={() => {}} onAction={onAction}/>
            : <CompactRow tracker={result.tracker} onAction={onAction}/>}
      </Paper>)}
    </Stack>)}
  </Stack>;
};

export default SearchResults;
