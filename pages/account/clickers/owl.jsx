import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { clickerAmount, formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import { getOwl } from '@parsers/world-1/owl';

// The game fills Orion's bonuses with the raw number (N.js, the Orion panel): commas and no K. Shiny Feather is a count
const bonusText = ({ name, bonus, percentage }) => (name === 'Shiny Feather'
  ? formatNum(bonus ?? 0)
  : `${formatNum(bonus ?? 0, 'exact', { signed: true })}${percentage ? '%' : ''}`);

const Owl = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'owl');
  // A failed section draws Orion's lists at zero (the parser's own empty save); its numbers are not the player's
  const owl = failed ? getOwl(undefined, {}) : state?.account?.owl;
  // No save has no feathers made, so there is no next upgrade to count toward
  const feathers = owl?.feathers ?? 0;
  const featherRate = owl?.featherRate ?? 0;

  return <>
    <NextSeo
      title="Owl | Idleon Toolbox"
      description="Track your Owl minigame upgrades, feather progress, and bonus multipliers in Legends of Idleon"
    />
    {failed ? <MissingData name={'Owl'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Feathers'} icon={'etc/Owlb_0.png'} value={failed ? '-' : clickerAmount(feathers)}/>
      <StatTile label={'Feathers per second'} value={failed ? '-' : formatGame(featherRate, 'Summoning.OwlFeatherRate')}/>
      <StatTile label={'Feathers per hour'} value={failed ? '-' : formatGame(featherRate * 3600, 'Summoning.OwlFeatherRate')}/>
      <StatTile label={'Next upgrade'} value={failed || owl?.nextLvReq == null ? '-' : owl.nextLvReq > 0
        ? `${formatGame(owl.progress, 'Summoning.OwlNextUpgReq', { whole: true })} / ${formatGame(owl.nextLvReq, 'Summoning.OwlNextUpgReq', { whole: true })}`
        : <StatusText status={'done'}>All unlocked</StatusText>}/>
    </PageSummary>
    <CardGrid size={'m'} sx={{ mb: 3, alignItems: 'start' }}>
      <Panel title={'Bonuses of Orion'}>
        {(owl?.bonuses ?? []).slice(1).map((bonus, index) => <Panel.Row key={bonus.name} icon={`etc/Owlb_${index + 1}.png`}
                                                                        name={bonus.name}
                                                                        value={failed ? '-' : bonusText(bonus)}/>)}
      </Panel>
      <Panel title={'Megafeathers'}>
        <Box sx={{ p: 1.5 }}>
          <CardGrid size={'icon'}>
            {(owl?.megaFeathers ?? []).map(({ description, unlocked, amount, totalBonus }, index) => <IconTile key={index}
                                                                                                            icon={`data/Feaz${index}.png`}
                                                                                                            alt={`Megafeather ${index + 1}`}
                                                                                                            status={unlocked ? undefined : 'missing'}
                                                                                                            value={!failed && amount > 0 ? formatGame(amount, 'Summoning.OwlMegafeather', { whole: true }) : undefined}
                                                                                                            details={<ItemCard.Desc
                                                                                                              text={cleanUnderscore(`${description ?? ''}`.replace('{', () => formatNum(totalBonus ?? 1, 'mult', { bare: true })))}/>}/>)}
          </CardGrid>
        </Box>
      </Panel>
    </CardGrid>
    <CardGrid size={'m'}>
      {(owl?.upgrades ?? []).map(({ name, desc, level, cost, unlocked, x3 }, index) => <ItemCard key={index}
                                                                                               icon={`etc/Owl_${index}.png`}
                                                                                               title={cleanUnderscore(name)}
                                                                                               meta={failed ? undefined : formatNum(level ?? 0, 'level')}
                                                                                               status={failed || unlocked ? undefined : 'locked'}
                                                                                               footer={failed ? null : unlocked
                                                                                                 ? <ItemCard.Cost icon={'etc/Owlb_0.png'} iconAlt={'Feathers'}
                                                                                                                  need={cost} have={feathers}
                                                                                                                  format={clickerAmount}/>
                                                                                                 : <ItemCard.Facts rows={[['Unlocks at', `${formatGame(Number(x3), 'Summoning.OwlNextUpgReq', { whole: true })} feathers made`]]}/>}>
        <ItemCard.Desc text={cleanUnderscore(desc)}/>
      </ItemCard>)}
    </CardGrid>
  </>;
};

export default Owl;
