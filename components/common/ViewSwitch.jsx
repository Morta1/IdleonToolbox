import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import useTabIndex from '@hooks/useTabIndex';

// A segmented switch: two or three ways to show the same thing, one always on (Tabs board level 3, the
// Toolbar board's View, the Controls board's "Segmented"). options are [value, label] pairs. 32 px in a
// section's title row (size small, the default), 40 in a toolbar (size medium). Four or more tighten on a phone, to hold
// its 320 px row.
const Segmented = ({ options, value, onChange, label = 'View', size = 'small', disabled, sx }) => <ToggleButtonGroup
  exclusive
  size={size}
  disabled={disabled}
  value={value}
  aria-label={label}
  // A click on the pressed option sends null, which is ignored. A value can be 0, so not a falsy test.
  onChange={(event, next) => {
    if (next != null) onChange(next);
  }}
  sx={{
    '& .MuiToggleButton-root': { px: options.length > 3 ? { xs: 1, sm: 1.75 } : 1.75 },
    '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': {
      color: 'primary.main',
      bgcolor: 'primary.soft'
    },
    ...sx
  }}
>
  {options.map(([key, text]) => <ToggleButton key={String(key)} value={key}>{text}</ToggleButton>)}
</ToggleButtonGroup>;

// The view lives in the URL like a tab (?dnt= under a ?nt= tab), so an old link opens the same view.
const QueryViewSwitch = ({ queryKey, options, ...props }) => {
  const values = options.map(([key]) => key);
  const [index, selectTab] = useTabIndex(values, { queryKey });
  return <Segmented {...props} options={options} value={values[index]}
                    onChange={(next) => selectTab(values.indexOf(next))}/>;
};

// With queryKey the switch reads and writes the URL; without it the parent owns value and onChange, and
// the router is never touched (a toolbar's view, a card's preset).
const ViewSwitch = ({ queryKey, ...props }) => (queryKey
  ? <QueryViewSwitch queryKey={queryKey} {...props}/>
  : <Segmented {...props}/>);

export default ViewSwitch;
