import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';
import { getOptimizedLandRankUpgrades, isFifthColumnRank, LAND_RANK_GOALS } from '@parsers/world-6/farming';
import { getVoteBonus } from '@parsers/world-2/voteBallot';

describe('land rank upgrade optimizer', () => {
  const { data, charNames, companion, guildData, serverVars } = raw;
  const { account } = parseData(data, charNames, companion, guildData, serverVars);
  const { ranks, totalPoints, fifthColumnMaxLevel } = account.farming;

  it('fills the requested number of upgrades with a positive gain each', () => {
    const upgrades = getOptimizedLandRankUpgrades(account, 25, { goal: 'evolution' });
    expect(upgrades).toHaveLength(25);
    upgrades.forEach((upgrade) => {
      expect(upgrade.cost).toBe(1);
      expect(upgrade.percentChange).toBeGreaterThan(0);
      expect(LAND_RANK_GOALS.evolution.upgrades).toContain(upgrade.index);
    });
  });

  it('never recommends an upgrade whose unlock threshold is out of reach', () => {
    const upgrades = getOptimizedLandRankUpgrades(account, 300, { goal: 'all' });
    upgrades.forEach(({ index }) => {
      expect(ranks[index].unlockAt).toBeLessThanOrEqual(totalPoints);
    });
  });

  // Only the 5th column is capped in game - everything else keeps taking points forever.
  it('stops filling a 5th column upgrade once it hits the cap', () => {
    const upgrades = getOptimizedLandRankUpgrades(account, 300, { goal: 'character' });
    const finalLevels = {};
    upgrades.forEach(({ index, newLevel }) => {
      finalLevels[index] = newLevel;
    });
    Object.entries(finalLevels).forEach(([index, level]) => {
      expect(isFifthColumnRank(Number(index))).toBe(true);
      expect(level).toBeLessThanOrEqual(fifthColumnMaxLevel);
    });
  });

  it('costs exactly one point per step and counts the remaining points down', () => {
    const available = account.farming.availablePoints;
    const upgrades = getOptimizedLandRankUpgrades(account, 10, { goal: 'overgrowth' });
    upgrades.forEach((upgrade, step) => {
      expect(upgrade.cumulativeCost).toBe(step + 1);
      expect(upgrade.pointsLeft).toBe(available - (step + 1));
    });
  });

  it('honours onlyAffordable by never spending more points than are banked', () => {
    const available = account.farming.availablePoints;
    const upgrades = getOptimizedLandRankUpgrades(account, available + 50, {
      goal: 'evolution',
      onlyAffordable: true
    });
    expect(upgrades.length).toBeLessThanOrEqual(available);
  });

  // The greedy walk is only valid because every upgrade is concave (or linear and capped) in its
  // own level. Brute-forcing every allocation of a small budget proves the walk is optimal, not
  // merely plausible.
  it('matches an exhaustive search of every allocation of a small budget', () => {
    const budget = 8;
    const goal = 'evolution';
    const indices = LAND_RANK_GOALS[goal].upgrades.filter((index) => ranks[index].unlockAt <= totalPoints);
    const rankMulti = account.farming.rankMulti;
    const plotRanks = account.farming.plot.filter(({ seedType }) => seedType !== -1).map(({ rank }) => rank ?? 0);
    const voteBonus = getVoteBonus(account, 29);
    const bonusOf = (index, level) => rankMulti * (isFifthColumnRank(index)
      ? ranks[index].base * level
      : (1.7 * ranks[index].base * level) / (level + 80));
    const score = (levels) => {
      const shared = (1 + bonusOf(3, levels[3]) / 100)
        * (1 + bonusOf(10, levels[10]) / 100)
        * (1 + bonusOf(15, levels[15]) / 100);
      return plotRanks.reduce((sum, rank) => sum + shared * (1 + (bonusOf(0, levels[0]) * rank + voteBonus) / 100), 0);
    };

    const base = {};
    indices.forEach((index) => {
      base[index] = ranks[index].upgradeLevel ?? 0;
    });

    let bestScore = score(base);
    const search = (position, left, levels) => {
      if (position === indices.length) {
        if (left === 0) bestScore = Math.max(bestScore, score(levels));
        return;
      }
      const index = indices[position];
      for (let spend = 0; spend <= left; spend++) {
        search(position + 1, left - spend, { ...levels, [index]: levels[index] + spend });
      }
    };
    search(0, budget, base);

    const greedy = getOptimizedLandRankUpgrades(account, budget, { goal });
    const greedyLevels = { ...base };
    greedy.forEach(({ index }) => {
      greedyLevels[index] += 1;
    });
    expect(greedy).toHaveLength(budget);
    expect(score(greedyLevels)).toBeCloseTo(bestScore, 10);
  });

  // Every plot on this save computes ~100x past the game's crop multiplier cap, so more crop value
  // bonus buys literally nothing. The plan has to say so rather than invent a fraction of a percent.
  it('recommends nothing for a goal that is already at the game cap', () => {
    const upgrades = getOptimizedLandRankUpgrades(account, 100, { goal: 'cropValue' });
    expect(upgrades).toHaveLength(0);
  });

  // The evolution cap is per crop type, not a ceiling on the bonus - scoring it capped would call
  // the whole evolution branch worthless the moment every plot hits 100% on its current crop.
  it('still plans evolution upgrades even with every plot at 100% on its current crop', () => {
    const upgrades = getOptimizedLandRankUpgrades(account, 100, { goal: 'evolution' });
    expect(upgrades).toHaveLength(100);
  });
});
