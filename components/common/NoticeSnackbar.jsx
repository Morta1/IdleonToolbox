// The one notice column SnackbarHost renders into, above the anchor ad.
import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';

// Takes a snackbar out of its fixed corner so it flows inside a NoticeStack. MUI centers a bottom
// snackbar with a translate from sm up, in a media query a plain value never outranks.
export const STACKED_SX = {
  position: 'static',
  transform: { xs: 'none', sm: 'none' },
  left: 'auto',
  right: 'auto',
  bottom: 'auto',
  pointerEvents: 'auto'
};

const STACK_SX = {
  position: 'fixed',
  zIndex: 'snackbar',
  // Bottom center, above the anchor ad
  bottom: { xs: 'calc(var(--nitro-ad-height, 0px) + 8px)', sm: 'calc(var(--nitro-ad-height, 0px) + 24px)' },
  left: { xs: 8, sm: '50%' },
  right: { xs: 8, sm: 'auto' },
  transform: { sm: 'translateX(-50%)' },
  display: 'flex',
  flexDirection: 'column',
  // A phone gives every snackbar the full width, as MUI does for a single one
  alignItems: { xs: 'stretch', sm: 'center' },
  gap: 1,
  pointerEvents: 'none'
};

const NoticeStackContext = createContext(null);

// One notice column for the whole app: the header's goal notices and a page's own notices land in it together
// instead of two fixed columns drawn over each other
export const NoticeStackProvider = ({ children }) => {
  const [host, setHost] = useState(null);
  return (
    <NoticeStackContext.Provider value={host}>
      {children}
      <Box ref={setHost} sx={STACK_SX} data-notice-stack=""/>
    </NoticeStackContext.Provider>
  );
};

// Snackbars at one corner overlap, so the ones that can show at once (rendered with `stacked`) sit in one column.
// Outside a NoticeStackProvider (and before its column mounts) the stack draws its own column.
export const NoticeStack = ({ children }) => {
  const host = useContext(NoticeStackContext);
  if (host) return createPortal(children, host);
  return <Box sx={STACK_SX}>{children}</Box>;
};

