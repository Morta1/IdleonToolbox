import { useContext, useState } from 'react';
import { NextSeo } from 'next-seo';
import Button from '@mui/material/Button';
import { AppContext } from '@components/common/context/AppProvider';
import { getWeeklyBoss, getWeeklyBossBuffs } from '@parsers/world-2/weeklyBosses';
import { weeklyBosses as BOSSES } from '@website-data';
import WeeklyBoss, { TROPHY_ICON } from '@components/account/Worlds/World2/WeeklyBoss';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { OPT } from '@parsers/accountOptions';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Notice from '@components/common/Notice';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import WeeklyPrizes from '@components/account/Worlds/World2/WeeklyPrizes';
import { format, isValid } from 'date-fns';

const PRIZE_HORIZON = 52;
const weekLabel = (date, index) => (index === 0 ? 'Now' : isValid(date) ? format(date, 'MMM d') : `${index + 1}`);

const WeeklyBosses = () => {
  const { state } = useContext(AppContext);
  const [weeks, setWeeks] = useState(10);
  const [picked, setPicked] = useState(0);
  const account = state?.account;
  const trophies = Number(account?.accountOptions?.[OPT.weeklyBossTrophies]) || 0;
  const schedule = getWeeklyBoss(account, weeks);
  const week = schedule[picked];
  const buffs = getWeeklyBossBuffs(account);
  // A year ahead, so a prize drawn rarely still finds its next week
  const prizeSchedule = getWeeklyBoss(account, PRIZE_HORIZON);

  return <>
    <NextSeo
      title="Weekly Bosses | Idleon Toolbox"
      description="Track your weekly boss fights, trophies, and predicted boss schedules in Legends of Idleon"
    />
    <PageSummary>
      <StatTile label={'Trophies'} icon={TROPHY_ICON} value={formatNum(trophies)}/>
      {/* The two fight buffs that last the week: a guest has no fight */}
      {state?.emptyAccount ? null : <>
        <StatTile label={'Class EXP this week'} value={formatNum(buffs.classExp, 'pct', { signed: true })}
                  info={`From the tea break MISC action in this week's fight, up to +${buffs.cap}%. It resets with the week.`}/>
        <StatTile label={'Damage this week'} value={formatNum(buffs.damage, 'pct', { signed: true })}
                  info={`From the chilly cheese hotdogs MISC action in this week's fight, up to +${buffs.cap}%. It resets with the week.`}/>
      </>}
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'weeklyBosses')}>
      {schedule.length ? <>
        <CardGrid size={'icon'}>
          {/* Each week by when it starts (an unambiguous month name), the first being this one */}
          {schedule.map(({ bossName, date }, index) => <IconTile key={`week-${index}`} icon={`etc/${bossName}.png`}
                                                                 alt={`${cleanUnderscore(bossName)}, ${weekLabel(date, index)}`}
                                                                 value={weekLabel(date, index)}
                                                                 onSelect={() => setPicked(index)}
                                                                 selected={picked === index}/>)}
        </CardGrid>
        <Button variant={'text'} onClick={() => setWeeks((count) => count + 10)}
                sx={{ alignSelf: 'flex-start', mt: 1, mb: 2 }}>
          Show 10 more weeks
        </Button>
        {week ? <WeeklyBoss {...week} bossIndex={picked} account={account} characters={state?.characters}
                            trophies={trophies}/> : null}
      </> : <>
        {/* A guest has no clock until they sign in; a save can come without one */}
        {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>
          Weekly bosses follow your save&apos;s clock: the coming weeks show here once you sign in.
        </Notice> : <Notice tone={'missing'} sx={{ mb: 2 }}>
          Weekly bosses follow your save&apos;s game clock, and this save has none.
        </Notice>}
        <CardGrid size={'icon'}>
          {BOSSES.map(({ bossName }) => <IconTile key={bossName} icon={`etc/${bossName}.png`}
                                                  alt={cleanUnderscore(bossName)} details={cleanUnderscore(bossName)}/>)}
        </CardGrid>
      </>}
      <WeeklyPrizes account={account} schedule={prizeSchedule} weeks={PRIZE_HORIZON}/>
    </Tabber>
  </>;
};

export default WeeklyBosses;
