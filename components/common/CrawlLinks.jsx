import React, { useEffect, useState } from 'react';

// Nothing below <WaitForRouter> renders during the static export, so every exported page ships an
// empty body: a page's own links exist only after hydration. Removing that gate was investigated
// and rejected (two more gates below it, two systemic hydration-mismatch classes), and the
// working alternative is the one already used for head tags — render above it, from static props.
//
// This is that block for links. It renders identical markup on the server and on the first client
// render, then unmounts once hydrated, so there is no mismatch and no duplicate UI.
//
// display:none, and it costs nothing. The block unmounts on hydration, so a crawler's rendered DOM
// never contained these links either way - their whole value is link discovery from the raw HTML,
// which CSS does not touch. Shown, it was the entire page for as long as hydration took: measured
// at ~0.7s on desktop and ~9.5s on a throttled phone, of anchors where the app should be.
//
// Plain <a>, not next/link: this sits above the router gate, and prefetching a list this long
// would be worse than useless.

const HIDDEN = { display: 'none' };

const CrawlLinks = ({ links, heading }) => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (hydrated || !links?.length) return null;

  // A build whose class and subclass are the same name would supply the same href twice.
  const unique = [...new Map(links.map((l) => [l.h, l])).values()];

  return (
    <nav aria-label={heading} style={HIDDEN}>
      <h2>{heading}</h2>
      <ul>
        {unique.map(({ h, t }) => (
          <li key={h}>
            <a href={h}>{t}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CrawlLinks;
