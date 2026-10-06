import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { prefix } from '@utility/helpers';
import { optionExtras } from '@utility/dashboard/settingsModel';
import { clampValue } from '@utility/dashboard/settingsActions';
import { Help, NumberField, PickerTiles, ToggleChips } from './OptionRow';
import LetterBadge from './LetterBadge';

const TITLE_ID = 'alert-quick-edit-title';
const ROW = { mr: 0, minHeight: { xs: 44, sm: 'auto' } };

const Check = ({ label, checked, disabled = false, onChange }) => <FormControlLabel
  sx={ROW}
  label={<Typography variant="body2">{label}</Typography>}
  control={<Checkbox size="small" checked={Boolean(checked)} disabled={disabled} onChange={onChange}
                     inputProps={{ 'aria-label': label }}/>}/>;

const OptionCheck = ({ option, tracker, disabled, onAction }) => <Check
  label={option.label} checked={option.checked} disabled={disabled}
  onChange={() => onAction('toggleOption', tracker, option.name)}/>;

const TrackerToggle = ({ tracker, onAction }) => <FormControlLabel
  sx={ROW}
  label={<Typography variant="body2">{tracker.label} alerts</Typography>}
  control={<Switch checked={tracker.on} onChange={() => onAction('toggleTracker', tracker)}
                   inputProps={{ 'aria-label': `${tracker.label} alerts` }}/>}/>;

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
  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{folded.label}</Typography>
  {folded.type === 'array' ? <ToggleChips option={folded} tracker={quickEdit.tracker} onAction={onAction} disabled={disabled}/> : null}
  <Help text={folded.help}/>
</Box>);

const Body = ({ quickEdit, onAction }) => {
  const { kind, tracker, option, parent, items, worlds, trackerSwitch } = quickEdit;
  if (kind === 'tracker') {
    return <>
      <TrackerToggle tracker={tracker} onAction={onAction}/>
      {option?.type === 'input' ? <NumberField option={option} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${option.label}`}/> : null}
    </>;
  }
  const { disabledReason } = optionExtras(tracker, option);
  const locked = Boolean(disabledReason);
  const first = trackerSwitch
    ? <TrackerToggle tracker={tracker} onAction={onAction}/>
    : <OptionCheck option={option} tracker={tracker} disabled={locked} onAction={onAction}/>;
  return <>
    {parent ? <OptionCheck option={parent} tracker={tracker} onAction={onAction}/> : null}
    <Box sx={parent ? { pl: 3 } : undefined}>{first}</Box>
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
    <Help text={option.help}/>
    <Dependents quickEdit={quickEdit} onAction={onAction}/>
  </>;
};

const AlertQuickEdit = ({ quickEdit, open, anchorPosition, iconSrc = null, onClose, onAction, onOpenAll, onUndo }) => {
  if (!quickEdit) return null;
  const { tracker, everyCharacter } = quickEdit;
  return <Popover open={open} onClose={onClose} anchorReference="anchorPosition" anchorPosition={anchorPosition}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      role: 'dialog', 'aria-labelledby': TITLE_ID,
                      sx: { width: 340, maxWidth: 'calc(100vw - 32px)', p: 2 }
                    }
                  }}>
    <Stack gap={1.25}>
      <Stack direction="row" alignItems="center" gap={1}>
        {iconSrc || tracker.icon
          ? <img src={iconSrc ?? `${prefix}${tracker.icon}.png`} alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
          : <LetterBadge label={tracker.label} size={24} radius={1}/>}
        <Typography id={TITLE_ID} variant="subtitle1" component="h2" fontWeight={500}>{tracker.label}</Typography>
      </Stack>
      <Body quickEdit={quickEdit} onAction={onAction}/>
      {everyCharacter ? <Typography variant="caption" color="text.secondary">Applies to every character</Typography> : null}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap"
             sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Saved automatically</Typography>
          {onUndo ? <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onUndo}>Undo</Button> : null}
        </Stack>
        <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onOpenAll}>All {tracker.label} settings</Button>
      </Stack>
    </Stack>
  </Popover>;
};

export default AlertQuickEdit;
