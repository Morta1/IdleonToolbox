import React from 'react';
import SimpleLoader from './SimpleLoader';
import usePageDataLoading from '@hooks/usePageDataLoading';

/**
 * A wrapper component that shows a simple loader for data-dependent pages
 * This component will automatically detect the page type and show the loader
 */
const DataLoadingWrapper = ({ children }) => {
  const { loading, message } = usePageDataLoading();

  return loading ? <SimpleLoader message={message}/> : children;
};

export default DataLoadingWrapper;
