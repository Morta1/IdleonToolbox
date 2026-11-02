import React from 'react';
import { Stack, Typography } from '@mui/material';
import Notice from '@components/common/Notice';
import { errorMessage, trackEvent } from '@utility/analytics';

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
    // A parser that breaks on a game patch surfaces here for cloud and profile loads alike, since
    // neither wraps its parse in a try/catch - without this the failure is only ever a console log
    // on someone else's machine.
    trackEvent('page_error', {
      error_message: errorMessage(error),
      page_path: typeof window !== 'undefined' ? window.location.pathname : ''
    });
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

    // The root boundary sits outside AppProvider: Notice reads AppContext's default there, which is fine.
    return (
      <Stack spacing={1} sx={{ p: 2 }}>
        <Notice tone={'error'} action={{ label: 'Try again', onClick: () => this.setState({ error: null }) }}>
          {`${title}. That's a bug on my end.`}
        </Notice>
        <Typography variant="caption" color="text.secondary">{error?.message || String(error)}</Typography>
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
      </Stack>
    );
  }
}

export default ErrorBoundary;
