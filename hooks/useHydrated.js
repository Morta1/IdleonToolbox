import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false during the build and during hydration, true from the first post-hydration render. Gate
// anything the build machine cannot know about the visitor (timezone, locale, storage) on this,
// and React never sees a mismatch.
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export default useHydrated;
