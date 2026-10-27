import path from 'node:path';
import { fileURLToPath } from 'node:url';
import golden from '../parse-golden/vitest.config.mjs';

// Rewrites parsers/index.ts and safeSection.ts in memory only, to expose pass and section hooks.
// Every injection stays on its original line, so stack line numbers still match the source.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const replaceOnce = (code, from, to, file) => {
  if (code.includes('\r\n')) {
    from = from.replaceAll('\n', '\r\n');
    to = to.replaceAll('\n', '\r\n');
  }
  if (!code.includes(from)) throw new Error(`parse-graph: "${from.slice(0, 60)}" not found in ${file}; update tools/parse-graph/vitest.config.mjs`);
  return code.replace(from, to);
};

const hooks = {
  name: 'parse-graph-hooks',
  enforce: 'pre',
  transform(code, id) {
    const file = id.replaceAll('\\', '/');
    if (file.endsWith('/parsers/index.ts')) {
      let c = code;
      c = replaceOnce(c, 'for (let pass = 0; pass < passes; pass++) {', 'for (let pass = 0; pass < passes; pass++) { globalThis.__PG?.passStart?.(pass);', 'index.ts');
      c = replaceOnce(c, 'processedData = serializeData(idleonData, serverVars, staticData, processedData);',
        'processedData = serializeData(idleonData, serverVars, staticData, processedData); globalThis.__PG?.passEnd?.(pass, processedData);', 'index.ts');
      c = replaceOnce(c, 'const accountData: any = {', 'const __raw: any = {', 'index.ts');
      c = replaceOnce(c, '  };\n  let charactersData: any[] = processedData?.charactersData || [];',
        '  }; const accountData: any = globalThis.__PG?.wrapAcc ? globalThis.__PG.wrapAcc(__raw) : __raw;\n  let charactersData: any[] = processedData?.charactersData || []; if (globalThis.__PG?.wrapPrev) { processedData = globalThis.__PG.wrapPrev(processedData); charactersData = globalThis.__PG.wrapChars(charactersData); }', 'index.ts');
      c = replaceOnce(c, 'initializeCharacter(char, charactersLevels, { ...accountData }, idleonData)',
        'initializeCharacter(char, charactersLevels, globalThis.__PG?.copyAcc ? globalThis.__PG.copyAcc(accountData) : { ...accountData }, idleonData)', 'index.ts');
      c = replaceOnce(c, '  return { accountData, charactersData };\n};\n',
        '  return { accountData: globalThis.__PG?.unwrap ? globalThis.__PG.unwrap(accountData) : accountData, charactersData };\n};\n', 'index.ts');
      return c;
    }
    if (file.endsWith('/parsers/safeSection.ts')) {
      return replaceOnce(code, 'const result = fn();',
        'globalThis.__PG?.enter?.(name); let result; try { result = fn(); } finally { globalThis.__PG?.exit?.(); }', 'safeSection.ts');
    }
  },
};

export default {
  ...golden,
  plugins: [hooks],
  test: { ...golden.test, include: ['tools/parse-graph/graph.test.mjs'] },
};
