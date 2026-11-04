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

// The parser prints a shiny fish count itself; with no save it reads "NaNeNaN" (parsers/world-2/kangaroo.ts)
const caught = (amount) => (/NaN/.test(`${amount}`) ? '0' : amount);

const Kangaroo = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'kangaroo');
  // A failed section draws Poppy's lists at zero (the parser's own empty save); its numbers are not the player's
  const kangaroo = failed ? getKangaroo(undefined, {}) : state?.account?.kangaroo;
  // No save has no fish caught, so there is no next upgrade to count toward
  const hasSave = !failed && kangaroo?.progress != null;
  const number = (value, render) => (failed ? '-' : render(value ?? 0));
  const fishRate = kangaroo?.fishRate ?? 0;

  return <>
    <NextSeo
      title="Poppy The Kangaroo | Idleon Toolbox"
      description="Track your Kangaroo minigame upgrades, jump progress, and bonus rewards in Legends of Idleon"
    />
    {failed ? <MissingData name={'Kangaroo'} failed/> : null}
    <PageSummary>
      <StatTile label={'Fish'} icon={'etc/KFish.png'} value={number(kangaroo?.totalFish, formatNum)}/>
      <StatTile label={'Fish per minute'} value={number(fishRate, formatNum)}/>
      <StatTile label={'Fish per hour'} value={number(fishRate * 60, formatNum)}/>
      <StatTile label={'Next upgrade'} value={!hasSave ? '-' : kangaroo?.nextLvReq > 0
        ? `${formatGame(kangaroo.progress, 'Summoning.RooNextUpgReq')} / ${formatGame(kangaroo.nextLvReq, 'Summoning.RooNextUpgReq')}`
        : <StatusText status={'done'}>All unlocked</StatusText>}/>
      <StatTile label={'Tar fish'} icon={'etc/KTar.png'}
                value={number(kangaroo?.totalTarFishOwned, (value) => formatGame(value, 'Summoning.RooCost_T'))}/>
      <StatTile label={'Tar fish per hour'}
                value={failed || !(kangaroo?.tarFishRate > 0) ? '-' : formatNum(3600 / kangaroo.tarFishRate)}/>
      <StatTile label={'Shiny progress'} icon={'etc/KShiny.png'}
                value={number(kangaroo?.shinyProgress, (value) => formatNum(value, 'pct'))}/>
      <StatTile label={'Shiny per minute'} value={number(kangaroo?.shinyRatePercent, (value) => formatNum(value, 'pct'))}/>
      <StatTile label={'Average reset points'}
                value={number(kangaroo?.avgResetPoints, (value) => formatNum(value, 'amount', { precise: true }))}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['clickers'].categories, 'kangaroo')}>
      <Upgrades upgrades={kangaroo?.upgrades} failed={failed} fish={kangaroo?.totalFish ?? 0}/>
      <Upgrades upgrades={kangaroo?.tarUpgrades} isTar failed={failed} tarFish={kangaroo?.totalTarFishOwned ?? 0}/>
      <CardGrid size={'m'} sx={{ alignItems: 'start' }}>
        <Panel title={"Poppy's bonuses"}>
          {(kangaroo?.bonuses ?? []).slice(1).map(({ name, bonus, percentage }, index) => <Panel.Row key={name}
                                                                                                    icon={`etc/Kangaroob_${index + 1}.png`}
                                                                                                    name={name}
                                                                                                    value={failed ? '-' : percentage
                                                                                                      ? formatNum(bonus ?? 0, 'pct', { signed: true })
                                                                                                      : formatNum(bonus ?? 0, 'amount', { signed: true })}/>)}
        </Panel>
        <Panel title={'Megafish'}>
          <Box sx={{ p: 1.5 }}>
            <CardGrid size={'icon'}>
              {(kangaroo?.megaFish ?? []).map(({ description, unlocked, amount, totalBonus }, index) => <IconTile key={index}
                                                                                                                icon={`data/RooMG${index}.png`}
                                                                                                                alt={`Megafish ${index + 1}`}
                                                                                                                status={failed || unlocked ? undefined : 'missing'}
                                                                                                                value={!failed && amount > 0 ? formatNum(amount) : undefined}
                                                                                                                details={<ItemCard.Desc
                                                                                                                  text={cleanUnderscore(`${description ?? ''}`.replace('{', () => formatNum(totalBonus ?? 1, 'mult', { bare: true })))}/>}/>)}
            </CardGrid>
          </Box>
        </Panel>
        <Panel title={'Shiny multi'}>
          {/* The parser prints the total in Summoning.RooShinyMulti, as the game does ("1.00x") */}
          <Panel.Row name={'Total multi'} value={failed ? '-' : `${kangaroo?.totalMulti ?? '1.00'}x`}/>
          {(kangaroo?.allMultipliers ?? []).map(({ multi, amount }, index) => <Panel.Row key={index}
                                                                                         icon={`data/RooFishS${index}.png`}
                                                                                         name={failed ? `Shiny fish ${index + 1}` : `${caught(amount)} caught`}
                                                                                         value={failed ? '-' : `${multi}x`}/>)}
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
