import { Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '../Tooltip';

export default function HeaderWithHint({ label, hint, align = 'left' }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      justifyContent={align === 'right' ? 'flex-end' : 'flex-start'}
    >
      <span>{label}</span>
      <Tooltip title={hint} followCursor={false}>
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Tooltip>
    </Stack>
  );
}
