import { useRouter } from 'next/router';
import { routeNeedsAccount } from '@utility/account-routes';

// The `prefetch` prop for the nav's links. next/link prefetches every link in the viewport, so a
// static page (wiki, home, builds) was downloading every data page the nav shows: 15-24 MB of JS
// on desktop, website-data included, for pages the visitor may never open. There, prefetch is
// off and next/link still prefetches on hover or touch, just before the click. Data pages keep
// viewport prefetch: their siblings share the chunks already loaded, which is what keeps drawer
// clicks at ~100ms.
const useNavPrefetch = () => {
  const router = useRouter();
  return routeNeedsAccount(router.pathname) ? undefined : false;
};

export default useNavPrefetch;
