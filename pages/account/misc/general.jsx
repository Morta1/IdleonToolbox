import ObolsView from 'components/account/Worlds/World2/ObolsView';
import Currencies from 'components/account/Misc/Currencies';
import Shrines from '@components/account/Worlds/World3/Shrines';
import Statues from '@components/account/Worlds/World1/Statues';
import Highscores from 'components/account/Misc/Highscores';
import Totals from 'components/account/Misc/Totals';
import Library, { DEFAULT_LIBRARY_SPANS, parseLibrarySpans } from '@components/account/Worlds/World3/Library';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { MissingData, isParseFailed, isSectionFailed, joinNames, sectionName } from '@components/common/styles';

// The sections General reads, by the name its one note gives them (Notices board: one note per place)
const AT_ZERO_SECTIONS = ['currencies', 'shrines', 'statues', 'highscores'];
const SECTIONS = [['obols', 'Obols'], ['currencies', 'Currencies'], ['currencies.KeysAll', 'Keys'],
  ['currencies.ColosseumTickets', 'Colosseum Tickets'], ['shrines', 'Shrines'], ['shrinesExpBonus', 'Shrine EXP'],
  ['statues', 'Statues'], ['highscores', 'Highscores'], ['alchemy', 'Alchemy'], ['stamps', 'Stamps'], ['tasks', 'Tasks'],
  ['cards', 'Cards'], ['sailing', 'Sailing'], ['prayers', 'Prayers'], ['royalGuardian', 'the Royal Armory'], ['libraryTimes', 'the Library']];

const SETTINGS_DEFAULTS = { librarySpans: null };

const General = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const failedOf = (key) => isSectionFailed(account, key);
  const parseFailed = isParseFailed(account);
  const [settings, setSettings, resetSettings] = usePageSettings('general', SETTINGS_DEFAULTS);
  const librarySpans = parseLibrarySpans(settings?.librarySpans).spans ?? DEFAULT_LIBRARY_SPANS;
  const failedSections = account?.failedSections ?? [];
  // 28 sections feed the Library's count, so any failed one dashes it: the note names those too
  const failedNames = failedSections.includes('*') ? 'your save'
    : joinNames([...SECTIONS.filter(([key]) => failedSections.includes(key)).map(([, name]) => name),
      ...failedSections.filter((key) => !SECTIONS.some(([known]) => known === key)).map(sectionName)]);
  return <>
    <NextSeo
      title="General | Idleon Toolbox"
      description="View your Legends of Idleon account overview including level, gems, keys, and general progression stats"
    />
    {parseFailed ? null : <PageSettings state={settings} defaults={SETTINGS_DEFAULTS} onChange={setSettings} onReset={resetSettings}>
      <PageSettings.Text name={'librarySpans'} label={'Library book counts'} placeholder={DEFAULT_LIBRARY_SPANS.join(', ')}
                         parse={parseLibrarySpans} help={'How long your first 20, 40… books take. Enter counts, comma separated.'}/>
    </PageSettings>}
    {failedNames ? <MissingData name={failedNames} failed atZero={AT_ZERO_SECTIONS.some((key) => account?.failedSections?.includes(key))}/> : null}
    {/* The Panels flow down columns as main's did: the tall Statues Panel leaves no empty band */}
    <CardGrid size={'m'} flow>
      {failedOf('obols') ? null : <Panel title={'Family obols'}>
        <ObolsView obols={account?.obols} type={'account'} characters={state?.characters}/>
      </Panel>}
      {parseFailed ? null : <Currencies {...(account?.currencies ?? {})}
                                                    keysFailed={failedOf('currencies.KeysAll')}
                                                    ticketsFailed={failedOf('currencies.ColosseumTickets')}/>}
      {parseFailed ? null : <Panel title={'Shrines'}>
        <Shrines shrines={account?.shrines} shrinesExpBonus={failedOf('shrinesExpBonus') ? null : account?.shrinesExpBonus}
                 characterCount={state?.characters?.length}/>
      </Panel>}
      {parseFailed ? null : <Panel title={'Statues'}>
        <Statues account={account} characters={state?.characters}/>
      </Panel>}
      {parseFailed ? null : <Highscores title={'Colosseum'} highscore={account?.highscores?.coloHighscores}/>}
      {parseFailed ? null : <Highscores title={'Minigame'} highscore={account?.highscores?.minigameHighscores}/>}
      {parseFailed ? null : <Library libraryTimes={account?.libraryTimes} failed={failedSections.length > 0} live={Boolean(account?.timeAway?.GlobalTime)}
                                         spans={librarySpans}/>}
      <Totals account={account} characters={state?.characters} failedOf={failedOf}/>
    </CardGrid>
  </>;
};

export default General;
