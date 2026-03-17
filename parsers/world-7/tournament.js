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

  // Determine bracket start size from global.B registrations per division.
  // OptLacc[495] can be stale (player promoted since matches were played),
  // so we first parse matches, then verify using bracket positions.
  const divisionsB = serverTournament?.global?.B ?? [];

  // Parse match history from _T_RES_UID data
  // Qualifying vs bracket is determined by the lives field format (matching game code N.js:119781):
  //   - Qualifying: lives is a plain number (3, 2, 1) — has hearts
  //   - Bracket: lives is "roundIdx_position" (e.g. "0_112") — no hearts, single elimination
  const rawMatches = serverTournament?.match?.d ?? [];
  const parsedMatches = rawMatches.map((matchStr) => {
    try {
      const parsed = JSON.parse(matchStr);
      const livesField = String(parsed[0]?.[2] ?? '0');
      const isQualifying = !livesField.includes('_');
      const roundIndex = isQualifying ? -1 : parseInt(livesField.split('_')[0], 10);
      const bracketPosition = isQualifying ? -1 : parseInt(livesField.split('_')[1], 10);
      return { parsed, livesField, isQualifying, roundIndex, bracketPosition };
    } catch { return null; }
  }).filter(Boolean);

  // Find the correct division: use OptLacc[495] first, but if bracket positions
  // don't fit, scan global.B for a division whose bracket accommodates them.
  const maxBracketPos = parsedMatches.reduce((max, m) =>
    m.roundIndex === 0 ? Math.max(max, m.bracketPosition) : max, -1);

  let bracketStartSize = 0;
  const initialRegs = divisionsB[divisionIndex] ?? 0;
  const initialBracket = initialRegs > 1 ? getBracketStartSize(initialRegs) : 0;

  if (maxBracketPos < 0 || (initialBracket > 0 && maxBracketPos < initialBracket / 2)) {
    // No bracket matches or initial division fits — use it
    bracketStartSize = initialBracket;
  } else {
    // Initial division doesn't fit — find the first (lowest index) division that does
    for (let i = 0; i < divisionsB.length; i++) {
      if (divisionsB[i] > 1) {
        const bs = getBracketStartSize(divisionsB[i]);
        if (maxBracketPos < bs / 2) {
          bracketStartSize = bs;
          break;
        }
      }
    }
    // If none found, use the largest available
    if (bracketStartSize === 0) {
      for (const regs of divisionsB) {
        if (regs > 1) bracketStartSize = Math.max(bracketStartSize, getBracketStartSize(regs));
      }
    }
  }

  const matches = parsedMatches.map(({ parsed, isQualifying, roundIndex }, matchIdx) => {
    try {
      const playerTeam = parsed[0] ?? [];
      const opponentTeam = parsed[1] ?? [];
      const battleSequence = parsed[2] ?? [];

      const playerName = playerTeam[0] ?? '';
      const livesField = String(playerTeam[2] ?? '0');
      const playerLives = isQualifying ? Number(livesField) : 0;
      const playerPets = playerTeam.slice(3).map(Number);

      const opponentName = opponentTeam[0] ?? 'Unknown';
      const oppLivesField = String(opponentTeam[2] ?? '0');
      const opponentLives = !oppLivesField.includes('_') ? Number(oppLivesField) : 0;
      const opponentPets = opponentTeam.slice(3).map(Number);

      const battleRounds = parseBattleRounds(battleSequence, playerPets, opponentPets);
      const roundName = bracketStartSize > 0 ? getRoundName(roundIndex, bracketStartSize) : (roundIndex === -1 ? 'Open Qual' : `Bracket Round ${roundIndex + 1}`);
      return { matchIdx, roundIndex, roundName, playerName, playerLives, playerPets, opponentName, opponentLives, opponentPets, battleRounds, isQualifying };
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

  // Determine win/loss:
  // - Qualifying: compare lives against next qualifying match; fewer lives = lost that match
  // - Bracket: single elimination, infer from battle deaths
  const matchesWithResult = matches.map((match, idx) => {
    let result;
    if (match.isQualifying) {
      const next = matches[idx + 1];
      if (next?.isQualifying) {
        result = next.playerLives < match.playerLives ? 'loss' : 'win';
      } else {
        // Last qualifying match — survived to bracket means win, otherwise infer from battle
        result = next ? 'win' : inferResultFromBattle(match.battleRounds);
      }
    } else {
      // Bracket matches are single elimination — infer from battle
      result = inferResultFromBattle(match.battleRounds);
    }
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
