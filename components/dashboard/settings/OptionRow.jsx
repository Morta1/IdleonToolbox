import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CheckIcon from '@mui/icons-material/Check';
import { prefix } from '@utility/helpers';
import { clampValue } from '@utility/dashboard/settingsActions';
import EditedTag from './EditedTag';
import { useHighlightTarget } from './useHighlightTarget';

const HELP_CLAMP = 90;
const WORLDS = [1, 2, 3, 4, 5, 6, 7];

const Help = ({ text }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > HELP_CLAMP;
  return <Box>
    <Typography variant="body2" color="text.secondary" sx={long && !open
      ? { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
      : undefined}>{text}</Typography>
    {long ? <Button size="small" sx={{ p: 0, minWidth: 0 }} aria-expanded={open} onClick={() => setOpen(!open)}>
      {open ? 'Less' : 'More'}
    </Button> : null}
  </Box>;
};

const outOfRange = (option) => {
  const value = option.props?.value;
  if (value === '' || value === undefined || Number.isNaN(Number(value))) return false;
  const { minValue, maxValue } = option.props;
  return (minValue !== undefined && Number(value) < minValue) || (maxValue !== undefined && Number(value) > maxValue);
};

const rangeText = ({ minValue, maxValue }) => {
  if (minValue !== undefined && maxValue !== undefined) return `Allowed ${minValue} to ${maxValue}`;
  if (minValue !== undefined) return `At least ${minValue}`;
  return maxValue !== undefined ? `At most ${maxValue}` : '';
};

export const NumberField = ({ option, tracker, onAction, ariaLabel }) => {
  const error = outOfRange(option);
  return <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
    <TextField
      size="small"
      type="number"
      value={option.props.value ?? ''}
      error={error}
      sx={{ width: 120 }}
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel ?? option.label, min: option.props.minValue, max: option.props.maxValue },
        input: { endAdornment: option.unit ? <InputAdornment position="end">{option.unit}</InputAdornment> : null }
      }}
      onChange={(e) => onAction('setOptionValue', tracker, option.name, e.target.value)}
      onBlur={(e) => {
        const clamped = clampValue(option, e.target.value);
        if (clamped !== e.target.value) onAction('setOptionValue', tracker, option.name, clamped);
      }}/>
    {option.edited ? <Stack direction="row" alignItems="center" gap={0.75}>
      <Typography variant="caption" color="text.secondary">Default {String(option.defaultValue)} ·</Typography>
      <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => onAction('resetPath', option.path)}>Reset</Button>
    </Stack> : null}
    {error ? <Typography variant="caption" color="error" role="alert">{rangeText(option.props)}</Typography> : null}
  </Stack>;
};

const PickerTiles = ({ option, tracker, onAction }) => {
  const entries = Object.entries(option.props.value ?? {});
  const onCount = entries.filter(([, on]) => on).length;
  return <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
    {entries.map(([key, on]) => <ButtonBase key={key} aria-label={key.camelToTitleCase?.() ?? key} aria-pressed={on}
                                            onClick={() => onAction('togglePickerItem', tracker, option.name, key)}
                                            sx={{
                                              width: 44, height: 44, borderRadius: 2, position: 'relative',
                                              border: 1, borderColor: on ? 'primary.main' : 'divider',
                                              bgcolor: on ? 'action.selected' : 'transparent'
                                            }}>
      <img src={`${prefix}data/${key}.png`} alt="" width={28} height={28}
           style={{ objectFit: 'contain', opacity: on ? 1 : 0.3, filter: on ? 'none' : 'grayscale(1)' }}/>
      {on ? <Box component="span" sx={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckIcon sx={{ fontSize: 10, color: 'background.default' }}/>
      </Box> : null}
    </ButtonBase>)}
    <Typography variant="caption" color="text.secondary">{onCount}/{entries.length}</Typography>
    <Button size="small" sx={{ minWidth: 0 }} onClick={() => onAction('setPickerAll', tracker, option.name, true)}>All</Button>
    <Button size="small" sx={{ minWidth: 0 }} onClick={() => onAction('setPickerAll', tracker, option.name, false)}>None</Button>
  </Stack>;
};

const ToggleChips = ({ option, tracker, onAction }) => <Stack direction="row" gap={1} flexWrap="wrap">
  {Object.entries(option.props.value ?? {}).map(([key, on]) => <Button key={key} size="small" aria-pressed={on}
                                                                       variant={on ? 'contained' : 'outlined'}
                                                                       color={on ? 'primary' : 'inherit'}
                                                                       startIcon={on ? <CheckIcon/> : null}
                                                                       sx={{ textTransform: 'none', minHeight: 32 }}
                                                                       onClick={() => onAction('togglePickerItem', tracker, option.name, key)}>
    {key.camelToTitleCase && /^[a-z]/.test(key) ? key.camelToTitleCase() : key}
  </Button>)}
</Stack>;

const PerWorld = ({ option, tracker, onAction, disabled }) => {
  const [open, setOpen] = useState(false);
  const perWorld = option.props.perWorld ?? {};
  const overrides = WORLDS.filter((world) => perWorld[world] != null && perWorld[world] !== '');
  return <Box sx={{ mt: 1 }}>
    <Stack direction="row" alignItems="center" gap={1.5}>
      <Button size="small" sx={{ p: 0, minWidth: 0 }} disabled={disabled} aria-expanded={open} onClick={() => setOpen(!open)}>Per world</Button>
      <Typography variant="caption" color="text.secondary">
        {overrides.length ? `${overrides.length} override${overrides.length > 1 ? 's' : ''}: ${overrides.map((w) => `W${w} ${perWorld[w]}`).join(', ')}` : 'No overrides'}
      </Typography>
    </Stack>
    {open && !disabled ? <Box sx={{ mt: 1 }}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {WORLDS.map((world) => <TextField key={world} size="small" type="number" label={`W${world}`}
                                          value={perWorld[world] ?? ''} placeholder={String(option.props.value)}
                                          sx={{ width: 64 }}
                                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-label': `World ${world} value` } }}
                                          onChange={(e) => onAction('setPerWorld', tracker, option.name, world, e.target.value)}/>)}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Leave a world blank to use {String(option.props.value)} · <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => onAction('clearPerWorld', tracker, option.name)}>Clear overrides</Button>
      </Typography>
    </Box> : null}
  </Box>;
};

const OptionRow = ({ option, tracker, foldedOptions = [], disabledReason = null, highlight = false, onAction }) => {
  const [rowRef, highlighted] = useHighlightTarget(highlight);
  const disabled = Boolean(disabledReason);
  const isPicker = option.type === 'array';
  return <Box ref={rowRef} sx={{
    display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', columnGap: 1, py: 1,
    borderBottom: 1, borderColor: 'divider', borderRadius: 1,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'transparent'
  }}>
    <Checkbox size="small" checked={Boolean(option.checked)} disabled={disabled} sx={{ p: 0.5, alignSelf: 'start' }}
              inputProps={{ 'aria-label': option.label }}
              onChange={() => onAction('toggleOption', tracker, option.name)}/>
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={2} rowGap={1}>
        <Typography variant="body2" fontWeight={500}>
          {option.label}{option.edited ? <EditedTag/> : null}
        </Typography>
        {option.type === 'input' ? <Box sx={{ ml: { sm: 'auto' } }}><NumberField option={option} tracker={tracker} onAction={onAction}/></Box> : null}
      </Stack>
      {disabledReason ? <Typography variant="body2" color="text.secondary">{disabledReason}</Typography> : null}
      <Help text={option.help}/>
      {isPicker ? <Box sx={{ mt: 1 }}>
        {option.props?.type === 'img'
          ? <PickerTiles option={option} tracker={tracker} onAction={onAction}/>
          : <ToggleChips option={option} tracker={tracker} onAction={onAction}/>}
      </Box> : null}
      {option.type === 'input' && option.props?.perWorld
        ? <PerWorld option={option} tracker={tracker} onAction={onAction} disabled={!option.checked}/> : null}
      {foldedOptions.map((folded) => <Box key={folded.name} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{folded.label}</Typography>
        {folded.type === 'array'
          ? <ToggleChips option={folded} tracker={tracker} onAction={onAction}/>
          : <Help text={folded.help}/>}
        <Help text={folded.type === 'array' ? folded.help : null}/>
      </Box>)}
    </Box>
  </Box>;
};

export default OptionRow;
