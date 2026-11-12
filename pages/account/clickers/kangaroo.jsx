import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World2/Kangaroo/Upgrades';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import BonusStrip from '@components/common/cards/BonusStrip';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { DIM } from '@components/common/cards/tokens';
import NextBonus from '@components/account/clickers/NextBonus';
import { getKangaroo } from '@parsers/world-2/kangaroo';

const megaFishText = ({ description, totalBonus }) => cleanUnderscore(`${description ?? ''}`.replace('{', () => formatNum(totalBonus ?? 1, 'mult', { bare: true })));

const bonusText = ({ bonus, percentage }) => `${bonus > 0 ? '+' : ''}${formatGame(bonus ?? 0, 'Summoning.RooBonuses')}${percentage ? '%' : ''}`;
// The game's fish line rounds up before its commas (N.js, the Poppy panel), a step its rule's Comma doesn't hold
const fishText = (key) => (value) => formatGame(Math.ceil(value), key, { whole: true });

// Poppy's two lists share a row at equal widths where each gets 280 px, and stack where not: a phone, and a page too
// narrow beside the side ad, where columns ran a row's name into its value.
const LISTS_SX = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 2, alignItems: 'start',
  '@container (min-width: 576px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
};

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
        ? `${formatGame(kangaroo.fishCaught ?? kangaroo.progress, 'Save.RooFishCaught', { whole: true })} / ${formatGame(kangaroo.nextLvReq, 'Summoning.RooNextUpgReq', { whole: true })}`
        : <StatusText status={'done'}>All unlocked</StatusText>}/>
      <StatTile label={'Tar fish'} icon={'etc/KTar.png'}
                value={number(kangaroo?.totalTarFishOwned, fishText('Save.RooTarFish'))}/>
      <StatTile label={'Tar fish per hour'}
                value={failed || !(kangaroo?.tarFishRate > 0) ? '-' : tarPitOpen ? formatGame(3600 / kangaroo.tarFishRate, 'Summoning.RooCatchREQ_T') : '0'}/>
      <StatTile label={'Shiny progress'} icon={'etc/KShiny.png'}
                value={number(kangaroo?.shinyProgress, (value) => `${formatGame(value, 'Summoning.RooCatchREQ_S')}%`)}/>
      {/* Per hour, as Shiny Lure's own text puts it */}
      <StatTile label={'Shiny per hour'} value={number(kangaroo?.shinyRatePercent, (value) => formatNum(value * 60, 'pct'))}/>
      <StatTile label={'Unspent points'} value={number(kangaroo?.unspentResetPoints, (value) => formatNum(value, 'whole'))}/>
      <StatTile label={'Next reset gives'} value={number(kangaroo?.nextResetPoints, (value) => `${formatNum(value, 'whole')} points`)}/>
    </PageSummary>
    {/* Poppy's bonuses as tiles in a row, then the Megafish, above the tabs as on Owl's and Bubba's pages: inside the
        Bonuses tab they were a list Panel that put each name a column's width from its value */}
    <BonusStrip title={"Poppy's bonuses"} sx={{ mb: 3 }}>
      {(kangaroo?.bonuses ?? []).slice(1).map((entry, index) => {
        // The game draws a lock on a bonus Bonuses from Poppy hasn't reached yet
        const locked = !failed && entry.unlocked === false;
        return <StatTile key={entry.name}
                         icon={`etc/Kangaroob_${index + 1}.png`}
                         imgStyle={locked ? { opacity: DIM } : undefined}
                         label={entry.name}
                         status={locked ? 'locked' : undefined}
                         value={failed ? '-' : locked ? `Needs Lv ${entry.unlockLevel}` : bonusText(entry)}/>;
      })}
    </BonusStrip>
    {/* Its tiles at their own size under a heading: in a boxed Panel they stretched across the page */}
    <BonusStrip title={'Megafish'} bare sx={{ mb: 3 }}>
      <Box>
        <CardGrid size={'icon'} fill={72}>
          {(kangaroo?.megaFish ?? []).map((entry, index) => <IconTile key={index}
                                                                      icon={`data/RooMG${index}.png`}
                                                                      alt={entry.title ?? `Megafish ${index + 1}`}
                                                                      status={entry.unlocked ? undefined : 'missing'}
                                                                      value={!failed && entry.amount > 0 ? formatNum(entry.amount, 'whole') : undefined}
                                                                      details={<>
                                                                        <Typography variant={'cardTitle'} component={'div'}>{entry.title}</Typography>
                                                                        <ItemCard.Desc text={megaFishText(entry)}/>
                                                                      </>}/>)}
        </CardGrid>
      </Box>
      {failed ? null : <NextBonus entries={kangaroo?.megaFish} name={'Megafish'} iconOf={(index) => `data/RooMG${index}.png`} textOf={megaFishText}
                                   titleOf={(entry) => entry?.name}/>}
    </BonusStrip>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['clickers'].categories, 'kangaroo')}>
      <Upgrades upgrades={kangaroo?.upgrades} failed={failed} fish={kangaroo?.totalFish ?? 0}/>
      <Upgrades upgrades={kangaroo?.tarUpgrades} isTar failed={failed} tarFish={kangaroo?.totalTarFishOwned ?? 0}/>
      <Stack gap={3}>
        <Box sx={{ containerType: 'inline-size' }}>
          <Box sx={LISTS_SX}>
            <Panel title={'Shiny multi'}>
              <Panel.Row name={'Total multi'} value={failed ? '-' : `${formatGame(kangaroo?.totalMulti ?? 1, 'Summoning.RooShinyMulti')}x`}/>
              {(kangaroo?.allMultipliers ?? []).map(({ multi, amount }, index) => <Panel.Row key={index}
                                                                                             icon={`data/RooFishS${index}.png`}
                                                                                             name={failed ? `Shiny fish ${index + 1}` : `${formatNum(amount, 'whole')} caught`}
                                                                                             value={failed ? '-' : `${formatGame(multi, 'Summoning.RooShinyMulti_Fish')}x`}/>)}
            </Panel>
            <Panel title={'Reset bonuses'}>
              {(kangaroo?.resetBonuses ?? []).map(({ desc, level, unlocked }, index) => <Panel.Row key={index}
                                                                                                   icon={`data/RooReset${index}.png`}
                                                                                                   name={cleanUnderscore(desc)}
                                                                                                   value={failed ? '-' : unlocked === false
                                                                                                     ? <StatusText status={'locked'}>Needs Megafish 3</StatusText>
                                                                                                     : formatNum(level ?? 0, 'level')}/>)}
            </Panel>
          </Box>
        </Box>
      </Stack>
    </Tabber>
  </>
};

export default Kangaroo;
