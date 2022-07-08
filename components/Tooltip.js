import { Tooltip, tooltipClasses } from "@mui/material";
import styled from "@emotion/styled";

const HtmlTooltip = styled(({ className, children, followCursor = true, ...props }) => (
  <Tooltip followCursor={followCursor} enterTouchDelay={200} {...props}
           classes={{ popper: className }}>{children}</Tooltip>
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#d5d5dc',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 320,
    fontSize: theme.typography.pxToRem(14),
    border: '1px solid #dadde9',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#dadde9'
  },
}));

export default HtmlTooltip;

