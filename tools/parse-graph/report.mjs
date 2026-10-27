import fs from 'node:fs';
import path from 'node:path';

const ASSIGN = /accountData\)?\.(\w+)[\w.?]*\s*=(?!=)/;

// A read labelled with an index.ts line belongs to the section that line (or the next few, for
// `const x = ...` / `if (...) {` lines) assigns.
const nodeForLine = (src, line) => {
  for (let i = line - 1; i < Math.min(line + 10, src.length); i++) {
    const text = src[i] ?? '';
    if (/\bcharacter\.\w+\s*=|charactersData\s*=/.test(text)) return 'characters';
    const m = text.match(ASSIGN);
    if (m) return m[1];
  }
  return `line ${line}`;
};

const nodeOf = (label, src) => {
  if (label === 'after-parse' || label === 'unknown') return null;
  if (/^L\d+$/.test(label)) return nodeForLine(src, Number(label.slice(1)));
  if (label === 'sneakingDetection') return 'sneaking';
  return label.split('.')[0];
};

const sccs = (nodes, edges) => {
  const adj = Object.fromEntries([...nodes].map((n) => [n, []]));
  for (const [from, to] of edges) adj[from]?.push(to);
  let i = 0;
  const stack = [], on = new Set(), idx = {}, low = {}, out = [];
  const visit = (v) => {
    idx[v] = low[v] = i++;
    stack.push(v);
    on.add(v);
    for (const w of adj[v]) {
      if (idx[w] === undefined) { visit(w); low[v] = Math.min(low[v], low[w]); }
      else if (on.has(w)) low[v] = Math.min(low[v], idx[w]);
    }
    if (low[v] === idx[v]) {
      const c = [];
      let w;
      do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v);
      out.push(c);
    }
  };
  for (const n of nodes) if (idx[n] === undefined) visit(n);
  return out.filter((c) => c.length > 1).sort((a, b) => b.length - a.length);
};

export const analyze = (deps, src) => {
  const edges = {}; // reader -> key -> { reads, stale }
  let postParseReads = 0;
  let unlabelled = 0;
  for (const [label, keys] of Object.entries(deps.reads)) {
    const reader = nodeOf(label, src);
    if (!reader) {
      const n = Object.values(keys).reduce((s, e) => s + e.reads, 0);
      if (label === 'after-parse') postParseReads += n;
      else unlabelled += n;
      continue;
    }
    for (const [key, e] of Object.entries(keys)) {
      if (key === reader) continue;
      const t = ((edges[reader] ??= {})[key] ??= { reads: 0, stale: 0 });
      t.reads += e.reads;
      t.stale += e.stale;
    }
  }
  // A reader that touches most keys the same small number of times is enumerating the account
  // (spread, Object.keys), which is not a real dependency on each key.
  const enumerating = {};
  for (const [reader, keys] of Object.entries(edges)) {
    const counts = {};
    for (const e of Object.values(keys)) counts[e.reads] = (counts[e.reads] ?? 0) + 1;
    const [reads, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (n > 30) enumerating[reader] = Number(reads);
  }
  const nodes = new Set([...Object.keys(deps.writes), ...Object.keys(edges)]);
  const real = [];
  for (const [reader, keys] of Object.entries(edges)) {
    for (const [key, e] of Object.entries(keys)) {
      if (nodes.has(key) && enumerating[reader] !== e.reads) real.push({ key, reader, ...e });
    }
  }
  const stale = real.filter((e) => e.stale);
  const hubs = {};
  for (const e of stale) (hubs[e.key] ??= []).push(e.reader);
  return {
    nodes: nodes.size,
    readers: Object.keys(edges).length,
    edges: real.length,
    staleEdges: stale.length,
    readersWithStale: new Set(stale.map((e) => e.reader)).size,
    cycles: sccs(nodes, real.map((e) => [e.key, e.reader])),
    hubs: Object.entries(hubs).sort((a, b) => b[1].length - a[1].length),
    enumerating,
    multiWritten: Object.entries(deps.writes).filter(([, lines]) => lines.length > 1).map(([k, lines]) => `${k} (${lines.length}x)`),
    postParseReads,
    unlabelled,
    stale,
  };
};

export const writeReport = (out, src, results) => {
  const a = results.deps ? analyze(results.deps, src) : null;
  const lines = ['# Parse graph report', '', `Generated ${new Date().toISOString().slice(0, 10)} by \`npm run parse:graph\`.`, ''];
  lines.push('## Convergence', '', '| Fixture | ' + 'changed values per pass step |', '|---|---|');
  for (const [f, steps] of Object.entries(results.convergence)) {
    lines.push(`| ${f} | ${steps.map((s) => `p${s.from}→p${s.to}: ${s.changed}`).join(', ')} |`);
  }
  const unsettled = Object.entries(results.convergence).filter(([, s]) => s.slice(2).some((x) => x.changed));
  lines.push('', unsettled.length ? `**Not converged after pass 3:** ${unsettled.map(([f]) => f).join(', ')}` : 'All listed fixtures are stable after pass 3.', '');
  if (a) {
    const transparent = Object.values(results.transparency).every((n) => n === 0);
    lines.push('## Dependencies', '');
    lines.push(`- Instrumentation changed values: ${transparent ? 'no' : `**yes** (${JSON.stringify(results.transparency)}): the graph below is unreliable`}`);
    lines.push(`- Account keys: ${a.nodes}; reading sections: ${a.readers}; read edges: ${a.edges}`);
    lines.push(`- Read before written in the same pass: **${a.staleEdges} edges**, in ${a.readersWithStale} of ${a.readers} sections`);
    lines.push(`- Largest cycle: **${a.cycles[0]?.length ?? 0} sections**${a.cycles.length > 1 ? ` (plus ${a.cycles.length - 1} smaller)` : ''}`);
    lines.push(`- Sections enumerating the whole account: ${Object.keys(a.enumerating).join(', ') || 'none'}`);
    lines.push(`- Sections written more than once per pass: ${a.multiWritten.join(', ') || 'none'}`);
    lines.push(`- Reads after the parse finished (results holding the live account): ${a.postParseReads}`);
    lines.push(`- Reads with no index.ts frame (dropped from the graph): ${a.unlabelled}`);
    lines.push(`- structuredClone of the result (needed to post it from a worker): ${Object.entries(results.cloneable ?? {}).map(([f, r]) => `${f}: ${r}`).join('; ')}`);
    lines.push('', '### Result paths holding the live account', '', ...(results.holders?.length ? results.holders.map((p) => `- \`${p}\``) : ['none']));
    lines.push('', '### Keys read before they are written', '', '| Key | Sections reading it early |', '|---|---|');
    for (const [key, readers] of a.hubs.slice(0, 20)) lines.push(`| ${key} | ${readers.length}: ${readers.join(', ')} |`);
    lines.push('', '### Cycles', '', ...a.cycles.map((c) => `- ${c.length}: ${c.sort().join(', ')}`));
  }
  fs.writeFileSync(path.join(out, 'report.md'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify({ ...results, analysis: a }, null, 1));
};
