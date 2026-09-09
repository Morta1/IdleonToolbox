import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false during the build and during hydration, true from the first post-hydration render. For
// anything the build machine cannot know about the visitor (timezone, locale, storage): render
// nothing until this is true, and React never sees a mismatch. Cheaper than a state-plus-effect
// pair, and it is the pattern React documents for exactly this.
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export default useHydrated;
