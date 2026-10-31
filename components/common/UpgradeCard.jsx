import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import GameIcon from '@components/common/GameIcon';

// Card layout shared by the upgrade/bonus grids: icon + bold title + muted subtitle, body2 text, and an
// optional footer pinned to the bottom under a divider so footers line up across a row.
const UpgradeCard = ({ icon, title, titleColor, subtitle, badges, footer, children, width = 300, dimmed, sx }) => {
  return <Card sx={{ width, opacity: dimmed ? .5 : 1, ...sx }}>
    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {title || icon ? <CardHeader icon={icon} title={title} titleColor={titleColor} subtitle={subtitle}
                                   badges={badges}/> : null}
      {children}
      {footer ? <Stack mt={'auto'} gap={1}>
        <Divider sx={{ mb: .5 }}/>
        {footer}
      </Stack> : null}
    </CardContent>
  </Card>
};

export const CardHeader = ({ icon, title, titleColor, subtitle, badges }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    {icon}
    <Stack>
      {title ? <Typography variant={'subtitle1'} sx={{ fontWeight: 'bold', lineHeight: 1.3, color: titleColor }}>
        {title}
      </Typography> : null}
      {subtitle || badges ? <Stack direction={'row'} alignItems={'center'} gap={1}>
        {subtitle ? <Typography variant={'body2'} color={'text.secondary'}>{subtitle}</Typography> : null}
        {badges ? <Badges>{badges}</Badges> : null}
      </Stack> : null}
    </Stack>
  </Stack>
};

// GameIcon's five sizes (Icons board). The old props pick the nearest, so no call site changes before 2d.
const ICON_SIZES = [16, 24, 32, 40, 56];
const nearestIconSize = (px) => ICON_SIZES.reduce((best, size) => (Math.abs(size - px) < Math.abs(best - px) ? size : best));

// A thin wrapper until 2d moves its callers to ItemCard: the box's longest side picks the GameIcon size, and
// the image props go (GameIcon fits the sprite's drawn pixels instead). No src is an empty box, as before.
export const CardIcon = ({ src, size = 56, width = size, height = size, alt = '' }) => (
  <GameIcon src={src} size={nearestIconSize(Math.max(width, height))} alt={alt}/>
);

// Bold label and its value on one line, so a wrapped value never indents under the label
export const LabelValue = ({ label, children, color }) => {
  return <Typography variant={'body2'} sx={{ color }}><b>{label}:</b> {children}</Typography>
};

// A cost row: the resource's icon in a fixed column beside a body2 value. Pass `icon` instead of `src` for a
// ready-made icon; `iconWidth` widens the column so mixed rows line up.
export const IconValueRow = ({ src, icon, alt = '', children, iconSize = 24, iconWidth = iconSize }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <IconBox style={{ width: iconWidth }}>
      {icon ?? <GameIcon src={src} size={nearestIconSize(iconSize)} alt={alt}/>}
    </IconBox>
    <Typography variant={'body2'} component={'div'}>{children}</Typography>
  </Stack>
};

export const Muted = styled('span')`
  opacity: .7;
`;

const IconBox = styled('div')`
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  & img {
    flex-shrink: 0;
    object-fit: contain;
  }
`;

const Badges = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  & img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
`;

export default UpgradeCard;
