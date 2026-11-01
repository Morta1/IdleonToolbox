import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import NextLink from 'next/link';
import { Box, Button, Snackbar } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { NoticeStack, STACKED_SX } from '@components/common/NoticeSnackbar';
import { closeAllNotices, closeNotice, noticeSnapshot, serverNoticeSnapshot, subscribeNotices } from './notify';

// Inside a modal's slot the snackbar keeps MUI's fixed bottom center, above the anchor ad.
const IN_SLOT_SX = {
  bottom: { xs: 'calc(var(--nitro-ad-height, 0px) + 8px)', sm: 'calc(var(--nitro-ad-height, 0px) + 24px)' }
};

const SnackbarHost = () => {
  const { notice, open, slot } = useSyncExternalStore(subscribeNotices, noticeSnapshot, serverNoticeSnapshot);
  const announcer = useRef(null);

  // Read out politely, once. The region is in the page before any message, which screen readers
  // need. MUI keeps the page aria-hidden until a closing menu or popover has finished leaving, and
  // a message written under it is never read, so the text waits for that.
  useEffect(() => {
    const region = announcer.current;
    if (!region) return undefined;
    if (!open) {
      region.textContent = '';
      return undefined;
    }
    const hidden = region.closest('[aria-hidden="true"]');
    if (!hidden) {
      region.textContent = notice.message;
      return undefined;
    }
    const observer = new MutationObserver(() => {
      if (hidden.getAttribute('aria-hidden') === 'true') return;
      observer.disconnect();
      region.textContent = notice.message;
    });
    observer.observe(hidden, { attributes: true, attributeFilter: ['aria-hidden'] });
    return () => observer.disconnect();
  }, [notice, open, slot]);

  // A notice never outlives its host (tests unmount it between cases).
  useEffect(() => closeAllNotices, []);

  const action = notice?.action;
  const close = () => closeNotice(notice?.id);
  const button = action
    ? <Button size="small" component={action.href ? NextLink : 'button'} href={action.href}
              onClick={() => {
                action.onClick?.();
                close();
              }}>
      {action.label}
    </Button>
    : null;
  const content = <>
    <Box component="span" ref={announcer} role="status" sx={visuallyHidden}/>
    {/* role none: the region above says it once; the snackbar's own default (alert) would say it again, loudly */}
    <Snackbar key={notice?.id} open={open} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              sx={slot ? IN_SLOT_SX : STACKED_SX} autoHideDuration={action ? 6000 : 4000}
              onClose={(event, reason) => {
                if (reason !== 'clickaway') close();
              }}
              message={notice?.message} action={button} ContentProps={{ role: 'none' }}/>
  </>;

  return slot ? createPortal(content, slot) : <NoticeStack>{content}</NoticeStack>;
};

export default SnackbarHost;
