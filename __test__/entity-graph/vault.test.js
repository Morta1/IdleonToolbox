import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { cleanVaultName, vaultDescription, vaultId, vaultNodes } from '../../scripts/entity-graph/nodes/vault.mjs';
import { vaultEdges } from '../../scripts/entity-graph/edges/vault.mjs';
import { glimboEdges } from '../../scripts/entity-graph/edges/glimbo.mjs';

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

describe('vault descriptions', () => {
  it('fills a bonus at level one, the upgrade base per level', () => {
    expect(vaultDescription(upgrade({ description: '+{%_Coins_dropped_by_Monsters.' }), 2))
      .toBe('Level 1: +2%_Coins_dropped_by_Monsters. Base max level 500. Unlocks at 13 total upgrade levels.');
  });

  it('fills a multiplier as one plus the percentage', () => {
    expect(vaultDescription(upgrade({ x5: 2, description: '}x_higher_bonuses_from_Stamps' }), 16))
      .toContain('Level 1: 1.02x_higher_bonuses_from_Stamps.');
  });

  it('drops a live total clause and keeps the sentence before it', () => {
    const description = '+{%_Coins_per_recipe_unlocked_from_Taskboard!_Total_bonus:+$%_Coins';
    expect(vaultDescription(upgrade({ x5: 1, description }), 34))
      .toContain('Level 1: +1%_Coins_per_recipe_unlocked_from_Taskboard!');
    expect(vaultDescription(upgrade({ x5: 1, description }), 34)).not.toMatch(/[$^&~]/);
  });

  it('drops a live total that has no sentence break before it', () => {
    expect(vaultDescription(upgrade({ x5: 2, description: '+{%_Coins_from_Monsters_per_POW_10_Poop_Kills_$%_Coins' }), 31))
      .toContain('Level 1: +2%_Coins_from_Monsters_per_POW_10_Poop_Kills.');
  });

  it('drops a parenthesised live total but keeps what follows it', () => {
    const description = 'Boosts_Coins_based_on_total_ores_mined_(Total:+^%)_Go_do_the_mining!';
    expect(vaultDescription(upgrade({ x5: 2, description }), 17))
      .toContain('Level 1: Boosts_Coins_based_on_total_ores_mined._Go_do_the_mining!');
  });

  it('turns the Major Discount placeholder into the real level-one discount', () => {
    expect(vaultDescription(upgrade({ x5: 4, description: 'All_upgrades_in_the_Vault_are_$%_cheaper__' }), 13))
      .toContain('are_3.85%_cheaper.');
  });

  it('omits an unlock level of zero', () => {
    expect(vaultDescription(upgrade({ unlockLevel: 0, description: '+{_Damage.' }), 0)).not.toContain('Unlocks');
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

  it('links an upgrade to each item that raises its max level', () => {
    expect(vaultEdges(research, vault)).toEqual([
      { from: vaultId(0), to: 'item:Coral3', rel: 'maxRaisedBy', meta: {}, source: 'vault' },
      { from: vaultId(1), to: 'item:Ladle', rel: 'maxRaisedBy', meta: {}, source: 'vault' }
    ]);
  });

  it('skips a trade whose vault index names no upgrade', () => {
    expect(vaultEdges(research, vault).map((edge) => edge.to)).not.toContain('item:SilverPen');
  });

  it('emits nothing without research data', () => {
    expect(vaultEdges(undefined, vault)).toEqual([]);
  });
});

// Built straight from the generated data rather than entity-graph.json, so it checks these builders
// whether or not the graph has been rebuilt since.
describe('on the real data', () => {
  const dataDir = path.join(process.cwd(), 'data', 'website-data');
  const read = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), 'utf-8'));
  const upgradeVault = read('shared-data.json').upgradeVault;
  const research = read('research.json');
  const nodes = vaultNodes(upgradeVault);
  const edges = vaultEdges(research, upgradeVault);

  it('gives every upgrade a page', () => {
    expect(Object.keys(nodes)).toHaveLength(upgradeVault.length);
  });

  it('leaves no placeholder, glyph or hint in any name or description', () => {
    for (const node of Object.values(nodes)) {
      expect(node.name).not.toMatch(/[船般航舞製$\s]|Tap_for/);
      expect(node.description).not.toMatch(/[{}$^&~@;]/);
      expect(node.description).toMatch(/^Level 1: \S/);
    }
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
  // to another.
  it('raises the same upgrade as each Glimbo trade', () => {
    const trades = glimboEdges(research, upgradeVault);
    expect(edges).toHaveLength(trades.length);
    edges.forEach((edge, position) => {
      expect(edge.to).toBe(trades[position].to);
      expect(nodes[edge.from].name).toBe(trades[position].meta.upgrade);
    });
  });

  it('points every edge at a vault page', () => {
    expect(edges.every((edge) => nodes[edge.from])).toBe(true);
  });
});
