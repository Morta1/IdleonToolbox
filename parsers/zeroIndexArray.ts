// An array whose missing numeric indices read as 0, matching the game's default for unset slots.
// It is a Proxy, which a browser can't post out of a Web Worker, so the parse worker detaches these
// to plain arrays before posting and the main thread re-attaches them at the same paths.
const zeroIndexArrays = new WeakSet<object>();

export const zeroIndexArray = (arr: any): any => {
  const target = Array.isArray(arr) ? arr : [];
  const proxy = new Proxy(target, {
    get(t, prop, receiver) {
      if (typeof prop === 'string' && /^\d+$/.test(prop) && !(prop in t)) {
        return 0;
      }
      return Reflect.get(t, prop, receiver);
    }
  });
  zeroIndexArrays.add(proxy);
  return proxy;
};

type Path = (string | number)[];

/** Replaces every zero-index array under `root` with a plain copy, and returns where they were. */
export const detachZeroIndexArrays = (root: any): Path[] => {
  const paths: Path[] = [];
  const seen = new WeakSet<object>();
  const walk = (value: any, path: Path) => {
    if (value === null || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    for (const key of Object.keys(value)) {
      const child = value[key];
      if (child !== null && typeof child === 'object' && zeroIndexArrays.has(child)) {
        value[key] = [...child];
        paths.push([...path, key]);
      } else walk(child, [...path, key]);
    }
  };
  walk(root, []);
  return paths;
};

export const attachZeroIndexArrays = (root: any, paths: Path[] = []) => {
  for (const path of paths) {
    const parent = path.slice(0, -1).reduce((node, key) => node?.[key], root);
    const key = path[path.length - 1];
    if (parent && Array.isArray(parent[key])) parent[key] = zeroIndexArray(parent[key]);
  }
};
