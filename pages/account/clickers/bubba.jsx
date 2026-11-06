import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
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
    <Panel title={'Megaflesh'} sx={{ mb: 2 }}>
      <Box sx={{ p: 1.5 }}>
        <CardGrid size={'icon'} evenRows>
          {(bubba?.megaFlesh ?? []).map((entry, index) => <IconTile key={index} icon={`data/BubbaMF${index}.png`}
                                                                   alt={`Megaflesh ${index + 1}`}
                                                                   status={entry?.unlocked ? undefined : 'missing'}
                                                                   value={!failed && entry?.amount > 0 ? formatNum(entry.amount, 'whole') : undefined}
                                                                   details={<ItemCard.Desc text={megafleshText(entry).split('\n')}/>}/>)}
        </CardGrid>
      </Box>
      {failed ? null : <NextBonus entries={bubba?.megaFlesh} name={'Megaflesh'} iconOf={(index) => `data/BubbaMF${index}.png`}
                                  textOf={(entry) => megafleshText(entry).replaceAll('\n', ' ')}/>}
    </Panel>
    <Panel title={"Bubba's bonuses"} sx={{ mb: 3 }}>
      <Panel.Columns>
        {Object.values(bubba?.bonuses ?? {}).map((entry, index) => <Panel.Row key={entry.name}
                                                                                                  icon={`etc/Bubba_${index + 1}.png`}
                                                                                                  name={entry.name}
                                                                                                  value={failed ? '-' : bonusText(entry)}/>)}
      </Panel.Columns>
    </Panel>
    <Upgrades upgrades={bubba?.upgrades} failed={failed} meatSlices={bubba?.meatSlices ?? 0}/>
  </>
};

export default Bubba;
