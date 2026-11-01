import React, { Children, useEffect, useId, useRef, useState } from 'react';
import { Box, Button, IconButton, Popover, Stack } from '@mui/material';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';

// The phone panel holds controls that are not all MUI buttons, so it rings every focus target itself.
const PANEL_RING = { '& :focus-visible': { outline: '2px solid var(--mui-palette-primary-main)', outlineOffset: '2px' } };

// Always in the row, on a phone too: a page's own lead control (the leaderboards' player search).
const Lead = ({ children }) => children;

// A page's own phone panel, as a function of close (the leaderboards' extras). Renders nothing in place.
const Panel = () => null;

// One row of controls for a list page (Toolbar board), grown from the leaderboards ControlBar. Sticky under
// the nav bar, and under the profile banner when it shows, within its parent: a page puts the toolbar and
// the content it controls in one box, so both leave together at the content's end. On a phone everything
// but the lead goes behind one button.
// onStickyBottom: where the bar ends on screen, so a tab strip or a table header can pin right under it.
const Toolbar = ({ onStickyBottom, panelLabel = 'Filters', panelIcon = null, panelIconOnly = false, children }) => {
  const { isVisible: showProfileBanner } = useProfileBannerState();
  const [panelAnchor, setPanelAnchor] = useState(null);
  const [barHeight, setBarHeight] = useState(0);
  const barRef = useRef(null);
  const panelId = useId();
  const top = navBarHeight + (showProfileBanner ? profileBannerHeight : 0);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (barHeight) onStickyBottom?.(top + barHeight);
  }, [top, barHeight]);

  const items = Children.toArray(children);
  const lead = items.filter((child) => child.type === Lead);
  const panel = items.find((child) => child.type === Panel);
  const rest = items.filter((child) => child.type !== Lead && child.type !== Panel);
  const open = Boolean(panelAnchor);
  const close = () => setPanelAnchor(null);
  const panelButton = {
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    onClick: (event) => setPanelAnchor(event.currentTarget)
  };
  const phoneOnly = { display: { xs: 'inline-flex', sm: 'none' }, flexShrink: 0 };

  return <Box ref={barRef} sx={{
    position: 'sticky', top, zIndex: (theme) => theme.zIndex.appBar - 1,
    bgcolor: 'background.default', py: 1.5,
    // A landscape phone has no height to spare for pinned bars.
    '@media (max-height: 500px)': { position: 'static' }
  }}>
    <Stack direction="row" gap={{ xs: 1, sm: 2 }} alignItems="flex-start" flexWrap={{ xs: 'nowrap', sm: 'wrap' }}>
      {lead}
      {/* Both layouts are in the markup and CSS picks one, so a phone does not reflow after hydration. */}
      <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>{rest}</Box>
      {panel ? (panelIconOnly
        ? <IconButton aria-label={panelLabel} {...panelButton}
                      sx={{ ...phoneOnly, width: 44, height: 44, bgcolor: 'action.hover', color: 'common.white' }}>
          {panelIcon}
        </IconButton>
        : <Button variant="outlined" startIcon={panelIcon ?? <IconAdjustmentsHorizontal size={18}/>} {...panelButton}
                  sx={{ ...phoneOnly, whiteSpace: 'nowrap' }}>
          {panelLabel}
        </Button>) : null}
    </Stack>
    <Popover
      anchorEl={panelAnchor}
      open={open}
      onClose={close}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { id: panelId, role: 'dialog', 'aria-label': panelLabel, sx: PANEL_RING } }}>
      {panel?.props.children(close)}
    </Popover>
  </Box>;
};

Toolbar.Lead = Lead;
Toolbar.Panel = Panel;

export default Toolbar;
