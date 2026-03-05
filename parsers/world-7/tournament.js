import { tournyStuff, companions as companionsData } from '@website-data';

// Each battle entry is "aXb+" (opponent dies) or "aXb-" (player dies)
// a/b are position indices into the playerPets/opponentPets arrays
const parseBattleRounds = (rawSeq, playerPets, opponentPets) => {
  const rounds = [];
  let current = [];
  for (const entry of rawSeq) {
    if (entry === '_') {
      if (current.length) rounds.push(current);
      current = [];
      continue;
    }
    const playerWins = entry.endsWith('+');
    const core = entry.slice(0, -1);
    const xi = core.indexOf('x');
    const pPos = parseInt(core.slice(0, xi), 10);
    const oPos = parseInt(core.slice(xi + 1), 10);
    current.push({
      playerDbIdx: playerPets[pPos] ?? -1,
      opponentDbIdx: opponentPets[oPos] ?? -1,
      playerWins,
    });
  }
  if (current.length) rounds.push(current);
  return rounds;
};

// Bracket start size: largest power of 2 ≤ registrationCount / 2
// e.g. Bronze 3500 → 3500/2=1750 → 2^10=1024
const getBracketStartSize = (registrationCount) =>
  Math.pow(2, Math.floor(Math.log2(registrationCount / 2)));

const getRoundName = (roundIndex, bracketStartSize) => {
  if (roundIndex === -1) return 'Open Qual';
  const size = Math.round(bracketStartSize / Math.pow(2, roundIndex));
  return `Round of ${size}`;
};

export const getTournament = (idleonData, account, serverTournament) => {
  const accountOptions = account?.accountOptions;

  // Division tier from OptLacc[495]; user.r is the player's rank WITHIN the division (not the tier)
  const divisionIndex = accountOptions?.[495] ?? 0;
  const playerRank = serverTournament?.user?.r ?? null;
  const matchDay = serverTournament?.user?.l ?? accountOptions?.[493] ?? 0;
  const tournamentDay = serverTournament?.global?.T ?? accountOptions?.[496] ?? 0;
  const registrationCount = accountOptions?.[498] ?? 0;

  // Bracket start size derived from registration count per division (global.B)
  const divisionRegistrations = serverTournament?.global?.B?.[divisionIndex] ?? 0;
  const bracketStartSize = divisionRegistrations > 1 ? getBracketStartSize(divisionRegistrations) : 0;

  // Parse match history from _T_RES_UID data
  const rawMatches = serverTournament?.match?.d ?? [];
  const matches = rawMatches.map((matchStr, matchIdx) => {
    try {
      const parsed = JSON.parse(matchStr);
      const playerTeam = parsed[0] ?? [];
      const opponentTeam = parsed[1] ?? [];
      const battleSequence = parsed[2] ?? [];

      const playerName = playerTeam[0] ?? '';
      const livesRaw = String(playerTeam[2] ?? '0');
      const isQualifying = !livesRaw.includes('_');
      const roundIndex = isQualifying ? -1 : Number(livesRaw.split('_')[0]);
      const playerLives = isQualifying ? Number(livesRaw) : Number(livesRaw.split('_')[1]);
      const playerPets = playerTeam.slice(3).map(Number);

      const opponentName = opponentTeam[0] ?? 'Unknown';
      const opponentLives = Number(opponentTeam[2] ?? 0);
      const opponentPets = opponentTeam.slice(3).map(Number);

      const battleRounds = parseBattleRounds(battleSequence, playerPets, opponentPets);
      const roundName = bracketStartSize > 0 ? getRoundName(roundIndex, bracketStartSize) : (roundIndex === -1 ? 'Open Qual' : null);
      return { matchIdx, roundIndex, roundName, playerName, playerLives, playerPets, opponentName, opponentLives, opponentPets, battleRounds };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // For the last match, infer result from total deaths (more deaths = loss)
  const inferResultFromBattle = (battleRounds) => {
    let playerDeaths = 0, opponentDeaths = 0;
    for (const round of battleRounds) {
      for (const step of round) {
        step.playerWins ? opponentDeaths++ : playerDeaths++;
      }
    }
    if (playerDeaths === 0 && opponentDeaths === 0) return 'unknown';
    return playerDeaths > opponentDeaths ? 'loss' : 'win';
  };

  // Determine win/loss: compare lives against next match; use battle deaths for the last match
  const matchesWithResult = matches.map((match, idx) => {
    const next = matches[idx + 1];
    const result = next
      ? (next.playerLives < match.playerLives ? 'loss' : 'win')
      : inferResultFromBattle(match.battleRounds);
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
