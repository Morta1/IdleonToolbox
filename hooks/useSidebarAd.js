import useAdBlockDetection from './useAdBlockDetection';

// Whether a blocker hides the side ads: one answer for the frame (useFrame, which gives their room back) and for
// SideAds (which then renders no gutter), so a column is reserved exactly while its ad can show. Which layout shows,
// and from what width, is CSS (frame.js), so the export and the first client render agree.
export const useSidebarAdBlocked = () => useAdBlockDetection();
