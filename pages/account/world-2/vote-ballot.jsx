import { useContext } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { fillVoteText, formatGame } from '@utility/gameNotation';
import { getVoteBallot } from '@parsers/world-2/voteBallot';
import { MissingData, isSectionFailed } from '@components/common/styles';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { Duration } from '@components/common/Num';
import useToolbarState from '@hooks/useToolbarState';

// One key for both tabs, as the one checkbox was
const BALLOT_TOOLBAR = { onlyBallot: false };

// Each vote turns over once a week, from its own offset of the save's clock
const WEEK = 604800;
const BONUS_WEEK_OFFSET = 197860;
const MERITOCRACY_WEEK_OFFSET = 543460;
const weekLeft = (time, offset) => WEEK - (time + offset - WEEK * Math.floor((time + offset) / WEEK));

const byVotes = (a, b) => (Number(b.bonus?.percent) || 0) - (Number(a.bonus?.percent) || 0);

const VoteBallot = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const ballotFailed = isSectionFailed(account, 'voteBallot');
  // A failed section's {} default: the parser's own bonuses with no save, filled at zero, with no ballot state
  const voteBallot = (ballotFailed ? getVoteBallot({}, {}, []) : account?.voteBallot) ?? {};
  const bonusOf = (bonus) => (ballotFailed ? 0 : bonus?.bonus);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('vote-ballot', BALLOT_TOOLBAR);
  const globalTime = Number(account?.timeAway?.GlobalTime ?? NaN);
  // With no save clock (a guest, or a save that came without one) there is no week to count down to
  const hasClock = Number.isFinite(globalTime);
  const guest = state?.emptyAccount;

  const ballotTab = ({ label, multiText, breakdown, timeLeft, bonuses, describe, iconOf }) => {
    const entries = (bonuses ?? []).map((bonus, index) => ({ bonus, index }));
    // The ballot comes with the save: without it no bonus is this week's or on the ballot, so the filter has nothing
    // to keep
    const hasBallot = !ballotFailed && entries.some(({ bonus }) => bonus?.selected || bonus?.active);
    const current = entries.filter(({ bonus }) => bonus?.selected);
    const candidates = entries.filter(({ bonus }) => bonus?.active).toSorted(byVotes);
    const onlyBallot = hasBallot && toolbar?.onlyBallot;
    const shown = onlyBallot ? current.length + candidates.length : entries.length;

    // The state sits on the meta line, under the sentence: beside it, it squeezed a long sentence to a few words a line
    const bonusCard = ({ bonus, index }) => {
      const icon = iconOf(bonus, index);
      const thisWeek = hasBallot && bonus?.selected;
      const onBallot = hasBallot && bonus?.active;
      return <ItemCard key={index} icon={icon ? `data/${icon}` : undefined} title={describe(bonus)}
                       meta={thisWeek || onBallot ? <>
                         {thisWeek ? <StatusText status={'active'}>This week</StatusText> : null}
                         {thisWeek && onBallot ? ' · ' : null}
                         {onBallot ? `On the ballot · ${formatNum(Number(bonus?.percent) || 0, 'pct')} of votes` : null}
                       </> : undefined}/>;
    };
    const group = (title, list) => (list.length ? <Stack gap={1}>
      <Typography variant={'groupLabel'} color={'text.secondary'}>{title}</Typography>
      <CardGrid size={'m'}>{list.map(bonusCard)}</CardGrid>
    </Stack> : null);

    return <>
      {/* Under a failed section's note the empty ballot stays silent */}
      {!ballotFailed && !hasBallot ? <Notice tone={hasClock ? 'info' : guest ? 'signin' : 'missing'} sx={{ mb: 2 }}>
        {hasClock ? 'No bonus is on this week\'s ballot.' : guest ? 'This week\'s ballot shows here once you sign in.'
          : 'This week\'s ballot follows your save\'s game clock, and this save has none.'}
      </Notice> : null}
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} sx={{ mb: 2 }}>
        <StatTile label={label} value={multiText}
                  breakdown={!ballotFailed && breakdown ? { ...breakdown, totalValue: multiText } : undefined}/>
        {hasClock ? <StatTile label={'Next week in'} value={<Duration seconds={timeLeft}/>}/> : null}
      </Stack>
      <Box>
        {hasBallot ? <Toolbar state={toolbar} defaults={BALLOT_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                              total={entries.length} shown={shown} noun={'bonuses'}>
          <Toolbar.Filter name={'onlyBallot'} label={'Hide off-rotation'}/>
        </Toolbar> : null}
        {onlyBallot ? <Stack gap={3}>
          {group('This week', current)}
          {group('On the ballot', candidates)}
        </Stack> : <CardGrid size={'m'}>
          {/* This week's bonus first */}
          {[...(hasBallot ? current : []), ...entries.filter(({ bonus }) => !hasBallot || !bonus?.selected)].map(bonusCard)}
        </CardGrid>}
      </Box>
    </>;
  };

  const bonusText = ballotFailed ? '-' : formatNum(voteBallot?.voteMulti ?? 1, 'mult');
  const meritocracyText = ballotFailed ? '-' : `${formatGame(voteBallot?.meritocracyMult ?? 1, 'Summoning.MeritocBonuszMulti')}x`;

  return <>
    <NextSeo
      title="Vote Ballot | Idleon Toolbox"
      description="Track your active vote ballot bonuses and their effects on gameplay in Legends of Idleon"
    />
    {ballotFailed ? <MissingData name={'Vote Ballot'} failed/> : null}
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'voteBallot')}>
      {ballotTab({
        label: 'Bonus multi',
        multiText: bonusText,
        breakdown: voteBallot?.voteMultiBreakdown,
        timeLeft: weekLeft(globalTime, BONUS_WEEK_OFFSET),
        bonuses: voteBallot?.bonuses,
        describe: (bonus) => cleanUnderscore(fillVoteText(bonus?.[0], bonusOf(bonus))),
        iconOf: (bonus) => bonus?.icon
      })}
      {ballotTab({
        label: 'Meritocracy multi',
        multiText: meritocracyText,
        breakdown: voteBallot?.meritocracyMultBreakdown,
        timeLeft: weekLeft(globalTime, MERITOCRACY_WEEK_OFFSET),
        bonuses: voteBallot?.meritocracyBonuses,
        describe: (bonus) => cleanUnderscore(fillVoteText(bonus?.description, bonusOf(bonus))),
        // The game has no sprite for the first meritocracy bonus
        iconOf: (bonus, index) => (index > 0 ? bonus?.icon : undefined)
      })}
    </Tabber>
  </>;
};
export default VoteBallot;
