import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { prefix } from '@utility/helpers';
import EditedTag, { OffTag } from './EditedTag';
import OptionRow, { NumberField } from './OptionRow';
import { useHighlightTarget } from './useHighlightTarget';

const TrackerIcon = ({ tracker }) => tracker.icon
  ? <img src={`${prefix}${tracker.icon}.png`} alt="" width={28} height={28} style={{ objectFit: 'contain', opacity: tracker.on ? 1 : 0.4 }}/>
  : <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'action.hover', flexShrink: 0, opacity: tracker.on ? 1 : 0.4 }}/>;

const TrackerSwitch = ({ tracker, onAction }) => <Switch
  checked={tracker.on}
  onChange={() => onAction('toggleTracker', tracker)}
  inputProps={{ 'aria-label': `${tracker.label} alerts` }}
  sx={{
    flexShrink: 0,
    height: { xs: 44, sm: 38 },
    py: { xs: '15px', sm: '12px' },
    '& .MuiSwitch-switchBase': { top: { xs: 3, sm: 0 } }
  }}/>;

export const CompactRow = ({ tracker, highlight = false, onAction }) => {
  const [ref, highlighted] = useHighlightTarget(highlight);
  return <Paper ref={ref} variant="outlined" sx={{
    display: 'flex', alignItems: 'center', gap: 1.5, px: 1, minHeight: 52,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper'
  }}>
    <TrackerSwitch tracker={tracker} onAction={onAction}/>
    <TrackerIcon tracker={tracker}/>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight={500}>
        {tracker.label}{tracker.edited ? <EditedTag/> : null}{!tracker.on ? <OffTag/> : null}
      </Typography>
      {tracker.options[0] || tracker.unit
        ? <Typography variant="caption" color="text.secondary">{tracker.options[0]?.label ?? tracker.unit}</Typography> : null}
    </Box>
    {tracker.edited ? <Button size="small" sx={{ minHeight: { xs: 44 } }} onClick={() => onAction('resetPath', tracker.path)}>Reset</Button> : null}
  </Paper>;
};

const OptionList = ({ tracker, highlightOption, onAction }) => {
  const byName = Object.fromEntries(tracker.options.map((option) => [option.name, option]));
  const unfolded = tracker.options.filter((option) => !option.foldInto && option.name !== tracker.inline);
  // Groups are not contiguous in the saved option order (Royal Guardian lists two Outposts
  // options after the rank caps), so ungrouped options come first, then each group in the
  // order it first appears.
  const groupOrder = [...new Set(unfolded.map(({ group }) => group).filter(Boolean))];
  const visible = [
    ...unfolded.filter(({ group }) => !group),
    ...groupOrder.flatMap((group) => unfolded.filter((option) => option.group === group))
  ];
  let lastGroup = null;
  return visible.map((option) => {
    const heading = option.group && option.group !== lastGroup ? option.group : null;
    if (option.group) lastGroup = option.group;
    const parent = option.dependsOn ? byName[option.dependsOn] : null;
    const disabledReason = parent && !parent.checked ? `Turn on ${parent.label} to use this.` : null;
    return <React.Fragment key={option.name}>
      {heading ? <Typography variant="overline" color="text.secondary" component="h3" sx={{ mt: 2 }}>{heading}</Typography> : null}
      <OptionRow option={option} tracker={tracker} onAction={onAction}
                 foldedOptions={tracker.options.filter(({ foldInto }) => foldInto === option.name)}
                 disabledReason={disabledReason}
                 highlight={highlightOption === option.name}/>
    </React.Fragment>;
  });
};

const TrackerCard = ({ tracker, expanded, onToggleExpanded, highlightOption = null, highlight = false, onAction }) => {
  const [ref, highlighted] = useHighlightTarget(highlight && !highlightOption);
  const inline = tracker.inline ? tracker.options.find(({ name }) => name === tracker.inline) : null;
  return <Paper ref={ref} variant="outlined" sx={{ transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper' }}>
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1, py: 1, minHeight: 56, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      <TrackerSwitch tracker={tracker} onAction={onAction}/>
      <TrackerIcon tracker={tracker}/>
      <Box sx={{ minWidth: 0, flex: '1 1 140px' }}>
        <Typography variant="body1" fontWeight={500}>
          {tracker.label}{tracker.edited ? <EditedTag/> : null}{!tracker.on ? <OffTag kept={tracker.options.length > 0}/> : null}
        </Typography>
        <Typography variant="caption" color="text.secondary">{tracker.onCount} of {tracker.total} options on</Typography>
      </Box>
      {inline ? <NumberField option={inline} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${inline.label}`}/> : null}
      {tracker.edited ? <Button size="small" sx={{ minHeight: { xs: 44 } }} onClick={() => onAction('resetPath', tracker.path)}>Reset</Button> : null}
      {tracker.options.length > (inline ? 1 : 0)
        ? <IconButton aria-label={`${expanded ? 'Hide' : 'Show'} ${tracker.label} options`} aria-expanded={expanded}
                      onClick={onToggleExpanded} sx={{ width: 44, height: 44 }}>
          {expanded ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </IconButton> : null}
    </Stack>
    {expanded ? <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pl: { sm: 8 }, borderTop: 1, borderColor: 'divider' }}>
      {!tracker.on ? <Typography variant="body2" sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
        {tracker.label} alerts are off. These options are kept and still editable: they apply when you turn it back on.
      </Typography> : null}
      <OptionList tracker={tracker} highlightOption={highlightOption} onAction={onAction}/>
    </Box> : null}
  </Paper>;
};

export default TrackerCard;
