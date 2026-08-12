import * as React from 'react';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '../utility/createEmotionCache';
import { PAGE_SEO } from '../data/page-seo';

export default class MyDocument extends Document {
  render() {
    // The <title> lives here rather than in _app's next/head: next/head emits every other tag
    // (they carry data-next-head) but the title never reaches the exported HTML, so every page
    // shipped untitled. _document renders once at export time, ahead of anything that could
    // hoist it away. next-seo still swaps in the page's own title after hydration.
    //
    // PAGE_SEO is keyed by route pattern, so every page generated from a dynamic route shares
    // one entry. Those pages pass their own copy through static props instead, which is why
    // pageProps wins here.
    const data = this.props.__NEXT_DATA__;
    const pageSeo = PAGE_SEO[data?.page];
    const pageProps = data?.props?.pageProps;
    const title = pageProps?.seoTitle || pageSeo?.title;
    const description = pageProps?.seoDescription || pageSeo?.description;
    return (
      <Html lang="en">
        <Head>
          {title ? <title>{title}</title> : null}
          {description ? <meta name="description" content={description} /> : null}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="theme-color" content="#141A21" />
          
          <link rel="icon" type="image/png" sizes="32x32" href="/data/Coins5.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/data/Coins5.png" />
          <link rel="apple-touch-icon" href="/data/Coins5.png" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Preconnect to important domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </Head>
        <body>
        <Main/>
        <NextScript/>
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  /* eslint-disable */
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        (function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        }),
    });
  /* eslint-enable */

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents emotion to render invalid HTML.
  // See https://github.com/mui-org/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      ...emotionStyleTags,
    ],
  };
};