import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

/**
 * Lets a page tell the layout that its entire body is currently a loader, so ContentWrapper can
 * collapse the sidebar ad gutter and let the loader centre in the full width.
 *
 * DataLoadingWrapper-driven pages are handled by usePageDataLoading. This covers pages that own
 * their loading state locally (statistics, guilds, ...) and early-return a bare SimpleLoader.
 */
const PageLoadingContext = createContext({ loading: false, setLoading: () => {} });

export const PageLoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return <PageLoadingContext.Provider value={{ loading, setLoading }}>
    {children}
  </PageLoadingContext.Provider>;
};

export const usePageLoadingState = () => useContext(PageLoadingContext).loading;

/**
 * Call unconditionally from a page whose whole body is replaced by a loader while `isLoading`.
 * Do not use for loaders rendered alongside real content - collapsing the gutter would shift that
 * content sideways and back.
 */
export const useReportPageLoading = (isLoading) => {
  const { setLoading } = useContext(PageLoadingContext);

  // useLayoutEffect, not useEffect: with useEffect the collapse lands a frame after the loader
  // paints, so the loader is briefly visible still off-centre. WaitForRouter means none of this
  // renders on the server, so there is no SSR mismatch to worry about.
  useLayoutEffect(() => {
    setLoading(isLoading);
    return () => setLoading(false);
  }, [isLoading, setLoading]);
};

export default PageLoadingProvider;
