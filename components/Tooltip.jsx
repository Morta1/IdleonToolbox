import { Tooltip, tooltipClasses } from '@mui/material';
import styled from '@emotion/styled';

const HtmlTooltip = styled(({ className, children, followCursor = true, dark, maxWidth, ...props }) => (
  <Tooltip enterTouchDelay={200} {...props}
           classes={{ popper: className }}>{children}</Tooltip>
), {
  shouldForwardProp: (prop) => prop !== 'maxWidth'
})(({ theme, maxWidth }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: maxWidth ? maxWidth : 320,
    fontSize: theme.typography.pxToRem(14)
  }
}));

export default HtmlTooltip;

