import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getExoticMarketBonus } from '@parsers/world-6/farming';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getMenagerieMissionSources, MENAGERIE_MISSION_COUNT } from '@parsers/world-7/menagerie';

// Caps the game applies where a bonus is used, never shown on the upgrade itself.
// Sources are every term inside the game's Math.min, so the total is what the cap is checked against.

export interface HiddenCapSource {
  name: string;
  value: number;
}

export interface HiddenCap {
  cap: number;
  total: number;
  unit: 'percent' | 'missions';
  sources: HiddenCapSource[];
}

type CapSystem = 'palette' | 'exotic' | 'grid';

const paletteSource = (account: any, index: number): HiddenCapSource => ({
  name: account?.gaming?.palette?.[index]?.name ?? `Palette ${index}`,
  value: getPaletteBonus(account, index)
});

const exoticSource = (account: any, index: number): HiddenCapSource => ({
  name: account?.farming?.exoticMarket?.[index]?.name ?? `Exotic ${index}`,
  value: getExoticMarketBonus(account, index)
});

const gridSource = (account: any, index: number, mode = 0): HiddenCapSource => ({
  name: account?.research?.gridSquares?.[index]?.name ?? `Grid ${index}`,
  value: getResearchGridBonus(account, index, mode)
});

// game: "PaletteBonus" 17 + "ExoticBonusQTY" 46 share min(1, floor(rand + x / 100)), the 2x Snail Mail roll
const doubleSnailMail = (account: any) => ({ cap: 100, sources: [paletteSource(account, 17), exoticSource(account, 46)] });

const CAPS: Record<CapSystem, Record<number, (account: any) => { cap: number; unit?: HiddenCap['unit']; sources: HiddenCapSource[] }>> = {
  palette: {
    // game: min(0.75, (ImportItemBonus(5) + PaletteBonus(9)) / 100), the free Log Game roll
    9: (account) => ({
      cap: 75,
      sources: [paletteSource(account, 9), {
        name: account?.gaming?.imports?.[5]?.name ?? 'Gaming import',
        value: account?.gaming?.imports?.[5]?.bonus ?? 0
      }]
    }),
    // game: min(0.82, SaveSprinkler + PaletteBonus(16) / 100)
    16: (account) => ({
      cap: 82,
      sources: [paletteSource(account, 16), {
        name: 'Golden Sprinkler',
        value: account?.gaming?.imports?.[0]?.saveSprinklerChance ?? 0
      }]
    }),
    17: doubleSnailMail,
    // game: min(3, floor(rand + PaletteBonus(33) / 100)) extra ribbons a day
    33: (account) => ({ cap: 300, sources: [paletteSource(account, 33)] })
  },
  exotic: {
    46: doubleSnailMail
  },
  grid: {
    // game: floor(min(2, rand + (Grid_Bonus(69) + RoG_BonusQTY(29)) / 100)) tiers up
    69: (account) => ({
      cap: 200,
      sources: [gridSource(account, 69), { name: 'Jelly Operator', value: getJellyBonus(account, 29) }]
    }),
    164: (account) => ({ cap: MENAGERIE_MISSION_COUNT, unit: 'missions', sources: getMenagerieMissionSources(account) }),
    // game: SushiStuff("FreeShaker") = min(0.6, (UpgradeQTY(21) + KnowledgeBonusTOT(5) + Grid_Bonus(188)) / 100)
    188: (account) => {
      const upgrade = account?.sushiStation?.upgrades?.find((upg: any) => upg?.upgradeIndex === 21);
      return {
        cap: 60,
        sources: [
          gridSource(account, 188),
          { name: upgrade?.name ?? 'Sushi upgrade', value: upgrade?.upgradeQTY ?? 0 },
          { name: 'Sushi knowledge', value: account?.sushiStation?.knowledgeTotals?.[5] ?? 0 }
        ]
      };
    },
    // game: min(2, 1 + Grid_Bonus(191) / 100 + rand) kills per Regal mob
    191: (account) => ({ cap: 100, sources: [gridSource(account, 191)] })
  }
};

export const getHiddenCap = (account: any, system: CapSystem, index: number): HiddenCap | null => {
  const entry = CAPS[system]?.[index]?.(account);
  if (!entry) return null;
  const total = entry.sources.reduce((sum, { value }) => sum + (Number(value) || 0), 0);
  return { cap: entry.cap, total, unit: entry.unit ?? 'percent', sources: entry.sources };
};
