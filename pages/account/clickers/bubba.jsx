import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import BonusStrip from '@components/common/cards/BonusStrip';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Upgrades from '@components/account/clickers/bubba/Upgrades';
import NextBonus from '@components/account/clickers/NextBonus';
import { getBubba } from '@parsers/clickers/bubba';

// The game's panel title: "Chromatic 3 Megaflesh" counts the 12th's stacks
const megafleshTitle = ({ name, amount } = {}, index) => (name
  ? `${name}${index === 11 && amount > 1 ? ` ${amount}` : ''} Megaflesh` : `Megaflesh ${index + 1}`);

// The parser formats the last megaflesh's bonus; its $ takes it. "Current_Bonus:$x" has no space of its own
const megafleshText = ({ description, totalBonus }) => cleanUnderscore(totalBonus !== undefined
  ? `${description ?? ''}`.replace(':$', () => ': $').replace('$', () => totalBonus)
  : `${description ?? ''}`);

// The 12th keeps stacking once owned: its line shows what the next one makes it
const nextMegafleshText = (entry) => megafleshText(entry?.unlocked && entry?.nextBonus
  ? { ...entry, totalBonus: `${entry.totalBonus}x → ${entry.nextBonus}` }
  : entry).replaceAll('\n', ' ');

// The game's own bonus lines (Bubbastuff.BubbaRoG_Bonuses): every one signed but "{%_XP_Multi"
const XP_MULTI = 'XP Multi';
const bonusText = ({ name, bonus, isNegative }) => {
  const value = isNegative ? -(bonus ?? 0) : bonus ?? 0;
  return `${name !== XP_MULTI && value > 0 ? '+' : ''}${formatGame(value, 'Bubbastuff.BubbaRoG_Bonuses')}%`;
};

const Bubba = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'bubba');
  // A failed section draws Bubba's lists at zero (the parser's own empty save); its numbers are not the player's
  const bubba = failed ? getBubba(undefined, {}) : state?.account?.bubba;
  const slices = (value, key) => (failed ? '-' : formatGame(value ?? 0, key));

  return <>
    <NextSeo
      title="Bubba | Idleon Toolbox"
      description="Track your Bubba minigame upgrades, candy progress, and bonus effects in Legends of Idleon"
    />
    {failed ? <MissingData name={'Bubba'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Meat slices'} icon={'etc/Bubba_0.png'} value={slices(bubba?.meatSlices, 'Save.BubbaMeat')}/>
      <StatTile label={'Meat slices per minute'} value={slices(bubba?.meatsliceRate, 'Bubbastuff.MeatsliceRate')}
                breakdown={!failed && bubba?.meatsliceRateBreakdown
                  ? { ...bubba.meatsliceRateBreakdown, totalValue: slices(bubba?.meatsliceRate, 'Bubbastuff.MeatsliceRate') }
                  : undefined}/>
      {/* With every upgrade type out the game draws a max mark instead of a goal */}
      <StatTile label={'Next upgrade'} status={!failed && bubba?.allUpgradesAvailable ? 'maxed' : undefined}
                value={failed ? '-' : bubba?.allUpgradesAvailable
                  ? 'All unlocked'
                  : `${slices(bubba?.progress, 'Bubbastuff.MeatProdREQ')} / ${slices(bubba?.progressReq, 'Bubbastuff.MeatProdREQ')}`}/>
    </PageSummary>
    {/* Bubba's bonuses as tiles in a row, as Worship's MSA Totalizer, right under the summary so the page's numbers come
        first: two full-width columns put each name about 400 px from its value */}
    <BonusStrip title={"Bubba's bonuses"} sx={{ mb: 3 }}>
      {/* A bonus at 0 waits on Bubba Boon's level: the game draws a lock there */}
      {Object.values(bubba?.bonuses ?? {}).map((entry, index) => <StatTile key={entry.name} icon={`etc/Bubba_${index + 1}.png`}
                                                                           label={entry.name}
                                                                           status={!failed && !entry.unlocked ? 'locked' : undefined}
                                                                           value={failed ? '-' : entry.unlocked
                                                                             ? bonusText(entry)
                                                                             : `Bubba Boon Lv ${entry.unlockLevel}`}/>)}
    </BonusStrip>
    {/* Its tiles at their own size under a heading, as the bonuses above: in a boxed Panel they stretched across the
        page, twelve mostly empty tiles over 100 px wide */}
    <BonusStrip title={'Megaflesh'} bare sx={{ mb: 3 }}>
      <Box>
        <CardGrid size={'icon'} fill={72}>
          {(bubba?.megaFlesh ?? []).map((entry, index) => <IconTile key={index} icon={`data/BubbaMF${index}.png`}
                                                                   alt={megafleshTitle(entry, index)}
                                                                   status={entry?.unlocked ? undefined : 'missing'}
                                                                   value={!failed && entry?.amount > 0 ? formatNum(entry.amount, 'whole') : undefined}
                                                                   details={<>
                                                                     <Typography variant={'cardTitle'} component={'div'}>{megafleshTitle(entry, index)}</Typography>
                                                                     <ItemCard.Desc text={megafleshText(entry).split('\n')}/>
                                                                   </>}/>)}
        </CardGrid>
      </Box>
      {failed ? null : <NextBonus entries={bubba?.megaFlesh} name={'Megaflesh'} iconOf={(index) => `data/BubbaMF${index}.png`}
                                  stackingIndex={(bubba?.megaFlesh?.length ?? 0) - 1} textOf={nextMegafleshText}/>}
    </BonusStrip>
    <Upgrades upgrades={bubba?.upgrades} failed={failed} meatSlices={bubba?.meatSlices ?? 0}
              smokerSeconds={bubba?.smokerSeconds ?? 0}/>
  </>
};

export default Bubba;
