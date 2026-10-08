import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Drawer from '@mui/material/Drawer';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { prefix } from '@utility/helpers';
import { optionExtras } from '@utility/dashboard/settingsModel';
import { clampValue } from '@utility/dashboard/settingsActions';
import { Help, NumberField, PickerTiles, ToggleChips } from './OptionRow';
import LetterBadge from './LetterBadge';

const TITLE_ID = 'alert-quick-edit-title';
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
  const [draft, setDraft] = useState(null);
  if (!row.overridden) {
    return <Button size="small" disabled={disabled} sx={{ alignSelf: 'flex-start', minHeight: { xs: 44, sm: 'auto' } }}
                   onClick={() => onAction('setPerWorld', tracker, option.name, row.world, String(option.props.value))}>
      Set a value for World {row.world} only
    </Button>;
  }
  return <Stack direction="row" alignItems="center" gap={1}>
    <TextField size="small" type="number" label={`World ${row.world} value`} disabled={disabled} sx={{ width: 140 }}
               value={draft ?? row.value}
               slotProps={{
                 inputLabel: { shrink: true },
                 htmlInput: { 'aria-label': `World ${row.world} value`, min: option.props.minValue, max: option.props.maxValue }
               }}
               onChange={(e) => {
                 setDraft(e.target.value);
                 if (e.target.value !== '') onAction('setPerWorld', tracker, option.name, row.world, e.target.value);
               }}
               onBlur={(e) => {
                 setDraft(null);
                 const clamped = e.target.value === '' ? '' : clampValue(option, e.target.value);
                 if (clamped === '' || clamped !== e.target.value) onAction('setPerWorld', tracker, option.name, row.world, clamped);
               }}/>
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
      ? <NumberField option={dependent} tracker={quickEdit.tracker} onAction={onAction} disabled={locked || !dependent.checked}/>
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
      {option?.type === 'input' ? <NumberField option={option} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${option.label}`}/> : null}
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
        <NumberField option={option} tracker={tracker} onAction={onAction} disabled={locked || !option.checked}/>
      </Stack> : null}
    {kind === 'perWorld' ? <Stack gap={1}>
      {worlds.map((row) => <WorldRow key={row.world} row={row} option={option} tracker={tracker} onAction={onAction}
                                     disabled={locked || !option.checked}/>)}
    </Stack> : null}
    {kind === 'picker'
      ? option.props?.type === 'img'
        ? <PickerTiles option={option} tracker={tracker} onAction={onAction} disabled={locked}/>
        : <ToggleChips option={option} tracker={tracker} onAction={onAction} disabled={locked}/>
      : null}
    {kind === 'pickerItems' ? items.map((item) => <Check key={item.key} label={`Watch ${item.label}`} checked={item.on} disabled={locked}
                                                         onChange={() => onAction('togglePickerItem', tracker, option.name, item.key)}/>) : null}
    <Folded quickEdit={quickEdit} onAction={onAction} disabled={locked}/>
    <Help text={option.help} clamp={false}/>
    <Dependents quickEdit={quickEdit} onAction={onAction}/>
  </>;
};

const isHidden = ({ kind, tracker, option, items, trackerSwitch }) => {
  if (!tracker.on) return true;
  if (kind === 'tracker' || trackerSwitch) return false;
  if (kind === 'pickerItems') return items.every(({ on }) => !on);
  return !option.checked;
};

const AlertQuickEdit = ({ quickEdit, open, anchorPosition, above = false, iconSrc = null, onClose, onAction, onOpenAll, onUndo }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  if (!quickEdit) return null;
  const { tracker, option, kind, everyCharacter, configType } = quickEdit;
  // The title is the alert that was clicked; the subtitle says where it lives in the settings.
  const title = kind === 'tracker' || !option ? tracker.label : option.label;
  const where = [TAB_LABELS[configType], tracker.section, title === tracker.label ? null : tracker.label].filter(Boolean).join(' · ');
  const content = <Stack gap={1.5}>
    <Stack direction="row" alignItems="center" gap={1}>
      {iconSrc || tracker.icon
        ? <img src={iconSrc ?? `${prefix}${tracker.icon}.png`} alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
        : <LetterBadge label={tracker.label} size={24} radius={1}/>}
      <Box sx={{ minWidth: 0 }}>
        <Typography id={TITLE_ID} variant="subtitle1" component="h2" fontWeight={500} sx={{ lineHeight: 1.3 }}>{title}</Typography>
        {where ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{where}</Typography> : null}
      </Box>
    </Stack>
    <Stack gap={1.5}>
      <Body quickEdit={quickEdit} onAction={onAction}/>
    </Stack>
    {/* The popover stays open when its alert is turned off, pinned where the icon was: this says why the icon is gone. */}
    {isHidden(quickEdit) ? <Typography variant="body2" color="text.secondary" role="status"
                                       sx={{ p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
      Hidden from your dashboard. Tick it again to bring it back.
    </Typography> : null}
    {everyCharacter ? <Typography variant="caption" color="text.secondary">Applies to every character</Typography> : null}
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap"
           sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Saved automatically</Typography>
        {onUndo ? <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onUndo}>Undo</Button> : null}
      </Stack>
      <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onOpenAll}>All {tracker.label} settings</Button>
    </Stack>
  </Stack>;
  // A popover beside the icon is too narrow on a phone, so there it slides up from the bottom.
  if (isPhone) {
    return <Drawer anchor="bottom" open={open} onClose={onClose}
                   PaperProps={{
                     role: 'dialog', 'aria-labelledby': TITLE_ID,
                     sx: { p: 2, pb: 'calc(16px + env(safe-area-inset-bottom))', maxHeight: '85vh', borderTopLeftRadius: 12, borderTopRightRadius: 12 }
                   }}>
      <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 1.5 }}/>
      {content}
    </Drawer>;
  }
  return <Popover open={open} onClose={onClose} anchorReference="anchorPosition" anchorPosition={anchorPosition}
                  transformOrigin={{ vertical: above ? 'bottom' : 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      role: 'dialog', 'aria-labelledby': TITLE_ID,
                      sx: { width: 360, maxWidth: 'calc(100vw - 32px)', p: 2 }
                    }
                  }}>
    {content}
  </Popover>;
};

export default AlertQuickEdit;
