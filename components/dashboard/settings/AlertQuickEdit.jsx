import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { prefix } from '@utility/helpers';
import { optionExtras } from '@utility/dashboard/settingsModel';
import NumberField from '@components/common/NumberField';
import { Help, OptionNumberField, optionNumber, Picker, ToggleChips } from './OptionRow';
import LetterBadge from './LetterBadge';
import AppDialog from '@components/common/Overlays/AppDialog';

const TAB_LABELS = { characters: 'Characters', timers: 'Timers' };
const ROW = { mr: 0, minHeight: { xs: 44, sm: 'auto' } };

const Check = ({ label, checked, disabled = false, onChange }) => <FormControlLabel
  sx={ROW}
  label={<Typography variant="body2">{label}</Typography>}
  control={<Checkbox size="small" checked={Boolean(checked)} disabled={disabled} onChange={onChange}
                     inputProps={{ 'aria-label': label }}/>}/>;

const OptionCheck = ({ option, tracker, label, disabled, onAction }) => <Check
  label={label ?? option.label} checked={option.checked} disabled={disabled}
  onChange={() => onAction('toggleOption', tracker, option.name)}/>;

// The popover shows one alert, so its on/off is the same checkbox whether it maps to the tracker or an option.
const TrackerToggle = ({ tracker, onAction }) => <Check label="Show this alert" checked={tracker.on}
                                                        onChange={() => onAction('toggleTracker', tracker)}/>;

const WorldRow = ({ row, option, tracker, disabled, onAction }) => {
  if (!row.overridden) {
    return <Button size="small" disabled={disabled} sx={{ alignSelf: 'flex-start', minHeight: { xs: 44, sm: 'auto' } }}
                   onClick={() => onAction('setPerWorld', tracker, option.name, row.world, String(option.props.value))}>
      Set a value for World {row.world} only
    </Button>;
  }
  return <Stack direction="row" alignItems="center" gap={1}>
    {/* Clearing it while typing keeps the override; leaving it empty drops it. */}
    <NumberField label={`World ${row.world} value`} ariaLabel={`World ${row.world} value`} disabled={disabled} sx={{ width: 140 }}
                 value={optionNumber(row.value)} min={option.props.minValue} max={option.props.maxValue} help={false}
                 onChange={(next) => next != null && onAction('setPerWorld', tracker, option.name, row.world, String(next))}
                 onCommit={(next) => next == null && onAction('setPerWorld', tracker, option.name, row.world, '')}/>
    <Button size="small" disabled={disabled} sx={{ minHeight: { xs: 44, sm: 'auto' } }}
            onClick={() => onAction('setPerWorld', tracker, option.name, row.world, '')}>
      Use main value
    </Button>
  </Stack>;
};

const Dependents = ({ quickEdit, onAction }) => quickEdit.dependents.map((dependent) => {
  const locked = !quickEdit.option.checked;
  return <Box key={dependent.name} sx={{ pl: 3 }}>
    <OptionCheck option={dependent} tracker={quickEdit.tracker} disabled={locked} onAction={onAction}/>
    {dependent.type === 'input'
      ? <OptionNumberField option={dependent} tracker={quickEdit.tracker} onAction={onAction} disabled={locked || !dependent.checked}/>
      : null}
    {locked ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      Turn on {quickEdit.option.label} to use this.
    </Typography> : null}
  </Box>;
});

const Folded = ({ quickEdit, onAction, disabled }) => quickEdit.folded.map((folded) => <Box key={folded.name}>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>{folded.label}</Typography>
  {folded.type === 'array' ? <ToggleChips option={folded} tracker={quickEdit.tracker} onAction={onAction} disabled={disabled}/> : null}
</Box>);

const Body = ({ quickEdit, onAction }) => {
  const { kind, tracker, option, parent, items, worlds, trackerSwitch } = quickEdit;
  if (kind === 'tracker') {
    return <>
      <TrackerToggle tracker={tracker} onAction={onAction}/>
      {option?.type === 'input' ? <OptionNumberField option={option} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${option.label}`}/> : null}
      <Help text={option?.help} clamp={false}/>
    </>;
  }
  const { disabledReason } = optionExtras(tracker, option);
  const locked = Boolean(disabledReason);
  // On an alert about one item, the option checkbox would turn off the alert for every item, so
  // only its Watch checkbox shows; the whole-option checkbox stays in the full settings.
  const first = trackerSwitch
    ? <TrackerToggle tracker={tracker} onAction={onAction}/>
    : kind === 'pickerItems'
      ? null
      : <OptionCheck option={option} tracker={tracker} label="Show this alert" disabled={locked} onAction={onAction}/>;
  return <>
    {parent ? <OptionCheck option={parent} tracker={tracker} onAction={onAction}/> : null}
    {first ? <Box sx={parent ? { pl: 3 } : undefined}>{first}</Box> : null}
    {disabledReason ? <Typography variant="body2" color="text.secondary">{disabledReason}</Typography> : null}
    {kind === 'threshold' || kind === 'perWorld'
      ? <Stack gap={0.5}>
        {kind === 'perWorld' ? <Typography variant="caption" color="text.secondary">Main value</Typography> : null}
        <OptionNumberField option={option} tracker={tracker} onAction={onAction} disabled={locked || !option.checked}/>
      </Stack> : null}
    {kind === 'perWorld' ? <Stack gap={1}>
      {worlds.map((row) => <WorldRow key={row.world} row={row} option={option} tracker={tracker} onAction={onAction}
                                     disabled={locked || !option.checked}/>)}
    </Stack> : null}
    {kind === 'picker' ? <Picker option={option} tracker={tracker} onAction={onAction} disabled={locked}/> : null}
    {kind === 'pickerItems' ? items.map((item) => <Check key={item.key} label={`Watch ${item.label}`} checked={item.on} disabled={locked}
                                                         onChange={() => onAction('togglePickerItem', tracker, option.name, item.key)}/>) : null}
    <Folded quickEdit={quickEdit} onAction={onAction} disabled={locked}/>
    <Help text={option.help} clamp={false}/>
    <Dependents quickEdit={quickEdit} onAction={onAction}/>
  </>;
};

const AlertQuickEdit = ({ quickEdit, open, iconSrc = null, pageHref = null, onClose, onExited, onAction, onOpenAll, onUndo }) => {
  if (!quickEdit) return null;
  const { tracker, option, kind, everyCharacter, configType } = quickEdit;
  // The title is the alert that was clicked; the subtitle says where it lives in the settings.
  const title = kind === 'tracker' || !option ? tracker.label : option.label;
  const where = [TAB_LABELS[configType], tracker.section, title === tracker.label ? null : tracker.label].filter(Boolean).join(' · ');
  const icon = iconSrc || tracker.icon
    ? <img src={iconSrc ?? `${prefix}${tracker.icon}.png`} alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
    : <LetterBadge label={tracker.label} size={24} radius={1}/>;
  return <AppDialog open={open} onClose={onClose} onExited={onExited} size="s" title={title} subtitle={where || null} icon={icon}>
    <Stack gap={1.5}>
      {pageHref ? <Button component={NextLink} href={pageHref} variant="outlined" size="small"
                          sx={{
                            alignSelf: 'flex-start', flexShrink: 0, whiteSpace: 'nowrap',
                            // Stays compact on a phone, but the tap area still reaches the 44px the other controls get.
                            '&::after': { content: '""', position: 'absolute', inset: { xs: '-7px 0', sm: 0 } }
                          }}>
        {quickEdit.page.label}<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, whiteSpace: 'pre' }}> page</Box>&nbsp;→
      </Button> : null}
      <Stack gap={1.5}>
        <Body quickEdit={quickEdit} onAction={onAction}/>
      </Stack>
      {everyCharacter ? <Typography variant="caption" color="text.secondary">Applies to every character</Typography> : null}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap"
             sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Saved</Typography>
          {/* Always in its slot, greyed until there is a change: appearing later grew the dialog and moved the checkbox under the pointer. */}
          <Button size="small" sx={{ minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} disabled={!onUndo} onClick={onUndo}>Undo</Button>
        </Stack>
        <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onOpenAll}>All {tracker.label} settings</Button>
      </Stack>
    </Stack>
  </AppDialog>;
};

export default AlertQuickEdit;
