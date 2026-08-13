// Title, description and noindex for the exported HTML, resolved in one place because _app's
// <Head> renders all three and a page's own <NextSeo> re-renders them after hydration - the two
// must not disagree about what a page is called or whether it may be indexed.
//
// Nothing below <WaitForRouter> in _app renders during `next build`, so every page's own
// <NextSeo> is absent from the exported HTML. _app rebuilds the tags from PAGE_SEO, keyed by
// route pattern, overridden by whatever the page put in static props.
//
// The canonical URL is deliberately not here: it comes from asPath, so that it follows
// client-side navigation - which a value resolved from build-time props cannot do.

export function resolveSeoHead({ pageProps, pageSeo }) {
  return {
    title: pageProps?.seoTitle || pageSeo?.title || null,
    description: pageProps?.seoDescription || pageSeo?.description || null,
    // PAGE_SEO is keyed by route pattern, so pages generated from one dynamic route share an
    // entry - a class page with no builds carries its own noindex through static props.
    noindex: pageProps?.seoNoindex ?? pageSeo?.noindex ?? false
  };
}
