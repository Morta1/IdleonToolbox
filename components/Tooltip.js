import { Tooltip, tooltipClasses } from '@mui/material';
import styled from '@emotion/styled';

const HtmlTooltip = styled(({ className, children, followCursor = true, dark, maxWidth, ...props }) => (
  <Tooltip followCursor={followCursor} enterTouchDelay={200} {...props}
           dark={dark}
           classes={{ popper: className }}>{children}</Tooltip>
))(({ theme, dark, maxWidth }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: dark ? '#222831' : '#d5d5dc',
    color: dark ? 'white' : 'black',
    maxWidth: maxWidth ? maxWidth : 320,
    fontSize: theme.typography.pxToRem(14),
    border: '1px solid #dadde9',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#dadde9'
  },
}));

export default HtmlTooltip;

