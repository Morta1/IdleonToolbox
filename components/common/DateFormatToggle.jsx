import { useContext } from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { PreferencesContext } from '@components/common/context/PreferencesProvider';
import { buildFormatString } from '@hooks/useFormatDate';
import { format } from 'date-fns';

const DateFormatToggle = () => {
  const { dateOrder, setDateOrder, timeFormat, setTimeFormat } = useContext(PreferencesContext);

  const preview = format(new Date(), buildFormatString({ dateOrder, timeFormat }));

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">Date format</Typography>
        <ToggleButtonGroup
          value={dateOrder}
          exclusive
          onChange={(_, val) => { if (val) setDateOrder(val); }}
          size="small"
        >
          <ToggleButton value="DMY">DD/MM</ToggleButton>
          <ToggleButton value="MDY">MM/DD</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">Time format</Typography>
        <ToggleButtonGroup
          value={timeFormat}
          exclusive
          onChange={(_, val) => { if (val) setTimeFormat(val); }}
          size="small"
        >
          <ToggleButton value="24h">24h</ToggleButton>
          <ToggleButton value="12h">12h</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Preview: {preview}
      </Typography>
    </Stack>
  );
};

export default DateFormatToggle;
