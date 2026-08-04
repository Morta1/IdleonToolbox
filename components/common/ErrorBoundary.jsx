import React from 'react';
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';

/**
 * Without a boundary anywhere in the tree, a single render error unmounts the entire React root -
 * the page goes blank and only a full refresh brings it back. In dev that also kills Fast Refresh,
 * since there is no tree left for it to patch. This keeps the failure contained to one subtree and
 * puts the actual error on screen instead of a white page.
 */
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating away (or any other change of resetKey) should clear a stale error, otherwise the
    // fallback sticks around on a page that never failed.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { title = 'Something went wrong' } = this.props;

    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
          <AlertTitle>{title}</AlertTitle>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {error?.message || String(error)}
            </Typography>
            {process.env.NODE_ENV !== 'production' && error?.stack ? (
              <Typography
                component="pre"
                variant="caption"
                sx={{
                  m: 0,
                  p: 1,
                  maxHeight: 260,
                  overflow: 'auto',
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 0, 0, .35)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {error.stack}
              </Typography>
            ) : null}
            <Box>
              <Button size="small" variant="outlined" onClick={() => this.setState({ error: null })}>
                Try again
              </Button>
            </Box>
          </Stack>
        </Alert>
      </Box>
    );
  }
}

export default ErrorBoundary;
