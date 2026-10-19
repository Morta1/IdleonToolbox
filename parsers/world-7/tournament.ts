import type { IdleonData, Account } from '../types';
import { tournyStuff, companions as companionsData } from '@website-data';
import LavaRand from '../../utility/lavaRand';

// The game only offers the daily Pet Mart gems while the GemPM_x server var is at least 0.1.
const MIN_PET_MART_GEMS_SERVER_VAR = 0.1;

// The Pet Mart's free daily gems. Claimable once per shop day: OptLacc[516] holds the last shop day
// claimed, and claiming sets it to getShopDay() (the _TOURNAMENT doc's global.S). The amount is the
// game's "GemRewardfromPetMart": Rand seeded with the shop day, so every player gets the same roll,
// scaled by GemPM_x. LavaRand matched the live game's roll on 32 seeds and this formula on 6 days.
export const getPetMartGems = (shopDay: number, lastClaimedShopDay: number, multiplier: number) => {
  const offered = multiplier >= MIN_PET_MART_GEMS_SERVER_VAR && shopDay >= 1;
  if (!offered) return { offered, claimable: false, amount: 0 };
  const roll = new LavaRand(Math.round(shopDay)).rand();
  const amount = Math.round(Math.min(500, Math.min(150, Math.max(10, 10 + Math.floor(130 * Math.pow(roll, 10)) + 10 * roll)) * multiplier));
  return { offered, claimable: lastClaimedShopDay < shopDay, amount };
};

// Each battle entry is "aXb+" (opponent dies) or "aXb-" (player dies)
// a/b are position indices into the playerPets/opponentPets arrays
const parseBattleRounds = (rawSeq: any[], playerPets: number[], opponentPets: number[]) => {
  const rounds: { playerDbIdx: number; opponentDbIdx: number; playerWins: boolean }[][] = [];
  let current: { playerDbIdx: number; opponentDbIdx: number; playerWins: boolean }[] = [];
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

// Every division's bracket starts at 1024: the game's round titles are images,
// TournyBracketSubTitle{division}_{roundIndex + 1}, and all five divisions read
// Open Qualification, Round of 1024 ... Round of 16, Quarterfinals, Semifinals, The Final.
const TOURNAMENT_BRACKET_SIZE = 1024;
const NAMED_ROUNDS: Record<number, string> = { 8: 'Quarterfinals', 4: 'Semifinals', 2: 'The Final' };

const getRoundName = (roundIndex: number): string => {
  if (roundIndex < 0) return 'Open Qualification';
  const size = Math.round(TOURNAMENT_BRACKET_SIZE / Math.pow(2, roundIndex));
  return NAMED_ROUNDS[size] ?? `Round of ${size}`;
};

// game: getTournamentDay(). The save's copy (OptionsListAccount[496]) only refreshes when the
// tournament UI opens, and the global doc's T can lag a snapshot behind, so the newer one wins.
export const getCurrentTournamentDay = (accountOptions: any, serverGlobal: any): number =>
  Math.max(Number(accountOptions?.[496]) || 0, Number(serverGlobal?.T) || 0);

export const getTournament = (idleonData: IdleonData, account: Account, serverTournament: any, serverVars?: any) => {
  const accountOptions = (account as any)?.accountOptions;

  // Division tier from OptLacc[495]; user.r is the player's rank WITHIN the division (not the tier)
  const divisionIndex = accountOptions?.[495] ?? 0;
  const playerRank = serverTournament?.user?.r ?? null;
  const matchDay = serverTournament?.user?.l ?? accountOptions?.[493] ?? 0;
  const tournamentDay = getCurrentTournamentDay(accountOptions, serverTournament?.global);
  const registrationCount = accountOptions?.[498] ?? 0;

  // Parse match history from _T_RES_UID data
  // Qualifying vs bracket is determined by the lives field format (matching game code N.js:119781):
  //   - Qualifying: lives is a plain number (3, 2, 1) -- has hearts
  //   - Bracket: lives is "roundIdx_position" (e.g. "0_112") -- no hearts, single elimination
  const rawMatches = serverTournament?.match?.d ?? [];
  const parsedMatches = rawMatches.map((matchStr: string) => {
    try {
      const parsed = JSON.parse(matchStr);
      const livesField = String(parsed[0]?.[2] ?? '0');
      const isQualifying = !livesField.includes('_');
      const roundIndex = isQualifying ? -1 : parseInt(livesField.split('_')[0], 10);
      const bracketPosition = isQualifying ? -1 : parseInt(livesField.split('_')[1], 10);
      return { parsed, livesField, isQualifying, roundIndex, bracketPosition };
    } catch { return null; }
  }).filter(Boolean) as { parsed: any; livesField: string; isQualifying: boolean; roundIndex: number; bracketPosition: number }[];

  const matches = parsedMatches.map(({ parsed, isQualifying, roundIndex }, matchIdx: number) => {
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
      const roundName = getRoundName(roundIndex);
      return { matchIdx, roundIndex, roundName, playerName, playerLives, playerPets, opponentName, opponentLives, opponentPets, battleRounds, isQualifying };
    } catch {
      return null;
    }
  }).filter(Boolean) as any[];

  // A match ends when one team is wiped, so its last kill decides it: "+" means the opponent's pet died.
  const matchesWithResult = matches.map((match: any) => {
    const lastStep = match.battleRounds.at(-1)?.at(-1);
    const result = !lastStep ? 'unknown' : lastStep.playerWins ? 'win' : 'loss';
    return { ...match, result };
  });

  // Parse leaderboard entries: "name,points,...companionIndices"
  const rawLeaderboard = serverTournament?.leaderboard ?? [];
  const leaderboard = rawLeaderboard.map((entryStr: string, rank: number) => {
    const parts = entryStr.split(',');
    const name = parts[0];
    const points = parseInt(parts[1], 10) || 0;
    const companionIndices = parts.slice(2).map(Number);
    const totalTourPower = companionIndices.reduce((sum: number, idx: number) => sum + ((companionsData as any)?.[idx]?.tourPower ?? 0), 0);
    return { rank: rank + 1, name, points, companionIndices, totalTourPower };
  });

  const playerName = matches[0]?.playerName ?? null;

  // Tournament Pet Mart. The _TOURNAMENT doc carries today's rotation of five pets per counter:
  // I/B/A for the base shop and LI/LB/LA for Pet Mart+ (the "+" upgrade of a pet you already own),
  // each a companion index, its list price and its price after today's discount. Prices are Pet
  // Crystals: the game gates purchaseLevelUp on getMyStars() >= LA[i], and getMyStars is the _comp
  // doc's `s`, the field getCompanions exposes as petCrystals. The + list price is CompanionDB[i][8]
  // (companions.upgradeCost); the server copy is what the shop actually charges, so it wins here.
  const global = serverTournament?.global;
  const readOffers = (ids: any, listPrices: any, prices: any) => (Array.isArray(ids) ? ids : [])
    .map((rawIndex: any, i: number) => {
      const companionIndex = Number(rawIndex);
      const listPrice = Number(listPrices?.[i]);
      const price = Number(prices?.[i]);
      if (!Number.isInteger(companionIndex) || !Number.isFinite(price)) return null;
      return {
        companionIndex,
        name: companionsData?.[companionIndex]?.name ?? null,
        listPrice: Number.isFinite(listPrice) ? listPrice : price,
        price
      };
    })
    .filter(Boolean);
  const shopDay = global?.S ?? 0;
  const petMart = {
    shopDay,
    gems: getPetMartGems(shopDay, Number(accountOptions?.[516]) || 0, Number(serverVars?.GemPM_x) || 0),
    petCrystals: (account as any)?.companions?.petCrystals ?? 0,
    offers: readOffers(global?.I, global?.B, global?.A),
    plusOffers: readOffers(global?.LI, global?.LB, global?.LA)
  };

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
    petMart,
    global: serverTournament?.global ?? null,
  };
};
