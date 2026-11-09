import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box } from '@mui/material';
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

// The parser formats the last megaflesh's bonus; its $ takes it. "Current_Bonus:$x" has no space of its own
const megafleshText = ({ description, totalBonus }) => cleanUnderscore(totalBonus !== undefined
  ? `${description ?? ''}`.replace(':$', () => ': $').replace('$', () => totalBonus)
  : `${description ?? ''}`);

// The game's own bonus lines (Bubbastuff.BubbaRoG_Bonuses): every one signed but "{%_XP_Multi"
const XP_MULTI = 'EXP Multi';
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
      <StatTile label={'Meat slices per minute'} value={slices(bubba?.meatsliceRate, 'Bubbastuff.MeatsliceRate')}/>
      <StatTile label={'Next upgrade'} value={failed ? '-' : `${slices(bubba?.progress, 'Bubbastuff.MeatProdREQ')} / ${slices(bubba?.progressReq, 'Bubbastuff.MeatProdREQ')}`}/>
    </PageSummary>
    {/* Bubba's bonuses as tiles in a row, as Worship's MSA Totalizer, right under the summary so the page's numbers come
        first: two full-width columns put each name about 400 px from its value */}
    <BonusStrip title={"Bubba's bonuses"} sx={{ mb: 3 }}>
      {Object.values(bubba?.bonuses ?? {}).map((entry, index) => <StatTile key={entry.name} icon={`etc/Bubba_${index + 1}.png`}
                                                                           label={entry.name}
                                                                           value={failed ? '-' : bonusText(entry)}/>)}
    </BonusStrip>
    {/* Its tiles at their own size under a heading, as the bonuses above: in a boxed Panel they stretched across the
        page, twelve mostly empty tiles over 100 px wide */}
    <BonusStrip title={'Megaflesh'} bare sx={{ mb: 3 }}>
      <Box>
        <CardGrid size={'icon'} fill={72}>
          {(bubba?.megaFlesh ?? []).map((entry, index) => <IconTile key={index} icon={`data/BubbaMF${index}.png`}
                                                                   alt={`Megaflesh ${index + 1}`}
                                                                   status={entry?.unlocked ? undefined : 'missing'}
                                                                   value={!failed && entry?.amount > 0 ? formatNum(entry.amount, 'whole') : undefined}
                                                                   details={<ItemCard.Desc text={megafleshText(entry).split('\n')}/>}/>)}
        </CardGrid>
      </Box>
      {failed ? null : <NextBonus entries={bubba?.megaFlesh} name={'Megaflesh'} iconOf={(index) => `data/BubbaMF${index}.png`}
                                  textOf={(entry) => megafleshText(entry).replaceAll('\n', ' ')}/>}
    </BonusStrip>
    <Upgrades upgrades={bubba?.upgrades} failed={failed} meatSlices={bubba?.meatSlices ?? 0}/>
  </>
};

export default Bubba;
