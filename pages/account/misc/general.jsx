import ObolsView from 'components/account/Worlds/World2/ObolsView';
import Currencies from 'components/account/Misc/Currencies';
import Shrines from '@components/account/Worlds/World3/Shrines';
import Statues from '@components/account/Worlds/World1/Statues';
import Highscores from 'components/account/Misc/Highscores';
import Totals from 'components/account/Misc/Totals';
import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { MissingData, isSectionFailed, joinNames } from '@components/common/styles';

// The sections General reads, by the name its one note gives them (Notices board: one note per place)
const SECTIONS = [['obols', 'Obols'], ['currencies', 'Currencies'], ['currencies.KeysAll', 'Keys'],
  ['currencies.ColosseumTickets', 'Colosseum Tickets'], ['shrines', 'Shrines'], ['shrinesExpBonus', 'Shrine EXP'],
  ['statues', 'Statues'], ['highscores', 'Highscores'], ['alchemy', 'Alchemy'], ['stamps', 'Stamps'], ['tasks', 'Tasks']];

const General = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const failedOf = (key) => isSectionFailed(account, key);
  const failedNames = account?.failedSections?.includes('*') ? 'your save'
    : joinNames(SECTIONS.filter(([key]) => account?.failedSections?.includes(key)).map(([, name]) => name));
  return <>
    <NextSeo
      title="General | Idleon Toolbox"
      description="View your Legends of Idleon account overview including level, gems, keys, and general progression stats"
    />
    {failedNames ? <MissingData name={failedNames} failed/> : null}
    {/* The Panels flow down columns as main's did: the tall Statues Panel leaves no empty band */}
    <CardGrid size={'m'} flow>
      {failedOf('obols') ? null : <Panel title={'Family obols'}>
        <ObolsView obols={account?.obols} type={'account'} characters={state?.characters}/>
      </Panel>}
      {failedOf('currencies') ? null : <Currencies {...(account?.currencies ?? {})}
                                                    keysFailed={failedOf('currencies.KeysAll')}
                                                    ticketsFailed={failedOf('currencies.ColosseumTickets')}/>}
      {failedOf('shrines') ? null : <Panel title={'Shrines'}>
        <Shrines shrines={account?.shrines} shrinesExpBonus={failedOf('shrinesExpBonus') ? null : account?.shrinesExpBonus}/>
      </Panel>}
      {failedOf('statues') ? null : <Panel title={'Statues'}>
        <Statues account={account} characters={state?.characters}/>
      </Panel>}
      {failedOf('highscores') ? null : <Highscores title={'Colosseum'} highscore={account?.highscores?.coloHighscores}/>}
      {failedOf('highscores') ? null : <Highscores title={'Minigame'} highscore={account?.highscores?.minigameHighscores}/>}
      <Totals account={account} characters={state?.characters} failedOf={failedOf}/>
    </CardGrid>
  </>;
};

export default General;
