import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CacheProvider } from '@emotion/react';
import styled from '@emotion/styled';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '../utility/createEmotionCache';

const Box = styled.div({ display: 'flex', alignItems: 'center', transition: 'opacity 1s', userSelect: 'none', backdropFilter: 'blur(2px)' });

// The CSS the exported page inlines for one styled element, through the app's own cache.
const cssOf = (element) => {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);
  const html = renderToString(<CacheProvider value={cache}>{element}</CacheProvider>);
  return extractCriticalToChunks(html).styles.map((style) => style.css).join('');
};

describe('createEmotionCache', () => {
  // Only the prefixes a current Safari needs; the -ms-/-webkit-box copies of flex and the rest are gone.
  it('keeps the prefixes Safari still needs and drops the obsolete ones', () => {
    const css = cssOf(<Box/>);
    expect({
      kept: ['-webkit-user-select:none;', '-webkit-backdrop-filter:blur(2px);'].filter((rule) => css.includes(rule)),
      dropped: ['-ms-flexbox', '-webkit-box', '-webkit-align-items', '-webkit-transition', '-moz-user-select', '-ms-user-select']
        .filter((prefix) => css.includes(prefix)),
      plain: ['display:flex;', 'align-items:center;', 'transition:opacity 1s;', 'user-select:none;'].every((rule) => css.includes(rule))
    }).toEqual({ kept: ['-webkit-user-select:none;', '-webkit-backdrop-filter:blur(2px);'], dropped: [], plain: true });
  });
});
