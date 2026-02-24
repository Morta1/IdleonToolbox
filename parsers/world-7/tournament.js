import { tournyStuff, companions as companionsData } from '@website-data';

export const getTournament = (idleonData, account, serverTournament) => {
  const accountOptions = account?.accountOptions;

  // Division tier from OptLacc[495]; user.r is the player's rank WITHIN the division (not the tier)
  const divisionIndex = accountOptions?.[495] ?? 0;
  const playerRank = serverTournament?.user?.r ?? null;
  const matchDay = serverTournament?.user?.l ?? accountOptions?.[493] ?? 0;
  const tournamentDay = serverTournament?.global?.T ?? accountOptions?.[496] ?? 0;
  const registrationCount = accountOptions?.[498] ?? 0;

  // Parse match history from _T_RES_UID data
  const rawMatches = serverTournament?.match?.d ?? [];
  const matches = rawMatches.map((matchStr, matchIdx) => {
    try {
      const parsed = JSON.parse(matchStr);
      const playerTeam = parsed[0] ?? [];
      const opponentTeam = parsed[1] ?? [];
      const battleSequence = parsed[2] ?? [];

      const playerName = playerTeam[0] ?? '';
      const playerLives = Number(playerTeam[2] ?? 0);
      const playerPets = playerTeam.slice(3).map(Number);

      const opponentName = opponentTeam[0] ?? 'Unknown';
      const opponentLives = Number(opponentTeam[2] ?? 0);
      const opponentPets = opponentTeam.slice(3).map(Number);

      return { matchIdx, playerName, playerLives, playerPets, opponentName, opponentLives, opponentPets, battleSequence };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Determine win/loss: if next match shows fewer player lives, the current match was a loss
  const matchesWithResult = matches.map((match, idx) => {
    const next = matches[idx + 1];
    const result = next
      ? (next.playerLives < match.playerLives ? 'loss' : 'win')
      : 'unknown';
    return { ...match, result };
  });

  // Parse leaderboard entries: "name,points,...companionIndices"
  const rawLeaderboard = serverTournament?.leaderboard ?? [];
  const leaderboard = rawLeaderboard.map((entryStr, rank) => {
    const parts = entryStr.split(',');
    const name = parts[0];
    const points = parseInt(parts[1], 10) || 0;
    const companionIndices = parts.slice(2).map(Number);
    const totalTourPower = companionIndices.reduce((sum, idx) => sum + (companionsData?.[idx]?.tourPower ?? 0), 0);
    return { rank: rank + 1, name, points, companionIndices, totalTourPower };
  });

  const playerName = matches[0]?.playerName ?? null;

  return {
    divisionIndex,
    playerName,
    divisionName: tournyStuff?.divisionNames?.[divisionIndex] ?? 'Bronze',
    divisionScale: tournyStuff?.divisionScales?.[divisionIndex] ?? 200,
    divisionNames: tournyStuff?.divisionNames ?? [],
    playerRank,
    tournamentDay,
    matchDay,
    registrationCount,
    matches: matchesWithResult,
    leaderboard,
    global: serverTournament?.global ?? null,
  };
};
