// The Sign in board's edge for what sits beside a field: the border MUI's own outlined fields draw.
export const fieldEdge = (theme) => `rgba(${(theme.vars || theme).palette.common.onBackgroundChannel} / 0.23)`;

// A flow's body: the board's 16 px under the title and 26 under the last line, past what the dialog leaves.
export const FLOW_SX = { flex: 1, pt: '5px', pb: { sm: '6px' } };
