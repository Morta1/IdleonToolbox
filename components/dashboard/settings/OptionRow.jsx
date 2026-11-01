import React, { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useViewportSize } from '@mantine/hooks';
import { cleanUnderscore, pascalCase, prefix } from '@utility/helpers';
import { pickerItemLabel } from '@utility/dashboard/quickEdit';
import NumberField, { fieldNumber } from '@components/common/NumberField';
import EditedTag from './EditedTag';
import { useHighlightTarget } from './useHighlightTarget';

const WORLDS = [1, 2, 3, 4, 5, 6, 7];

// Clamped to one line, with More only when the text really overflows it: a fixed length cut-off
// showed More on text that already fit a wide window.
export const Help = ({ text, clamp = true }) => {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);
  // The window sets the line width, so re-measure when the viewport changes.
  const { width } = useViewportSize();
  useEffect(() => {
    if (open || !ref.current) return;
    setOverflows(ref.current.scrollHeight > ref.current.clientHeight + 1);
  }, [width, text, open]);
  if (!text) return null;
  if (!clamp) return <Typography variant="body2" color="text.secondary">{text}</Typography>;
  return <Box>
    <Typography ref={ref} variant="body2" color="text.secondary" sx={open
      ? undefined
      : { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{text}</Typography>
    {overflows || open ? <Button size="small" sx={{ p: 0, minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} aria-expanded={open} onClick={() => setOpen(!open)}>
      {open ? 'Less' : 'More'}
    </Button> : null}
  </Box>;
};

// A tracker's number option on the common NumberField. Options store text; the field reports numbers.
export const optionNumber = (text) => (text === '' || text == null || Number.isNaN(Number(text)) ? null : Number(text));

// hideReset: the card's own Reset already covers it (a number shown inline in the card header), so only "Default N" shows.
export const OptionNumberField = ({ option, tracker, onAction, ariaLabel, disabled = false, hideReset = false }) => <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
  <NumberField
    ariaLabel={ariaLabel ?? option.label}
    value={optionNumber(option.props.value)}
    min={option.props.minValue}
    max={option.props.maxValue}
    defaultValue={option.defaultValue}
    unit={option.unit}
    help={false}
    disabled={disabled}
    // The number gets a fixed width and the field grows with its unit ("attempts" would squeeze a 120 px field to one digit).
    sx={option.unit ? { '& input': { width: '10ch' } } : { width: 140 }}
    // An empty field would hide every alert it gates, so emptying it means the default.
    onChange={(next) => onAction('setOptionValue', tracker, option.name, String(next ?? option.defaultValue ?? ''))}/>
  {option.edited ? <Stack direction="row" alignItems="center" gap={0.75}>
    <Typography variant="caption" color="text.secondary">Default {fieldNumber(option.defaultValue)}{hideReset ? '' : ' ·'}</Typography>
    {hideReset ? null : <Button size="small" sx={{ p: 0, minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} disabled={disabled} onClick={() => onAction('resetPath', option.path)}>Reset</Button>}
  </Stack> : null}
</Stack>;

export const PickerTiles = ({ option, tracker, onAction, disabled }) => {
  const entries = Object.entries(option.props.value ?? {});
  const onCount = entries.filter(([, on]) => on).length;
  // Tiles are icons only, and a phone has no hover: the line under them names the item last
  // hovered, focused or tapped.
  const [named, setNamed] = useState(null);
  return <Stack gap={0.75}>
  <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
    {entries.map(([key, on]) => <ButtonBase key={key} aria-label={pickerItemLabel(key)} aria-pressed={on} disabled={disabled}
                                            onMouseEnter={() => setNamed(key)} onFocus={() => setNamed(key)}
                                            onClick={() => {
                                              setNamed(key);
                                              onAction('togglePickerItem', tracker, option.name, key);
                                            }}
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
    <Button size="small" sx={{ minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} disabled={disabled} onClick={() => onAction('setPickerAll', tracker, option.name, true)}>All</Button>
    <Button size="small" sx={{ minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} disabled={disabled} onClick={() => onAction('setPickerAll', tracker, option.name, false)}>None</Button>
  </Stack>
    <Typography variant="caption" color="text.secondary" aria-live="polite">
      {named ? `${pickerItemLabel(named)}: ${option.props.value?.[named] ? 'watched' : 'not watched'}` : 'Hover or tap an item to see its name'}
    </Typography>
  </Stack>;
};

export const ToggleChips = ({ option, tracker, onAction, disabled }) => <Stack direction="row" gap={1} flexWrap="wrap">
  {Object.entries(option.props.value ?? {}).map(([key, on]) => <Button key={key} size="small" aria-pressed={on} disabled={disabled}
                                                                       variant={on ? 'contained' : 'outlined'}
                                                                       color={on ? 'primary' : 'inherit'}
                                                                       startIcon={on ? <CheckIcon/> : null}
                                                                       sx={{ minHeight: { xs: 44, sm: 32 } }}
                                                                       onClick={() => onAction('togglePickerItem', tracker, option.name, key)}>
    {option.itemIcons?.[key]
      ? <img src={`${prefix}${option.itemIcons[key]}.png`} alt="" width={20} height={20}
             style={{ objectFit: 'contain', marginRight: 6, opacity: on ? 1 : 0.5 }}/> : null}
    {key.camelToTitleCase && /^[a-z]/.test(key) ? key.camelToTitleCase() : key}
  </Button>)}
</Stack>;

const searchLabel = (key) => cleanUnderscore(pascalCase(key));

// For catalogs too long to show as tiles or chips: search to switch an item on, and only the ones
// on are listed, each with its own remove button.
export const SearchPicker = ({ option, tracker, onAction, disabled }) => {
  const entries = Object.entries(option.props.value ?? {});
  const on = entries.filter(([, checked]) => checked).map(([key]) => key);
  const icon = (key) => option.props.icons?.[key]
    ? <img src={`${prefix}${option.props.icons[key]}.png`} alt="" width={20} height={20} style={{ objectFit: 'contain' }}/>
    : null;
  return <Stack gap={1}>
    <Autocomplete size="small" disabled={disabled} sx={{ maxWidth: 320 }}
                  options={entries.filter(([, checked]) => !checked).map(([key]) => key)}
                  getOptionLabel={searchLabel}
                  value={null} blurOnSelect clearOnBlur
                  onChange={(_, key) => key && onAction('togglePickerItem', tracker, option.name, key)}
                  renderOption={({ key: _key, ...props }, key) => <Box component="li" key={key} {...props} sx={{ gap: 1 }}>
                    {icon(key)}{searchLabel(key)}
                  </Box>}
                  renderInput={(params) => <TextField {...params} placeholder="Search to add"
                                                      slotProps={{ htmlInput: { ...params.inputProps, 'aria-label': `Add to ${option.label}` } }}/>}/>
    {on.length ? <Stack direction="row" gap={1} flexWrap="wrap">
      {on.map((key) => <Button key={key} size="small" variant="outlined" color="inherit" disabled={disabled}
                               aria-label={`Remove ${searchLabel(key)}`} endIcon={<CloseIcon/>}
                               sx={{ minHeight: { xs: 44, sm: 32 }, gap: 0.75 }}
                               onClick={() => onAction('togglePickerItem', tracker, option.name, key)}>
        {icon(key)}{searchLabel(key)}
      </Button>)}
    </Stack> : null}
  </Stack>;
};

export const Picker = ({ option, ...props }) => {
  if (option.props?.type === 'img') return <PickerTiles option={option} {...props}/>;
  if (option.props?.type === 'search') return <SearchPicker option={option} {...props}/>;
  return <ToggleChips option={option} {...props}/>;
};

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
        {WORLDS.map((world) => <NumberField key={world} label={`W${world}`} ariaLabel={`World ${world} value`}
                                            value={optionNumber(perWorld[world])} placeholder={String(option.props.value)}
                                            min={option.props.minValue} max={option.props.maxValue} help={false}
                                            sx={{ width: 64 }}
                                            onChange={(next) => onAction('setPerWorld', tracker, option.name, world, next == null ? '' : String(next))}/>)}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Leave a world blank to use {String(option.props.value)} · <Button size="small" sx={{ p: 0, minWidth: 0, minHeight: { xs: 44, sm: 'auto' } }} onClick={() => onAction('clearPerWorld', tracker, option.name)}>Clear overrides</Button>
      </Typography>
    </Box> : null}
  </Box>;
};

// depth: how many dependsOn parents sit above this row; each level indents it under the one before.
const OptionRow = ({ option, tracker, foldedOptions = [], disabledReason = null, depth = 0, highlight = false, highlightKey = null, onAction }) => {
  const [rowRef, highlighted] = useHighlightTarget(highlight, highlightKey);
  const disabled = Boolean(disabledReason);
  const isPicker = option.type === 'array';
  return <Box ref={rowRef} data-highlighted={highlighted ? 'true' : undefined} sx={{
    display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', columnGap: 1, py: 1, ml: depth * 3,
    borderBottom: 1, borderColor: 'divider', borderRadius: 1,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'transparent'
  }}>
    <Checkbox size="small" checked={Boolean(option.checked)} disabled={disabled} sx={{ p: 0.5, alignSelf: 'start', mt: option.type === 'input' ? { sm: '6px' } : 0 }}
              inputProps={{ 'aria-label': option.label }}
              onChange={() => onAction('toggleOption', tracker, option.name)}/>
    <Box sx={{ minWidth: 0 }}>
      {/* The label line shares a center with the checkbox (28 px), or with the 40 px number field
          beside it, where the checkbox moves down to match. */}
      <Stack direction="row" alignItems="flex-start" flexWrap="wrap" columnGap={2} rowGap={1}>
        <Typography variant="body2" fontWeight={500} sx={{ minHeight: option.type === 'input' ? { xs: 28, sm: 40 } : 28, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {option.label}{option.edited ? <EditedTag/> : null}
        </Typography>
        {option.type === 'input' ? <Box sx={{ ml: { sm: 'auto' } }}><OptionNumberField option={option} tracker={tracker} onAction={onAction} disabled={disabled}/></Box> : null}
      </Stack>
      {disabledReason ? <Typography variant="body2" color="text.secondary">{disabledReason}</Typography> : null}
      <Help text={option.help}/>
      {isPicker ? <Box sx={{ mt: 1 }}>
        <Picker option={option} tracker={tracker} onAction={onAction} disabled={disabled}/>
      </Box> : null}
      {option.type === 'input' && option.props?.perWorld
        ? <PerWorld option={option} tracker={tracker} onAction={onAction} disabled={!option.checked || disabled}/> : null}
      {foldedOptions.map((folded) => <Box key={folded.name} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{folded.label}</Typography>
        {folded.type === 'array'
          ? <ToggleChips option={folded} tracker={tracker} onAction={onAction} disabled={disabled}/>
          : <Help text={folded.help}/>}
        <Help text={folded.type === 'array' ? folded.help : null}/>
      </Box>)}
    </Box>
  </Box>;
};

export default OptionRow;
