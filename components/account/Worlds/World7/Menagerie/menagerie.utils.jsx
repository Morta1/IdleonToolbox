import { Typography } from '@mui/material';
import { IconCheck, IconCoins, IconLock } from '@tabler/icons-react';
import { commaNotation, notateNumber } from '@utility/helpers';

export const LUMI_ICON = 'data/LumiJel.png';
export const SHELL_ICON = 'data/MenaShell1.png';

export const formatLumi = (value) => 1e6 > value ? commaNotation(Math.floor(value)) : notateNumber(value, 'Big');

const STATUS = {
  claimable: { label: 'Claimable', color: 'success.main', Icon: IconCheck },
  owned: { label: 'Owned', color: 'success.main', Icon: IconCheck },
  affordable: { label: 'Affordable', color: 'info.main', Icon: IconCoins },
  locked: { label: 'Locked', color: 'text.secondary', Icon: IconLock }
};

// One status word with its icon, colored by its status role (same caption pattern as Minehead Opponents)
export const StatusText = ({ status }) => {
  const { label, color, Icon } = STATUS[status] ?? {};
  if (!label) return null;
  return <Typography variant={'caption'} component={'span'} color={color}
                     sx={{ display: 'inline-flex', alignItems: 'center', gap: .5 }}>
    <Icon size={14} stroke={2}/>
    {label}
  </Typography>;
};
