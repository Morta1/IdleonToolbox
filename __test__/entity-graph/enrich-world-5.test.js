import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichWorld5 } from '../../scripts/entity-graph/enrich-world-5.mjs';
import { artifactNodes, godNodes, superbitNodes } from '../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { costAt, costsAt, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// The before/after snapshots name exactly which nodes the enrichment touched.
const blank = () => ({
  ...godNodes(data.gods),
  ...artifactNodes(data.artifacts, data.islands),
  ...superbitNodes(data.superbitsUpgrades)
});
const before = blank();
const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
const nodes = blank();
enrichWorld5(nodes, data);
const changed = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && JSON.stringify(nodes[id]) !== snapshot[id]).sort();
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
const godNamed = (name) => Object.values(nodes).find((node) => node.kind === 'god' && node.name === name);
const blessingAt = (node, level) => levelledText(node, level).split('Blessing: ')[1];

describe('gods', () => {
  it('enrich every god that has a blessing', () => {
    const expected = data.gods.map((god, slot) => (god?.name && god.blessing ? `god:DivGod${slot}` : null)).filter(Boolean);
    expect(changed('god:')).toEqual(expected.sort());
  });

  it('turn a god into a blessing calculator page', () => {
    expect(godNamed('Snehebatu')).toEqual({
      kind: 'god',
      rawName: 'DivGod0',
      name: 'Snehebatu',
      icon: '/data/DivGod0.png',
      category: 'World 5',
      registry: true,
      description: '+30%_AFK_Gains_for_all_activities! Minor bonus for a linked character, at most: +70%_accuracy_and_+70%_defence. Blessing: +{%_Divinity_PTS_Gain.',
      effect: { levelLabel: 'Blessing level', cap: null, terms: [{ token: '{', formula: 'linear', args: { perLevel: 2 } }] },
      cost: { formula: 'pow', args: { base: 10, rate: 1.75 }, currency: 'Bits', note: 'No discounts apply.' },
      fields: [{ label: 'Base max blessing level', value: '100 (raised by Coral Kid, Mr. Minehead, the Upgrade Vault and the Jelly Operator)' }]
    });
  });

  // The major and minor sentences stay as godNodes wrote them, and level 1 reads what the old fixed sentence did.
  it('keep the major and minor sentences and read the old level 1 blessing at level 1', () => {
    const ANCHOR = 'Blessing, Level 1: ';
    const gods = changed('god:');
    const kept = (id) => before[id].description.slice(0, before[id].description.indexOf(ANCHOR));
    expect(gods.map((id) => nodes[id].description.startsWith(`${kept(id)}Blessing: `))).toEqual(gods.map(() => true));
    expect(gods.map((id) => levelledText(nodes[id], 1))).toEqual(gods.map((id) => spaced(before[id].description.replace(ANCHOR, 'Blessing: '))));
  });

  it('read the blessing at levels 1 and 100', () => {
    expect([1, 100].map((level) => blessingAt(godNamed('Snehebatu'), level))).toEqual(['+2% Divinity PTS Gain.', '+200% Divinity PTS Gain.']);
    expect(blessingAt(godNamed('Nobisect'), 1)).toBe('+50 All Skill Efficiency.');
  });

  // Oracle: the blessing button's x4 * x5^L (N.js; divinity.ts getGodCost is unexported, so the values are pinned).
  it.each([
    ['Snehebatu', 1, 10],
    ['Snehebatu', 2, 17.5],
    ['Arctis', 1, 10],
    ['Nobisect', 1, 10000],
    ['Kattlekruk', 1, 1e9]
  ])('charge %s level %s at %s', (name, level, cost) => {
    expect(costAt(godNamed(name), level)).toBe(cost);
  });

  it.each([
    ['Snehebatu', '1.15e25'],
    ['Arctis', '10,211,421']
  ])('print the level 100 cost of %s as %s', (name, printed) => {
    expect(formatAmount(costAt(godNamed(name), 100))).toBe(printed);
  });

  // The blessing button's currency per slot (research section 13).
  it('charge each god in its own currency', () => {
    expect(Object.fromEntries(changed('god:').map((id) => [nodes[id].name, costsAt(nodes[id], 1)[0].currency]))).toEqual({
      Snehebatu: 'Bits',
      Arctis: 'Sailing loot (treasure 1)',
      Nobisect: 'Bits',
      Harriep: 'Coins',
      Goharut: 'Bits',
      Omniphau: 'Particles',
      Purrmep: 'Coins',
      Flutterbis: 'Particles',
      Kattlekruk: 'Bits',
      Bagur: 'Particles'
    });
  });

  // Oracle: Divinity.js:44-62, slot 2 scales by an efficiency factor and has no 500 cap.
  it('leave Nobisect uncapped with its scaling, and only Nobisect', () => {
    expect(godNamed('Nobisect').effect.cap).toBeNull();
    expect(changed('god:').filter((id) => fieldOf(nodes[id], 'Blessing scaling'))).toEqual(['god:DivGod2']);
  });
});

describe('artifacts', () => {
  it('enrich every artifact', () => {
    expect(changed('artifact:')).toEqual(Object.keys(before).filter((id) => id.startsWith('artifact:')).sort());
  });

  it('list the forms and the base find odds', () => {
    expect(nodes['artifact:Arti0']).toEqual({
      ...before['artifact:Arti0'],
      fields: [
        { label: 'Ancient form', value: 'All shrines level up +100% faster!' },
        { label: 'Eldritch form', value: 'All shrines level up +200% faster!' },
        { label: 'Sovereign form', value: 'All shrines level up +300% faster!' },
        { label: 'Omnipotent form', value: 'All shrines level up +400% faster!' },
        { label: 'Transcendent form', value: 'All shrines level up +500% faster!' },
        { label: 'Base find odds per chest', value: '1 in 5' }
      ]
    });
  });

  it('group the odds of the rarest artifact', () => {
    const enigma = Object.values(nodes).find((node) => node.kind === 'artifact' && node.name === 'Enigma_Fragment');
    expect(fieldOf(enigma, 'Base find odds per chest')).toBe('1 in 1,500,000,000');
  });
});

describe('superbits', () => {
  // The mirror of the palette pages' "Doubled by superbit" pairs.
  it('name the Palette colour each of six superbits doubles', () => {
    expect(changed('superbit:').map((id) => [spaced(nodes[id].name), fieldOf(nodes[id], 'Doubles the Palette colour')])).toEqual([
      ['Peachier Peach', 'Peachy Pink'],
      ['Bluer Ocean', 'Ocean Blue'],
      ['Redder Orange', 'Red Orange'],
      ['Further Offcolour', 'Offwhite'],
      ['Everybody Talks', 'Neon Tree'],
      ['Babbiest Blue', 'Babby Blue']
    ]);
  });
});
