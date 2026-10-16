import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { cleanVaultName, vaultId, vaultNodes, vaultTemplate } from '../../scripts/entity-graph/nodes/vault.mjs';
import { costAt, levelledText } from '../../utility/wiki/effects.mjs';
import { vaultEdges } from '../../scripts/entity-graph/edges/vault.mjs';
import { glimboEdges } from '../../scripts/entity-graph/edges/glimbo.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

const upgrade = (overrides) => ({ name: 'Monster_Tax', x5: 2, maxLevel: 500, unlockLevel: 13, description: '', ...overrides });

describe('vault names', () => {
  it('strips the in-font glyphs, the tap hint and the live-total marker', () => {
    expect(cleanVaultName('Natural_Talent_製_(Tap_for_Info)')).toBe('Natural_Talent');
    expect(cleanVaultName('Mining_Payday$_製')).toBe('Mining_Payday');
  });

  it('uses underscores for the one name that has a space', () => {
    expect(cleanVaultName('Storage Slots')).toBe('Storage_Slots');
  });
});

// The old sentences read each upgrade at level 1; the template is read the same way through the level field.
describe('vault descriptions', () => {
  const read = (overrides, index, fills, level = 1) => {
    const entry = upgrade(overrides);
    const node = vaultNodes(Object.assign([], { [index]: entry }), {
      wikiTables: { vaultUpgradeBonus: data.wikiTables.vaultUpgradeBonus, ...(fills ? { vaultRowFills: fills } : {}) }
    })[vaultId(index)];
    return levelledText(node, level);
  };

  // Without the table no upgrade can tell whether it steps, so none prints a bonus rather than a wrong one.
  it('leaves the bonus out without the vaultUpgradeBonus table', () => {
    const node = vaultNodes([upgrade({ description: '+{%_Coins_dropped_by_Monsters._Spend_wisely!' })], {})[vaultId(0)];
    expect(levelledText(node, 500)).toBe('Spend wisely!');
  });

  it('fills a bonus at the level, the upgrade base per level', () => {
    expect(read({ description: '+{%_Coins_dropped_by_Monsters.' }, 2)).toBe('+2% Coins dropped by Monsters.');
    expect(read({ description: '+{%_Coins_dropped_by_Monsters.' }, 2, null, 10)).toBe('+20% Coins dropped by Monsters.');
  });

  it('fills a multiplier as one plus the percentage', () => {
    expect(read({ x5: 2, description: '}x_higher_bonuses_from_Stamps' }, 16)).toBe('1.02x higher bonuses from Stamps.');
  });

  it('drops a live total clause and keeps the sentence before it', () => {
    const description = '+{%_Coins_per_recipe_unlocked_from_Taskboard!_Total_bonus:+$%_Coins';
    expect(read({ x5: 1, description }, 34)).toBe('+1% Coins per recipe unlocked from Taskboard!');
  });

  it('drops a live total that has no sentence break before it', () => {
    expect(read({ x5: 2, description: '+{%_Coins_from_Monsters_per_POW_10_Poop_Kills_$%_Coins' }, 31))
      .toBe('+2% Coins from Monsters per POW 10 Poop Kills.');
  });

  it('drops a parenthesised live total but keeps what follows it', () => {
    const description = 'Boosts_Coins_based_on_total_ores_mined_(Total:+^%)_Go_do_the_mining!';
    expect(read({ x5: 2, description }, 17)).toBe('Boosts Coins based on total ores mined. Go do the mining!');
  });

  it('turns the Major Discount placeholder into the real discount at the level', () => {
    const description = 'All_upgrades_in_the_Vault_are_$%_cheaper__';
    expect([read({ x5: 4, description }, 13, data.wikiTables.vaultRowFills), read({ x5: 4, description }, 13, data.wikiTables.vaultRowFills, 80)])
      .toEqual(['All upgrades in the Vault are 3.85% cheaper.', 'All upgrades in the Vault are 76.19% cheaper.']);
  });

  // The max is a row, not a cap on the level field: a bundle and Glimbo's trades raise it (N.js:106396).
  it('keeps the base max level and the unlock level as rows, and no unlock row for zero', () => {
    const node = (unlockLevel) => vaultNodes([upgrade({ unlockLevel, description: '+{_Damage.' })], {})[vaultId(0)];
    expect([node(13).fields, node(0).fields, node(13).effect.cap]).toEqual([
      [{ label: 'Base max level', value: 500 }, { label: 'Unlocks at', value: '13 total upgrade levels' }],
      [{ label: 'Base max level', value: 500 }],
      null
    ]);
  });

  it('cuts Quest KAPOW before the star talent base it cannot know', () => {
    const description = "Raises_the_max_LV_of_the_star_talent_to_{_You'll_see_this_star_talent_on_Page_1.";
    expect(vaultTemplate(upgrade({ description }), 49, data.wikiTables.vaultRowFills))
      .toBe("Raises_the_max_LV_of_the_star_talent._You'll_see_this_star_talent_on_Page_1.");
  });
});

describe('vault nodes', () => {
  const vault = [upgrade({ name: 'Bigger_Damage', description: '+{_Damage.', x5: 1, unlockLevel: 0 }), { name: 'Filler' }];

  it('keys a page by vault index and points at the game icon', () => {
    expect(vaultNodes(vault)['vault:VaultUpg0']).toMatchObject({
      kind: 'vault', rawName: 'VaultUpg0', name: 'Bigger_Damage', icon: '/data/VaultUpg0.png', order: 0
    });
  });

  it('skips placeholder rows', () => {
    expect(Object.keys(vaultNodes(vault))).toEqual(['vault:VaultUpg0']);
  });
});

describe('vault edges', () => {
  const research = [];
  research[26] = ['0', '1', '99'];
  research[27] = ['Coral3', 'Ladle', 'SilverPen'];
  const vault = [upgrade({ name: 'Bigger_Damage' }), upgrade({ name: 'Natural_Talent_製_(Tap_for_Info)' })];

  // SilverPen's trade names vault index 99, which is no upgrade, so it has no edge.
  it('links an upgrade to each item that raises its max level', () => {
    expect(vaultEdges(research, vault, data)).toEqual([
      { from: vaultId(0), to: 'item:Coral3', rel: 'maxRaisedBy', meta: {}, source: 'vault' },
      { from: vaultId(1), to: 'item:Ladle', rel: 'maxRaisedBy', meta: {}, source: 'vault' }
    ]);
  });

  it('emits nothing without research data', () => {
    expect(vaultEdges(undefined, vault, data)).toEqual([]);
  });
});

// Built straight from the generated data rather than entity-graph.json, so it checks these builders
// whether or not the graph has been rebuilt since.
describe('on the real data', () => {
  const dataDir = path.join(process.cwd(), 'data', 'website-data');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf-8'));
  const upgradeVault = read('shared-data.json').upgradeVault;
  const research = read('research.json');
  const nodes = vaultNodes(upgradeVault, data);
  const edges = vaultEdges(research, upgradeVault, data);

  it('gives every upgrade a page', () => {
    expect(Object.keys(nodes)).toHaveLength(upgradeVault.length);
  });

  // The two rows the vault panel fills its own way: the discount figure, and the star talent row cut before its `{`.
  // The old sentences printed these at level 1, with the base max level and the unlock after them.
  it('fills Major Discount and Quest KAPOW from the panel rows', () => {
    const at = (id) => [levelledText(nodes[id], 1), nodes[id].effect.cap, nodes[id].fields];
    expect([at('vault:VaultUpg13'), at('vault:VaultUpg49')]).toEqual([
      ['All upgrades in the Vault are 3.85% cheaper.', null, [{ label: 'Base max level', value: 80 }, { label: 'Unlocks at', value: '240 total upgrade levels' }]],
      ["Raises the max LV of the star talent. You'll see this star talent on Page 1.", null,
        [{ label: 'Base max level', value: 200 }, { label: 'Unlocks at', value: '2240 total upgrade levels' }]]
    ]);
  });

  it('leaves no placeholder, glyph or hint in any name or level-one text', () => {
    for (const node of Object.values(nodes)) {
      expect(node.name).not.toMatch(/[船般航舞製$\s]|Tap_for/);
      expect(levelledText(node, 1)).toMatch(/^[^{}$^&~@;]+$/);
    }
  });

  // Oracles: Summoning VaultUpgBonus and VaultUpgCost with no Vault Mastery and no discount, the game's own expressions.
  const gameBonus = (index, level) => {
    const x5 = upgradeVault[index].x5;
    if (index === 0) return level * x5 + Math.max(0, level - 25) + Math.max(0, level - 50) + Math.max(0, level - 100);
    if (index === 60) {
      return (level * x5 + Math.max(0, level - 25) + Math.max(0, level - 50) + 2 * Math.max(0, level - 100) + 3 * Math.max(0, level - 200)
        + 5 * Math.max(0, level - 300) + 7 * Math.max(0, level - 400) + 10 * Math.max(0, level - 450)) * (1 + Math.floor(level / 25) / 5);
    }
    return level * x5;
  };
  const gameCost = (index, level) => {
    const { x1, x2 } = upgradeVault[index];
    const base = level + (x1 + level) * Math.pow(x2, level);
    return index < 33 ? base : Math.pow(1.1, Math.max(0, index - 61)) * base;
  };

  it.each([[0, 1], [0, 30], [0, 500], [60, 1], [60, 120], [60, 500], [2, 77], [80, 250]])('upgrade %s at level %s reads the game bonus', (index, level) => {
    expect(levelledText(nodes[vaultId(index)], level)).toContain(gameBonus(index, level).toLocaleString('en-US', { maximumFractionDigits: 2 }));
  });

  it.each([[0, 0], [0, 99], [13, 40], [61, 10], [62, 10], [89, 5]])('upgrade %s at level %s costs the game price before discounts', (index, level) => {
    expect(costAt(nodes[vaultId(index)], level + 1)).toBe(gameCost(index, level));
  });

  it('points every icon at art that exists', () => {
    for (const node of Object.values(nodes)) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', node.icon)), node.icon).toBe(true);
    }
  });

  it('gives every page a distinct name, so no slug needs a suffix', () => {
    const names = Object.values(nodes).map((node) => node.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  // The vault page and Glimbo's trade row must agree, or an item would name one upgrade and link
  // to another. Reading the name off nodes[edge.from] also proves every edge has a vault page.
  it('raises the same upgrade as each Glimbo trade', () => {
    const trades = glimboEdges(research, upgradeVault, data);
    expect(edges).toHaveLength(trades.length);
    edges.forEach((edge, position) => {
      expect(edge.to).toBe(trades[position].to);
      expect(nodes[edge.from].name).toBe(trades[position].meta.upgrade);
    });
  });
});
