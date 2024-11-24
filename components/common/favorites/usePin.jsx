import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';

const usePin = () => {
  const { dispatch, state } = useContext(AppContext);
  const router = useRouter();
  const isPinned = state.pinnedPages?.find(({ name }) => router.pathname.includes(name));

  const togglePin = () => {
    const pageName = router.pathname.split('/').at(-1);
    const exist = state?.pinnedPages?.find(({ name }) => name === pageName);
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    if (exist) {
      updatePinnedPages = updatePinnedPages.filter(({ name }) => name !== pageName);
    } else {
      updatePinnedPages.push({ name: pageName, url: router.pathname })
    }
    localStorage.setItem('state.pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
  }

  return { pinnedPages: state.pinnedPages, isPinned, togglePin };
};

export default usePin;
