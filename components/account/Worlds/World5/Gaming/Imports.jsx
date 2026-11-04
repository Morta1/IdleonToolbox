import { calculateSnailEncouragementForSuccessChance } from '@parsers/world-5/gaming';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { bitsIcon } from '@utility/gameNotation';
import Timer from '../../../../common/Timer';
import React from 'react';
import RatKing from './RatKing';
import { OPT } from '@parsers/accountOptions';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, flatLines } from '@parsers/breakdown';

const IMPORTS_TOOLBAR = { boxDetails: false };

// The game's font draws ₣ as its bits icon; | is the box text's line break
const importText = (text) => cleanUnderscore(text ?? '').replace(/₣/g, 'bits').replace(/\|/g, '@');

// What a count reaches after each time away (Info 5: a list that sat in a hover note), named and headed as its row
const byTimeAway = (name, count, breakpoints) => createBreakdown(name, formatNum(count ?? 0),
  flatLines((breakpoints ?? []).map(({ time, amount }) => ({
    name: formatDuration(time), value: amount, formatted: formatNum(amount ?? 0)
  }))), { combine: 'list' });

const snailFacts = (gaming) => {
  const { snailLevel, snailEncouragement } = gaming ?? {};
  const { maxLevel, holeBonus, successChance = 0, resetChance = 0 } = gaming?.snail ?? {};
  const realResetChance = resetChance * (1 - successChance);
  const succeedBeforeReset = 1 - Math.pow(1 - successChance, 1 / realResetChance);
  const encouragementNeeded = calculateSnailEncouragementForSuccessChance(snailLevel, 0.9, holeBonus);
  return <ItemCard.Section label={'Snail'}>
    <ItemCard.Facts rows={[
      ['Level', snailLevel ?? 0, 'amount'],
      ['Max level', maxLevel ?? 0, 'amount'],
      ['Encouragement', snailEncouragement ?? 0, 'amount'],
      ['Success chance', formatNum(successChance * 100, 'pct')],
      ['Reset chance', formatNum(resetChance * 100, 'pct')],
      ['Real reset chance', formatNum(realResetChance * 100, 'pct')],
      successChance > 0 ? ['Average attempts', formatNum(1 / successChance, 'amount', { precise: true })] : null,
      ['Chance to succeed before reset', formatNum(succeedBeforeReset * 100, 'pct')],
      ['Encouragement for 90% success', encouragementNeeded ?? 0, 'amount']
    ]}/>
  </ItemCard.Section>;
};

// An import's own extras, by its place in the game's list
const importExtras = (index, item, gaming, account, lastUpdated) => {
  const { acquired, saveSprinklerChance, maxNuggetValue, acornShop } = item;
  if (index === 0) return <ItemCard.Facts rows={[['Save sprinkler chance', formatNum(saveSprinklerChance ?? 0, 'pct')]]}/>;
  if (index === 1 && acquired) {
    const nuggets = byTimeAway('Nuggets', gaming?.goldNuggets, gaming?.nuggetsBreakpoints);
    return <ItemCard.Facts rows={[
      ['Since last dig', <Timer key={'timer'} date={new Date().getTime() - (gaming?.lastShovelClicked ?? 0) * 1000}
                                lastUpdated={lastUpdated}/>],
      ['Nuggets', <Breakdown key={'nuggets'} asValue data={nuggets}>{formatNum(gaming?.goldNuggets ?? 0, 'whole')}</Breakdown>],
      ['Rolls', `${formatNum((maxNuggetValue ?? 0) / 1584.89, 'whole')} to ${formatNum(maxNuggetValue ?? 0, 'whole')}`],
      ['Best nugget', formatNum(Number(gaming?.bestNugget) || 0, 'whole')],
      ['Since upgrade', account?.accountOptions?.[OPT.nuggetsSinceUpgrade] ?? 0, 'amount']
    ]}/>;
  }
  if (index === 2) {
    const acorns = byTimeAway('Acorns', gaming?.acorns, gaming?.acornsBreakpoints);
    return <>
      {acquired ? <ItemCard.Facts rows={[
        ['Since last visit', <Timer key={'timer'} date={new Date().getTime() - (gaming?.lastAcornClicked ?? 0) * 1000}
                                    lastUpdated={lastUpdated}/>],
        ['Acorns', <Breakdown key={'acorns'} asValue data={acorns}>{formatNum(gaming?.acorns ?? 0, 'whole')}</Breakdown>]
      ]}/> : null}
      {acornShop?.length ? <ItemCard.Section label={'Acorn Shop'}>
        <ItemCard.Facts rows={acornShop.map(({ description, cost }) => [cleanUnderscore(description),
          `${formatNum(cost ?? 0, 'whole')} ${cost === 1 ? 'acorn' : 'acorns'}`])}/>
      </ItemCard.Section> : null}
    </>;
  }
  if (index === 6) {
    return <ItemCard.Facts rows={[
      ['Highscore', gaming?.poingHighscore ?? 0, 'amount'],
      ['Multiplier', formatNum(gaming?.poingMulti ?? 1, 'mult')]
    ]}/>;
  }
  if (index === 7 && acquired) return snailFacts(gaming);
  if (index === 8 && acquired) return <RatKing ratKing={gaming?.ratKing}/>;
  return null;
};

const Imports = ({ account, gaming, lastUpdated }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('gaming-imports', IMPORTS_TOOLBAR);
  const imports = gaming?.imports ?? [];
  return <>
    <Toolbar state={toolbar} defaults={IMPORTS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={imports.length} shown={imports.length} noun={'imports'}>
      <Toolbar.Filter name={'boxDetails'} label={'Box details'}/>
    </Toolbar>
    <CardGrid size={'m'}>
      {imports.map((item, index) => {
        const { boxName, boxDescription, name, description, majorBonus, minorBonus, cost, rawName, acquired } = item;
        return <ItemCard key={name} icon={`data/${rawName}.png`} title={cleanUnderscore(name)}
                         meta={cleanUnderscore(boxName)} dimmed={!acquired}
                         footer={<ItemCard.Cost icon={bitsIcon} iconAlt={'Bits'}
                                                need={cost ?? 0} have={gaming?.bits ?? 0}
                                                game={'GamingStatType.ImportItemCOST'}/>}>
          {majorBonus ? <ItemCard.Desc text={importText(majorBonus)}/> : null}
          {minorBonus ? <ItemCard.Desc text={importText(minorBonus)}/> : null}
          {importExtras(index, item, gaming, account, lastUpdated)}
          {toolbar?.boxDetails ? <ItemCard.Section label={'Box'}>
            <ItemCard.Desc text={importText(boxDescription)}/>
            <ItemCard.Desc text={importText(description)}/>
          </ItemCard.Section> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Imports;
