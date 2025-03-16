import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';

const usePin = () => {
  const { dispatch, state } = useContext(AppContext);
  const router = useRouter();
  const isPinned = state.pinnedPages?.find(({ name, tab, nestedTab, deeplyNestedTab }) => router.pathname.includes(name)
    && (tab ? router.query?.t?.includes(tab) : true)
    && (nestedTab ? router.query?.nt?.includes(nestedTab) : true)
    && (deeplyNestedTab ? router.query?.dnt?.includes(deeplyNestedTab) : true));

  const togglePin = () => {
    const pageName = router.pathname.split('/').at(-1);
    const { t, nt, dnt } = router.query;
    const exist = state?.pinnedPages?.find(({ name, tab, nestedTab, deeplyNestedTab }) =>
      name === pageName &&
      (tab ?? null) === (t ?? null) &&
      (nestedTab ?? null) === (nt ?? null) &&
      (deeplyNestedTab ?? null) === (dnt ?? null)
    );
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    if (exist) {
      updatePinnedPages = updatePinnedPages.filter(({ name, tab, nestedTab, deeplyNestedTab }) =>
          !(name === pageName &&
            (tab ?? null) === (t ?? null) &&
            (nestedTab ?? null) === (nt ?? null)) &&
            (deeplyNestedTab ?? null) === (dnt ?? null)
    )
    } else {
      updatePinnedPages.push({ name: pageName, tab: t, nestedTab: nt, deeplyNestedTab: dnt, url: router.pathname })
    }
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
  }

  const removePin = (index) => {
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    updatePinnedPages = updatePinnedPages.filter((_, ind) => ind !== index);
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
  }

  return { pinnedPages: state.pinnedPages, isPinned, togglePin, removePin };
};

export default usePin;
