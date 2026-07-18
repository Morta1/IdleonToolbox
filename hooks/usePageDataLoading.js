import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { offlineTools } from '@components/common/NavBar/AppDrawer/ToolsDrawer';

/**
 * Whether the current page is still waiting for the data it needs to render.
 *
 * Lives in a hook rather than inside DataLoadingWrapper because the layout needs the same
 * answer: while a page is loading, ContentWrapper collapses the sidebar ad gutter so the
 * loader can centre in the full width instead of in the narrowed content column.
 */
const usePageDataLoading = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);

  // Determine the page type
  const isAccountPage = router.pathname.includes('/account');
  const isToolPage = router.pathname.includes('/tools');
  const endPoint = router.pathname.split('/')?.[2] || '';
  const formattedEndPoint = endPoint?.replace('-', ' ')?.toCamelCase();
  const isCharactersPage = router.pathname === '/characters';
  const isDashboardPage = router.pathname === '/dashboard';

  // Check data based on page type
  if (isAccountPage || (isToolPage && !offlineTools[formattedEndPoint])) {
    const isDataLoaded = !!state?.account;
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading account data...' };
    }
  } else if (isCharactersPage) {
    const isDataLoaded = !!state?.characters?.length;
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading character data...' };
    }
  } else if (isDashboardPage) {
    const isDataLoaded = !!state?.account && !!state?.characters?.length;
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading dashboard data...' };
    }
  } else if (router.pathname === '/settings') {
    if (state.isLoading) {
      return { loading: true, message: 'Loading settings...' };
    }
  }

  return { loading: false, message: null };
};

export default usePageDataLoading;
