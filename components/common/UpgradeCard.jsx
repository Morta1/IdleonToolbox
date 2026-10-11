import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { prefix } from 'utility/helpers';

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

// Fixed box for a sprite: `src` is under public/, `size` (or width/height) is the box, imgWidth/imgHeight the
// image inside it (a sprite with a padded canvas can be sized past the box and let the padding overflow)
export const CardIcon = ({
                           src,
                           size = 56,
                           width = size,
                           height = size,
                           imgSize = '100%',
                           imgWidth = imgSize,
                           imgHeight = imgSize,
                           alt = ''
                         }) => {
  return <IconBox style={{ width, height }}>
    {src ? <img src={`${prefix}${src}`} alt={alt} style={{ width: imgWidth, height: imgHeight }}/> : null}
  </IconBox>
};

// Bold label and its value on one line, so a wrapped value never indents under the label
export const LabelValue = ({ label, children, color }) => {
  return <Typography variant={'body2'} sx={{ color }}><b>{label}:</b> {children}</Typography>
};

// Icon in a fixed column beside a body2 value, for cost rows. fit="cover" crops a tall/padded sprite to the box.
// Pass `icon` instead of `src` for a ready-made icon; `iconWidth` widens the column so mixed rows line up.
export const IconValueRow = ({ src, icon, alt = '', children, iconSize = 32, iconWidth = iconSize, fit = 'contain' }) => {
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <IconBox style={{ width: iconWidth, height: iconSize, overflow: fit === 'cover' ? 'hidden' : 'visible' }}>
      {icon ?? (src ? <img src={`${prefix}${src}`} alt={alt}
                            style={{ width: iconSize, height: '100%', objectFit: fit }}/> : null)}
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
