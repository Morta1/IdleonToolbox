import { describe, it, expect } from 'vitest';
import { sortedMembers } from '../../../components/guilds/ContributorLeaderboard';

describe('sortedMembers', () => {
  it('orders by gp_earned desc', () => {
    const members = [
      { member_name: 'A', gp_earned: 100 },
      { member_name: 'B', gp_earned: 500 },
      { member_name: 'C', gp_earned: 250 }
    ];
    expect(sortedMembers(members).map(m => m.member_name)).toEqual(['B', 'C', 'A']);
  });

  it('returns [] for null input', () => {
    expect(sortedMembers(null)).toEqual([]);
  });
});
