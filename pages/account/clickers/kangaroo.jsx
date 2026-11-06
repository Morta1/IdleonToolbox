import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World2/Kangaroo/Upgrades';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { getKangaroo } from '@parsers/world-2/kangaroo';

const bonusText = ({ bonus, percentage }) => `${bonus > 0 ? '+' : ''}${formatGame(bonus ?? 0, 'Summoning.RooBonuses')}${percentage ? '%' : ''}`;
// The game's fish line rounds up before its commas (N.js, the Poppy panel), a step its rule's Comma doesn't hold
const fishText = (key) => (value) => formatGame(Math.ceil(value), key, { whole: true });

const Kangaroo = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'kangaroo');
  // A failed section draws Poppy's lists at zero (the parser's own empty save); its numbers are not the player's
  const kangaroo = failed ? getKangaroo(undefined, {}) : state?.account?.kangaroo;
  const number = (value, render) => (failed ? '-' : render(value ?? 0));
  const fishRate = kangaroo?.fishRate ?? 0;
  // The Tar Pit opens with Megafish 1: until then no tar fish come in, whatever the base rate says
  const tarPitOpen = (kangaroo?.tarUpgrades ?? []).some(({ unlocked }) => unlocked);

  return <>
    <NextSeo
      title="Poppy The Kangaroo | Idleon Toolbox"
      description="Track your Kangaroo minigame upgrades, jump progress, and bonus rewards in Legends of Idleon"
    />
    {failed ? <MissingData name={'Kangaroo'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Fish'} icon={'etc/KFish.png'} value={number(kangaroo?.totalFish, fishText('Save.RooFish'))}/>
      <StatTile label={'Fish per minute'} value={number(fishRate, formatNum)}/>
      <StatTile label={'Fish per hour'} value={number(fishRate * 60, formatNum)}/>
      <StatTile label={'Next upgrade'} value={failed || kangaroo?.nextLvReq == null ? '-' : kangaroo.nextLvReq > 0
        ? `${formatGame(kangaroo.progress, 'Save.RooFishCaught', { whole: true })} / ${formatGame(kangaroo.nextLvReq, 'Summoning.RooNextUpgReq', { whole: true })}`
        : <StatusText status={'done'}>All unlocked</StatusText>}/>
      <StatTile label={'Tar fish'} icon={'etc/KTar.png'}
                value={number(kangaroo?.totalTarFishOwned, fishText('Save.RooTarFish'))}/>
      <StatTile label={'Tar fish per hour'}
                value={failed || !(kangaroo?.tarFishRate > 0) ? '-' : tarPitOpen ? formatGame(3600 / kangaroo.tarFishRate, 'Summoning.RooCatchREQ_T') : '0'}/>
      <StatTile label={'Shiny progress'} icon={'etc/KShiny.png'}
                value={number(kangaroo?.shinyProgress, (value) => `${formatGame(value, 'Summoning.RooCatchREQ_S')}%`)}/>
      <StatTile label={'Shiny per minute'} value={number(kangaroo?.shinyRatePercent, (value) => formatNum(value, 'pct'))}/>
      <StatTile label={'Average reset points'} value={number(kangaroo?.avgResetPoints, (value) => formatNum(Math.ceil(value), 'whole'))}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['clickers'].categories, 'kangaroo')}>
      <Upgrades upgrades={kangaroo?.upgrades} failed={failed} fish={kangaroo?.totalFish ?? 0}/>
      <Upgrades upgrades={kangaroo?.tarUpgrades} isTar failed={failed} tarFish={kangaroo?.totalTarFishOwned ?? 0}/>
      <CardGrid size={'m'} sx={{ alignItems: 'start' }}>
        <Panel title={"Poppy's bonuses"}>
          {(kangaroo?.bonuses ?? []).slice(1).map((entry, index) => <Panel.Row key={entry.name}
                                                                       icon={`etc/Kangaroob_${index + 1}.png`}
                                                                       name={entry.name}
                                                                       value={failed ? '-' : bonusText(entry)}/>)}
        </Panel>
        <Panel title={'Megafish'}>
          <Box sx={{ p: 1.5 }}>
            <CardGrid size={'icon'}>
              {(kangaroo?.megaFish ?? []).map(({ description, unlocked, amount, totalBonus }, index) => <IconTile key={index}
                                                                                                                icon={`data/RooMG${index}.png`}
                                                                                                                alt={`Megafish ${index + 1}`}
                                                                                                                status={unlocked ? undefined : 'missing'}
                                                                                                                value={!failed && amount > 0 ? formatNum(amount, 'whole') : undefined}
                                                                                                                details={<ItemCard.Desc
                                                                                                                  text={cleanUnderscore(`${description ?? ''}`.replace('{', () => formatNum(totalBonus ?? 1, 'mult', { bare: true })))}/>}/>)}
            </CardGrid>
          </Box>
        </Panel>
        <Panel title={'Shiny multi'}>
          <Panel.Row name={'Total multi'} value={failed ? '-' : `${formatGame(kangaroo?.totalMulti ?? 1, 'Summoning.RooShinyMulti')}x`}/>
          {(kangaroo?.allMultipliers ?? []).map(({ multi, amount }, index) => <Panel.Row key={index}
                                                                                         icon={`data/RooFishS${index}.png`}
                                                                                         name={failed ? `Shiny fish ${index + 1}` : `${formatNum(amount, 'whole')} caught`}
                                                                                         value={failed ? '-' : `${formatGame(multi, 'Summoning.RooShinyMulti_Fish')}x`}/>)}
        </Panel>
        <Panel title={'Reset bonuses'}>
          {(kangaroo?.resetBonuses ?? []).map(({ desc, level }, index) => <Panel.Row key={index}
                                                                                     icon={`data/RooReset${index}.png`}
                                                                                     name={cleanUnderscore(desc)}
                                                                                     value={failed ? '-' : formatNum(level ?? 0, 'level')}/>)}
        </Panel>
      </CardGrid>
    </Tabber>
  </>
};

export default Kangaroo;
