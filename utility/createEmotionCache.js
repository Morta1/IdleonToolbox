import createCache from '@emotion/cache';
import { slimPrefixer } from './emotion-prefixer';

// The same cache on the build machine and the client, so both write identical CSS.
const createEmotionCache = () => {
  return createCache({ key: 'css', stylisPlugins: [slimPrefixer] });
};

export default createEmotionCache;
