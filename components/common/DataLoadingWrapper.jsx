import React, { useContext } from 'react';
import SimpleLoader from './SimpleLoader';
import usePageDataLoading from '@hooks/usePageDataLoading';
import { AppContext } from './context/AppProvider';
import EmptyAccountBanner from './EmptyAccountBanner';

/**
 * A wrapper component that shows a simple loader for data-dependent pages
 * This component will automatically detect the page type and show the loader
 */
const DataLoadingWrapper = ({ children }) => {
  const { loading, message, isDataPage } = usePageDataLoading();
  const { state } = useContext(AppContext);

  if (loading) return <SimpleLoader message={message}/>;

  return <>
    {isDataPage && state?.emptyAccount ? <EmptyAccountBanner/> : null}
    {children}
  </>;
};

export default DataLoadingWrapper;
