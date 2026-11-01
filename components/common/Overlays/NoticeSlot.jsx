import { useEffect, useRef } from 'react';
import { registerNoticeSlot } from './notify';

// An open modal hides the page from screen readers (aria-hidden) and keeps focus inside itself, so
// a snackbar in the page column could be neither heard nor reached from it. Inside a modal that can
// notify, the snackbar renders here. `open`: the modal's own open, so a closing modal lets go at
// once instead of carrying the snackbar through its exit transition.
const NoticeSlot = ({ open = true }) => {
  const ref = useRef(null);
  useEffect(() => (open ? registerNoticeSlot(ref.current) : undefined), [open]);
  return <span ref={ref}/>;
};

export default NoticeSlot;
