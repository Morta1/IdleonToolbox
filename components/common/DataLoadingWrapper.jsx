import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { AppContext } from './context/AppProvider';
import SimpleLoader from './SimpleLoader';
import { offlineTools } from '@components/common/NavBar/AppDrawer/ToolsDrawer';

/**
 * A wrapper component that shows a simple loader for data-dependent pages
 * This component will automatically detect the page type and show the loader
 */
const DataLoadingWrapper = ({ children }) => {
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
      return <SimpleLoader message="Loading account data..."/>;
    }
  } else if (isCharactersPage) {
    const isDataLoaded = !!state?.characters?.length;
    if (state.isLoading || !isDataLoaded) {
      return <SimpleLoader message="Loading character data..."/>;
    }
  } else if (isDashboardPage) {
    const isDataLoaded = !!state?.account && !!state?.characters?.length;
    if (state.isLoading || !isDataLoaded) {
      return <SimpleLoader message="Loading dashboard data..."/>;
    }
  }

  // For all other cases, render children normally
  return children;
};

export default DataLoadingWrapper; 