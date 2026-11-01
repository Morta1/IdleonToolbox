import { useEffect, useRef, useState } from 'react';

// The header sticks under the toolbar only where that helps and works (Tables board, long tables): the
// table is taller than the screen; it fits its width, since a scroll box would hold the sticky header
// instead of the page; and the screen is not a landscape phone, where the toolbar itself stops sticking.
// Measured after mount, so the export and the first render are the plain table. The first measure is the
// observer's own first callback, never a call in the effect body.
const useStickyHeader = (stickyTop) => {
  const boxRef = useRef(null);
  const tableRef = useRef(null);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const table = tableRef.current;
    if (stickyTop == null || !box || !table || typeof ResizeObserver === 'undefined') return;
    const measure = () => setSticky(window.innerHeight > 500
      && table.offsetWidth <= box.clientWidth
      && table.offsetHeight > window.innerHeight - stickyTop);
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(table);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [stickyTop]);

  return { boxRef, tableRef, sticky: sticky && stickyTop != null };
};

export default useStickyHeader;
