import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

// Every route a pages/ file serves. A dynamic segment isn't a URL (pages/wiki/[kind]/index.jsx puts one in a directory
// name), so those are left to whoever reads the export. `skip` names files that are not pages to visit.
export const discoverRoutes = ({ skip = ['_app', '_document', '_error'] } = {}) => {
  const routes = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (!entry.includes('[')) walk(full, `${prefix}/${entry}`);
        continue;
      }
      if (!entry.endsWith('.jsx')) continue;
      const name = entry.replace(/\.jsx$/, '');
      if (skip.includes(name) || name.includes('[')) continue;
      routes.push(name === 'index' ? (prefix || '/') : `${prefix}/${name}`);
    }
  };
  walk(path.join(process.cwd(), 'pages'));
  return routes.sort();
};

// The first sorted out/<dir>/*.html not in `skip`. Falls back rather than throwing: a readdir at collection time takes the
// whole file down before a test runs when out/ is missing, which reads as a broken spec instead of a missing build.
export const firstExportedRoute = (dir, { skip = [] } = {}) => {
  try {
    const file = readdirSync(path.join(process.cwd(), 'out', ...dir.split('/')))
      .filter((f) => f.endsWith('.html') && !skip.includes(f))
      .sort()[0];
    return `/${dir}/${file.replace(/\.html$/, '')}`;
  } catch {
    return '/wiki';
  }
};

// The page props a static page ships in its served bytes.
export const pagePropsIn = (html) => JSON.parse(html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)[1]).props.pageProps;
