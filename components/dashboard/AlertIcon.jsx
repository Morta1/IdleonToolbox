import { Box } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import Tooltip from '@components/Tooltip';
import { useAlertSettingsProps } from '@components/common/context/DashboardSettingsProvider';
import { formatNum } from '@utility/helpers';

// A count in an alert's sentence: "1 trap", "49 traps". many: where adding an s isn't the plural.
export const counted = (count, one, many = `${one}s`) => `${formatNum(count, 'whole')} ${count === 1 ? one : many}`;

const BUTTON_SX = { cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } };

// A dashboard alert or timer icon: its sprite and the game marks it carries, a button that opens its quick edit, which
// leads with the same words (message) a desktop hover previews, so a tap and a keyboard reach them too. look: a state
// the sprite itself shows (a tint, a dim, the salt alerts' edge), never one without words in its message. badge and
// children: what sits on the sprite's corners. label names the icon when its message is not plain text. size: GameIcon's.
// icon: a sprite's path, or a node for art one sprite can't draw (VialArt).
const AlertIcon = ({ configType, target, extra, message, label, icon, alt = '', size = 32, look, badge, maxWidth, children }) => {
  const settings = useAlertSettingsProps(configType, target, extra, message);
  const name = label ?? (typeof message === 'string' ? message : undefined);
  const sprite = <Box component={'span'} {...settings} aria-label={target ? name ?? settings['aria-label'] : undefined}
                      sx={[{ position: 'relative', display: 'inline-flex', borderRadius: 1, flexShrink: 0 }, target && BUTTON_SX]}>
    <Box component={'span'} sx={{ display: 'inline-flex', borderRadius: 1, ...look }}>
      {typeof icon === 'string' ? <GameIcon src={icon} size={size} alt={alt}/> : icon}
    </Box>
    {badge}
    {children}
  </Box>;
  return message ? <Tooltip title={message} maxWidth={maxWidth} disableTouchListener>{sprite}</Tooltip> : sprite;
};

export default AlertIcon;
