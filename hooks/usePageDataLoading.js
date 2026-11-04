import { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { offlineTools } from '@utility/navMenu';

/**
 * Whether the current page is still waiting for the data it needs to render.
 * DataLoadingWrapper shows its loader while it is; the frame keeps its width either way (useFrame).
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
  const isDataPage = isAccountPage || (isToolPage && !offlineTools[formattedEndPoint]) || isCharactersPage || isDashboardPage;

  // Check data based on page type
  if (isAccountPage || (isToolPage && !offlineTools[formattedEndPoint])) {
    const isDataLoaded = !!state?.account;
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading account data...', isDataPage };
    }
  } else if (isCharactersPage) {
    // An anonymous visitor's flags arrive before the empty account is parsed: wait for the parse.
    // A whole-parse failure has no characters to wait for, as on the dashboard
    const isDataLoaded = !!state?.characters?.length || (state?.emptyAccount && !!state?.account)
      || !!state?.account?.failedSections?.includes('*');
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading character data...', isDataPage };
    }
  } else if (isDashboardPage) {
    // A whole-parse failure has no characters to wait for: the page says what failed, never a loader that stays.
    const isDataLoaded = (!!state?.account && !!state?.characters?.length) || (state?.emptyAccount && !!state?.account)
      || !!state?.account?.failedSections?.includes('*');
    if (state.isLoading || !isDataLoaded) {
      return { loading: true, message: 'Loading dashboard data...', isDataPage };
    }
  } else if (router.pathname === '/settings') {
    if (state.isLoading) {
      return { loading: true, message: 'Loading settings...', isDataPage };
    }
  }

  return { loading: false, message: null, isDataPage };
};

export default usePageDataLoading;
