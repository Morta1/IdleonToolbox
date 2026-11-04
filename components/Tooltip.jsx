import { Tooltip, tooltipClasses } from '@mui/material';
import styled from '@emotion/styled';

const HtmlTooltip = styled(({ className, children, followCursor = true, dark, maxWidth, ...props }) => (
  <Tooltip enterTouchDelay={200} {...props}
           classes={{ popper: className }}>{children}</Tooltip>
), {
  shouldForwardProp: (prop) => prop !== 'maxWidth'
})(({ theme, maxWidth }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    // Overlays board: a tooltip is at most 260 px wide unless the caller asks for its own.
    maxWidth: maxWidth ? maxWidth : 260,
    fontSize: theme.typography.pxToRem(13.5)
  }
}));

export default HtmlTooltip;

