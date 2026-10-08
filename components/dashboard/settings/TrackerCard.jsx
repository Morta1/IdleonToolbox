import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NextLink from 'next/link';
import { prefix } from '@utility/helpers';
import { optionExtras } from '@utility/dashboard/settingsModel';
import EditedTag from './EditedTag';
import OptionRow, { NumberField } from './OptionRow';
import { useHighlightTarget } from './useHighlightTarget';
import LetterBadge from './LetterBadge';

const TrackerIcon = ({ tracker }) => tracker.icon
  ? <img src={`${prefix}${tracker.icon}.png`} alt="" width={28} height={28} style={{ objectFit: 'contain', opacity: tracker.on ? 1 : 0.4 }}/>
  : <LetterBadge label={tracker.label} size={28} radius={1.5} sx={{ opacity: tracker.on ? 1 : 0.4 }}/>;

const TrackerLink = ({ tracker }) => tracker.link
  ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
    {tracker.link.text} <Link component={NextLink} href={tracker.link.href}>{tracker.link.label}</Link>
  </Typography>
  : null;

const TrackerSwitch =({ tracker, onAction }) => <Switch
  checked={tracker.on}
  onChange={() => onAction('toggleTracker', tracker)}
  inputProps={{ 'aria-label': `${tracker.label} alerts` }}
  sx={{
    flexShrink: 0,
    height: { xs: 44, sm: 38 },
    py: { xs: '15px', sm: '12px' },
    '& .MuiSwitch-switchBase': { top: 0, height: { xs: 44, sm: 'auto' }, py: { xs: '12px', sm: '9px' } }
  }}/>;

export const CompactRow = ({ tracker, highlight = false, highlightKey = null, onAction }) => {
  const [ref, highlighted] = useHighlightTarget(highlight, highlightKey);
  return <Paper ref={ref} variant="outlined" data-highlighted={highlighted ? 'true' : undefined} sx={{
    display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1, minHeight: 52,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper'
  }}>
    <TrackerSwitch tracker={tracker} onAction={onAction}/>
    <TrackerIcon tracker={tracker}/>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight={500}>
        {tracker.label}{tracker.edited ? <EditedTag/> : null}
      </Typography>
      {tracker.options[0] || tracker.unit
        ? <Typography variant="caption" color="text.secondary">{tracker.options[0]?.label ?? tracker.unit}</Typography> : null}
      <TrackerLink tracker={tracker}/>
    </Box>
    {tracker.edited ? <Button size="small" sx={{ minHeight: { xs: 44 } }} onClick={() => onAction('resetPath', tracker.path)}>Reset</Button> : null}
  </Paper>;
};

const OptionList = ({ tracker, highlightOption, highlightKey, onAction }) => {
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
    return <React.Fragment key={option.name}>
      {heading ? <Typography variant="overline" color="text.secondary" component="h3" sx={{ mt: 2 }}>{heading}</Typography> : null}
      <OptionRow option={option} tracker={tracker} onAction={onAction} {...optionExtras(tracker, option)}
                 highlight={highlightOption === option.name} highlightKey={highlightKey}/>
    </React.Fragment>;
  });
};

// A card expands only when it has options beyond the one shown inline in its header.
export const hasOptionsBody = (tracker) => tracker.options.length > (tracker.inline && tracker.options.some(({ name }) => name === tracker.inline) ? 1 : 0);

const TrackerCard = ({ tracker, expanded, onToggleExpanded, highlightOption = null, highlight = false, highlightKey = null, onAction }) => {
  // The inline number sits in the header, so a deep link to it lands on the card itself.
  const [ref, highlighted] = useHighlightTarget(highlight && (!highlightOption || highlightOption === tracker.inline), highlightKey);
  const inline = tracker.inline ? tracker.options.find(({ name }) => name === tracker.inline) : null;
  const hasBody = hasOptionsBody(tracker);
  return <Paper ref={ref} variant="outlined" data-highlighted={highlighted ? 'true' : undefined} sx={{ transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper' }}>
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1, py: 1, minHeight: 56, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      <TrackerSwitch tracker={tracker} onAction={onAction}/>
      <TrackerIcon tracker={tracker}/>
      <Box sx={{ minWidth: 0, flex: '1 1 140px' }}>
        <Typography variant="body1" fontWeight={500}>
          {tracker.label}{tracker.edited ? <EditedTag/> : null}
        </Typography>
        {/* "1 of 1 options on" says nothing, so a lone option names itself instead. */}
        {!tracker.paired
          ? <Typography variant="caption" color="text.secondary">
            {tracker.total === 1
              ? tracker.options.find(({ foldInto }) => !foldInto)?.label
              : `${tracker.onCount} of ${tracker.total} options on`}
          </Typography>
          // A lone inline number has no row of its own, so its help says here what the number means.
          : inline?.help ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{inline.help}</Typography> : null}
        <TrackerLink tracker={tracker}/>
        {/* On a phone a Reset beside the chevron pushed the chevron onto a row of its own, so there it sits under the title. */}
        {tracker.edited ? <Box><Button size="small" sx={{ display: { xs: 'inline-flex', sm: 'none' }, minWidth: 0, px: 0, minHeight: 36 }}
                                       onClick={() => onAction('resetPath', tracker.path)}>Reset</Button></Box> : null}
      </Box>
      {inline ? <NumberField option={inline} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${inline.label}`}
                             hideReset={tracker.paired}/> : null}
      {tracker.edited ? <Button size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} onClick={() => onAction('resetPath', tracker.path)}>Reset</Button> : null}
      {hasBody
        ? <IconButton aria-label={`${expanded ? 'Hide' : 'Show'} ${tracker.label} options`} aria-expanded={expanded}
                      onClick={onToggleExpanded} sx={{ width: 44, height: 44 }}>
          {expanded ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </IconButton> : null}
    </Stack>
    {expanded && hasBody ? <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pl: { sm: 8 }, borderTop: 1, borderColor: 'divider' }}>
      {!tracker.on ? <Typography variant="body2" sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
        {tracker.label} alerts are off. These options are kept and still editable: they apply when you turn it back on.
      </Typography> : null}
      <OptionList tracker={tracker} highlightOption={highlightOption} highlightKey={highlightKey} onAction={onAction}/>
    </Box> : null}
  </Paper>;
};

export default TrackerCard;
