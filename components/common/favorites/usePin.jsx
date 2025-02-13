import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';

const usePin = () => {
  const { dispatch, state } = useContext(AppContext);
  const router = useRouter();
  const isPinned = state.pinnedPages?.find(({ name, tab, nestedTab }) => router.pathname.includes(name)
    && (tab ? router.query?.t?.includes(tab) : true)
    && (nestedTab ? router.query?.nt?.includes(nestedTab) : true));

  const togglePin = () => {
    const pageName = router.pathname.split('/').at(-1);
    const { t, nt } = router.query;
    const exist = state?.pinnedPages?.find(({ name, tab, nestedTab }) =>
      name === pageName &&
      (tab ?? null) === (t ?? null) &&
      (nestedTab ?? null) === (nt ?? null)
    );
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    if (exist) {
      updatePinnedPages = updatePinnedPages.filter(({ name, tab, nestedTab }) =>
        !(name === pageName &&
          (tab ?? null) === (t ?? null) &&
          (nestedTab ?? null) === (nt ?? null)));
    } else {
      updatePinnedPages.push({ name: pageName, tab: t, nestedTab: nt, url: router.pathname })
    }
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
  }

  const removePin = (index) => {
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    updatePinnedPages = updatePinnedPages.filter((_, ind) => index !== index);
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
  }

  return { pinnedPages: state.pinnedPages, isPinned, togglePin, removePin };
};

export default usePin;
