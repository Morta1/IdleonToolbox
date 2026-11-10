import React, { useContext, useState } from 'react';
import { Box, Button, Collapse, Stack, Typography } from '@mui/material';
import Notice from '@components/common/Notice';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import { companions as companionsData } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';

const teamPower = (pets, companions) =>
  pets.reduce((sum, idx) => sum + (companions?.[idx]?.tourPower ?? 0), 0);

// Match strings and leaderboard entries carry pet indices only, no Pet Mart+ flag (checked live: the game's own
// getPlayerMatch hands the client the same plain list). Another player's pet is somewhere between its base power
// (CompanionDB[7]) and its upgraded power ([9]), so their power is that range. The player's own pets use the account list.
const petPowerRange = (comp) => ({ min: comp?.tourPower ?? 0, max: comp?.upgradedTourPower ?? comp?.tourPower ?? 0 });
export const teamPowerRange = (comps) => comps.reduce((range, comp) => {
  const { min, max } = petPowerRange(comp);
  return { min: range.min + min, max: range.max + max };
}, { min: 0, max: 0 });
const formatPower = (value) => formatGame(value, 'Stuff2.PetTournyPOW');
export const formatPowerRange = ({ min, max }) => min === max ? formatPower(min) : `${formatPower(min)} to ${formatPower(max)}`;
const formatChance = (low, high) => low === high ? `${low}%` : `${low}-${high}%`;
const chanceOf = (power, against) => power + against > 0 ? Math.round(power / (power + against) * 100) : 50;

export const UNKNOWN_UPGRADES_NOTE = 'Pet Mart+ upgrades of other players are not in the tournament data the game sends, so their '
  + 'pets show as a range: from all at base power to all upgraded. Win chances follow from the same range.';

const petLabel = (comp) => `${cleanUnderscore(comp?.name)}${comp?.upgraded ? '+' : ''}`;

// A pet: its 16 px sprite beside its name, one nowrap group, so a team wraps between pets
export const Pet = ({ comp, children }) => <Box component={'span'}
                                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
  <GameIcon src={monsterSprite(comp?.name)} size={16} alt={''}/>
  {children ?? petLabel(comp)}
</Box>;

// A team as sprites, a Pet Mart+ pet marked "+", each name a hover or tap away: a name beside every pet ran a team to
// nine lines (#24). The battle sequence keeps names, as sentences.
const PLUS_SX = { position: 'absolute', right: -3, bottom: -5, fontSize: 12, fontWeight: 700, lineHeight: 1, color: 'text.success' };
export const PetList = ({ pets }) => <Box component={'span'} sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: 0.75 }}>
  {pets.map((comp, index) => <NoteTrigger key={index} note={petLabel(comp)} label={petLabel(comp)}>
    <Box component={'span'} sx={{ position: 'relative', display: 'inline-flex' }}>
      <GameIcon src={monsterSprite(comp?.name)} size={24} alt={petLabel(comp)}/>
      {comp?.upgraded ? <Box component={'span'} aria-hidden sx={PLUS_SX}>+</Box> : null}
    </Box>
  </NoteTrigger>)}
</Box>;

// companionsFailed: the account's list failed, so the player's pets are named from the catalog and their power is "-".
// opponent: their upgrades are unknown, so the power is a range over the catalog.
const Team = ({ label, pets, companions, companionsFailed, opponent }) => {
  const list = companionsFailed || opponent ? companionsData : companions;
  const shown = (pets ?? []).map((idx) => list?.[idx]).filter(Boolean);
  const power = opponent ? formatPowerRange(teamPowerRange(shown))
    : companionsFailed ? '-' : formatPower(teamPower(pets ?? [], companions));
  return <ItemCard.Section label={label}>
    <Typography variant={'body2'} color={'text.secondary'}>
      {`${power} power`}
    </Typography>
    <Typography variant={'body2'} component={'div'}><PetList pets={shown}/></Typography>
  </ItemCard.Section>;
};

// "Your Frog 62% beat Rattle Snake 38%": the winner first, the player's pet named as theirs
const BattleStep = ({ step, playerCompanions, opponentCompanions }) => {
  const playerComp = playerCompanions?.[step.playerDbIdx];
  const opponentComp = opponentCompanions?.[step.opponentDbIdx];
  if (!playerComp || !opponentComp) return null;
  const playerPower = playerComp.tourPower ?? 0;
  const { min, max } = petPowerRange(opponentComp);
  // The player's best chance is against the opponent's pet at base power, the worst against it upgraded
  const playerLow = chanceOf(playerPower, max);
  const playerHigh = chanceOf(playerPower, min);
  const mine = <Pet comp={playerComp}>{`Your ${petLabel(playerComp)} ${formatChance(playerLow, playerHigh)}`}</Pet>;
  const theirs = <Pet comp={opponentComp}>{`${petLabel(opponentComp)} ${formatChance(100 - playerHigh, 100 - playerLow)}`}</Pet>;
  return <Typography variant={'body2'} component={'div'} sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 0.75 }}>
    {step.playerWins ? mine : theirs}<span>beat</span>{step.playerWins ? theirs : mine}
  </Typography>;
};

// ownTeam: the player's team shows on the card, where it differs between the day's matches
const MatchCard = ({ match, companionList, companionsFailed, ownTeam }) => {
  const [showBattle, setShowBattle] = useState(false);
  const hasBattle = match.battleRounds?.length > 0;
  const result = match.result === 'win' ? 'done' : match.result === 'loss' ? 'problem' : undefined;
  return <ItemCard title={`vs ${cleanUnderscore(match.opponentName)}`} meta={match.roundName ?? 'Qualifying'}
                   status={result} statusLabel={match.result === 'win' ? 'Win' : 'Loss'}>
    {match.isQualifying ? <ItemCard.Facts rows={[['Lives', formatNum(match.playerLives ?? 0)]]}/> : null}
    {ownTeam ? <Team label={'Your team'} pets={match.playerPets} companions={companionList} companionsFailed={companionsFailed}/> : null}
    <Team label={'Opponent\'s team'} pets={match.opponentPets} opponent/>
    {hasBattle && !companionsFailed ? <>
      <Button size={'small'} variant={'text'} sx={{ alignSelf: 'flex-start' }} aria-expanded={showBattle}
              onClick={() => setShowBattle((shown) => !shown)}>
        {`${showBattle ? 'Hide' : 'Show'} battle sequence (${formatNum(match.battleRounds.length)} ${match.battleRounds.length === 1 ? 'round' : 'rounds'})`}
      </Button>
      <Collapse in={showBattle}>
        <Stack gap={1.5}>
          {match.battleRounds.map((round, index) => <ItemCard.Section key={index} label={`Round ${index + 1}`}>
            {round.map((step, stepIndex) => <BattleStep key={stepIndex} step={step} playerCompanions={companionList}
                                                        opponentCompanions={companionsData}/>)}
          </ItemCard.Section>)}
        </Stack>
      </Collapse>
    </> : null}
  </ItemCard>;
};

// sectionFailed: the tournament section failed, so there is nothing to say under the page's note
const Matches = ({ tournament, companions, sectionFailed, companionsFailed }) => {
  const { state } = useContext(AppContext);
  const { matches = [] } = tournament ?? {};
  const companionList = companions ?? [];
  if (sectionFailed) return null;

  // The server sends match history to a signed-in player only
  if (!matches.length) {
    return state?.emptyAccount
      ? <Notice tone={'signin'}>Your match history shows here once you sign in.</Notice>
      : <Notice>No matches recorded this tournament day.</Notice>;
  }

  // The team the player sends is set for the day, so it was the same 22 names on every card: once above the matches
  // then, and on each card only where it changed between them
  const firstTeam = matches[0]?.playerPets ?? [];
  const sameTeam = matches.every(({ playerPets = [] }) => playerPets.length === firstTeam.length
    && playerPets.every((pet, index) => pet === firstTeam[index]));
  const teamList = companionsFailed ? companionsData : companionList;

  return (
    <Stack gap={2}>
      <Stack direction={'row'} alignItems={'center'} gap={0.5}>
        <Typography variant="body2" color="text.secondary">
          {`${formatNum(matches.length)} ${matches.length === 1 ? 'match' : 'matches'} recorded this tournament day.`}
        </Typography>
        <InfoButton label={'opponent power'}>{UNKNOWN_UPGRADES_NOTE}</InfoButton>
      </Stack>
      {sameTeam ? <Panel title={'Your team'}
                         meta={`${companionsFailed ? '-' : formatGame(teamPower(firstTeam, companionList), 'Stuff2.PetTournyPOW')} power · the same in every match`}>
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant={'body2'} component={'div'}>
            <PetList pets={firstTeam.map((idx) => teamList?.[idx]).filter(Boolean)}/>
          </Typography>
        </Box>
      </Panel> : null}
      <CardGrid size={'l'}>
        {matches.map((match, idx) => <MatchCard key={idx} match={match} companionList={companionList} companionsFailed={companionsFailed}
                                                ownTeam={!sameTeam}/>)}
      </CardGrid>
    </Stack>
  );
};

export default Matches;
