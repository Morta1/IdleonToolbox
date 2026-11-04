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
import { getBubba } from '@parsers/clickers/bubba';

// The parser formats the last megaflesh's bonus; its $ takes it
const megafleshText = ({ description, totalBonus }) => cleanUnderscore(totalBonus !== undefined
  ? `${description ?? ''}`.replace('$', () => totalBonus)
  : `${description ?? ''}`);

const Bubba = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'bubba');
  // A failed section draws Bubba's lists at zero (the parser's own empty save); its numbers are not the player's
  const bubba = failed ? getBubba(undefined, {}) : state?.account?.bubba;
  const slices = (value) => (failed ? '-' : formatGame(value ?? 0, 'Bubbastuff.MeatsliceRate'));

  return <>
    <NextSeo
      title="Bubba | Idleon Toolbox"
      description="Track your Bubba minigame upgrades, candy progress, and bonus effects in Legends of Idleon"
    />
    {failed ? <MissingData name={'Bubba'} failed/> : null}
    <PageSummary>
      <StatTile label={'Meat slices'} icon={'etc/Bubba_0.png'} value={slices(bubba?.meatSlices)}/>
      <StatTile label={'Meat slices per minute'} value={slices(bubba?.meatsliceRate)}/>
      <StatTile label={'Next upgrade'} value={failed ? '-' : `${slices(bubba?.progress)} / ${slices(bubba?.progressReq)}`}/>
    </PageSummary>
    <CardGrid size={'m'} sx={{ mb: 3, alignItems: 'start' }}>
      <Panel title={"Bubba's bonuses"}>
        {Object.values(bubba?.bonuses ?? {}).map(({ name, bonus, isNegative }, index) => <Panel.Row key={name}
                                                                                                  icon={`etc/Bubba_${index + 1}.png`}
                                                                                                  name={name}
                                                                                                  value={failed ? '-' : formatNum(isNegative ? -(bonus ?? 0) : bonus ?? 0, 'pct', { signed: true })}/>)}
      </Panel>
      <Panel title={'Megaflesh'}>
        <Box sx={{ p: 1.5 }}>
          <CardGrid size={'icon'}>
            {(bubba?.megaFlesh ?? []).map((entry, index) => <IconTile key={index} icon={`data/BubbaMF${index}.png`}
                                                                     alt={`Megaflesh ${index + 1}`}
                                                                     status={failed || entry?.unlocked ? undefined : 'missing'}
                                                                     value={!failed && entry?.amount > 0 ? formatNum(entry.amount) : undefined}
                                                                     details={<ItemCard.Desc text={megafleshText(entry).split('\n')}/>}/>)}
          </CardGrid>
        </Box>
      </Panel>
    </CardGrid>
    <Upgrades upgrades={bubba?.upgrades} failed={failed} meatSlices={bubba?.meatSlices ?? 0}/>
  </>
};

export default Bubba;
