import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, prefix } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import {
  ARCADE_MAX_LEVEL,
  ARCADE_OMEGA_LEVEL,
  ARCADE_SUPER_LEVEL,
  formatArcadeEffect,
  getArcade,
  getArcadeCapCost,
  isArcadePlaceholder
} from '@parsers/world-2/arcade';
import { getStampBonus } from '@parsers/world-1/stamps';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const GOLD_BALL_ICON = 'data/PachiBall1.png';
// The game's Royal and Omega ball glyphs (font 472) and Super / Omega level banners (font 675)
const ROYAL_BALL_ICON = 'etc/RoyalBall.png';
const OMEGA_BALL_ICON = 'etc/OmegaBall.png';
const ARCADE_SUPER_BANNER = 'etc/ArcadeSuper.png';
const ARCADE_OMEGA_BANNER = 'etc/ArcadeOmega.png';
// The game draws every arcade cost "Cost:_" + CommaNotation(ArcadeCost), the cap's Royal and Omega balls included, so
// the balls that pay for them read in the same rule
const COST_RULE = 'DungeonCalc.ArcadeCost';

const ARCADE_TOOLBAR = { hideMaxed: false, hideSuper: false, hideOmega: false };

// The sections the page reads, in the order the note names the first that failed: the shop, and the Arcade Stamp that
// cuts its gold ball costs
const SECTION_NAMES = { arcade: 'Arcade Shop', stamps: 'Stamps' };

const upgradeIndexOf = (upgrade) => parseInt(upgrade?.iconName?.replace('PachiShopICON', ''), 10);

// game: "DungeonCalc:ArcadeCost" (gold balls below Lv 100; Royal and Omega balls are getArcadeCapCost). stampMath is
// the Arcade Stamp's cut, at most 40%.
const getCost = (level, upgradeIndex, stampMath) => {
  // Different cost formulas based on upgrade index
  if (upgradeIndex === 39) {
    return Math.round(stampMath * (5 + 3 * level));
  } else if (upgradeIndex === 51 || upgradeIndex === 54 || upgradeIndex === 999) {
    return Math.round(stampMath * (10 + (5 * level + Math.pow(level, 1.43))));
  } else if (upgradeIndex >= 70) {
    // Checked before the >= 62 tier: the 2 upgrades added in 2.3.525 (indices 70/71) use this curve.
    return Math.round(stampMath * (20 + (10 * level + Math.pow(level, 1.92))));
  } else if (upgradeIndex >= 62) {
    return Math.round(stampMath * (20 + (10 * level + Math.pow(level, 1.69))));
  } else if (upgradeIndex >= 55 && upgradeIndex !== 60 && upgradeIndex !== 61) {
    return Math.round(stampMath * (20 + (10 * level + Math.pow(level, 1.83))));
  } else {
    return Math.round(stampMath * (5 + (3 * level + Math.pow(level, 1.3))));
  }
};

const getCostToMax = (level, upgradeIndex, stampMath) => {
  let total = 0;
  for (let i = level; i < ARCADE_MAX_LEVEL; i++) {
    total += getCost(i, upgradeIndex, stampMath);
  }
  return total;
};

// The level's word beside the game's banner art for it, kept as the game draws it (GameIcon fits a square): 14 px tall
// on the game's screen, stored at twice that. On the meta line, where the game draws it under the name, so a long name
// keeps the card's width.
const levelMeta = (isOmega) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
  {isOmega ? 'Omega' : 'Super'}
  <Box component={'img'} src={`${prefix}${isOmega ? ARCADE_OMEGA_BANNER : ARCADE_SUPER_BANNER}`}
       alt={isOmega ? 'Omega' : 'Super'} sx={{ display: 'block', height: 14, width: 'auto' }}/>
</Box>;

const ArcadeShop = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('arcade-shop', ARCADE_TOOLBAR);
  const failedSection = Object.keys(SECTION_NAMES).find((section) => isSectionFailed(account, section));
  const arcadeFailed = isSectionFailed(account, 'arcade');
  const stampsFailed = isSectionFailed(account, 'stamps');
  const { balls, goldBalls, royalBalls, omegaBalls, goldBallMulti } = account?.arcade ?? {};
  // A failed section's {} default: the shop at zero, the parser's own with no save, with no cost or state
  const shop = ((arcadeFailed ? getArcade({}, {}, {})?.shop : account?.arcade?.shop) ?? [])
    .filter((upgrade) => !isArcadePlaceholder(upgrade));
  const arcadeStamp = getStampBonus(account, 'misc', 'StampC5', 0);
  const stampMath = Math.max(0.6, 1 - arcadeStamp / 100);

  const passesFilter = (upgrade) => {
    if (toolbar?.hideMaxed && upgrade.level === ARCADE_MAX_LEVEL) return false;
    if (toolbar?.hideSuper && upgrade.level === ARCADE_SUPER_LEVEL) return false;
    if (toolbar?.hideOmega && upgrade.level >= ARCADE_OMEGA_LEVEL) return false;
    return true;
  };
  const shown = arcadeFailed ? shop : shop.filter(passesFilter);
  const activeUpgrades = shown.filter((upgrade) => upgrade.active).toSorted((a, b) => a?.rotationIndex - b?.rotationIndex);
  const inactiveUpgrades = shown.filter((upgrade) => !upgrade.active);

  const totalCostToMax = shop.reduce((total, upgrade) => total + getCostToMax(upgrade.level, upgradeIndexOf(upgrade), stampMath), 0);
  const multiText = arcadeFailed ? '-' : formatNum(goldBallMulti?.value ?? 1, 'mult');
  const ballsText = (value) => (arcadeFailed ? '-' : formatGame(value ?? 0, COST_RULE));

  // An upgrade below Lv 100 costs gold balls; Lv 100 to Super costs Royal balls and Super to Omega Omega balls, where
  // the game shows no more cost. The cost line stands alone, as the game's "Cost:" line does: in a Facts row its sprite
  // sat the numbers above the label's line.
  const capFooter = (capCost) => {
    const omega = capCost.currency === 'omega';
    return <ItemCard.Cost icon={omega ? OMEGA_BALL_ICON : ROYAL_BALL_ICON} iconAlt={omega ? 'Omega balls' : 'Royal balls'}
                          need={capCost.cost} have={(omega ? omegaBalls : royalBalls) ?? 0} game={COST_RULE}/>;
  };
  const goldFooter = (level, upgradeIndex) => (stampsFailed
    ? <ItemCard.Facts rows={[['Next cost', '-'], ['Cost to max', '-']]}/>
    : <>
      <ItemCard.Cost icon={GOLD_BALL_ICON} iconAlt={'Gold balls'} need={getCost(level, upgradeIndex, stampMath)}
                     have={goldBalls ?? 0} game={COST_RULE}/>
      <ItemCard.Facts rows={[['Cost to max', formatGame(getCostToMax(level, upgradeIndex, stampMath), COST_RULE)]]}/>
    </>);

  const upgradeCard = (upgrade) => {
    const { level = 0, effect, iconName, bonus } = upgrade;
    const title = cleanUnderscore(formatArcadeEffect(effect, bonus));
    if (arcadeFailed) return <ItemCard key={iconName} icon={`data/${iconName}.png`} title={title}/>;
    const capCost = getArcadeCapCost(level);
    const isSuper = level === ARCADE_SUPER_LEVEL;
    const isOmega = level >= ARCADE_OMEGA_LEVEL;
    return <ItemCard key={iconName} icon={`data/${iconName}.png`} title={title}
                     level={level <= ARCADE_MAX_LEVEL ? { value: level, max: ARCADE_MAX_LEVEL } : undefined}
                     meta={isOmega || isSuper ? levelMeta(isOmega) : undefined}
                     footer={level < ARCADE_MAX_LEVEL ? goldFooter(level, upgradeIndexOf(upgrade))
                       : capCost ? capFooter(capCost) : null}/>;
  };

  return <>
    <NextSeo
      title="Arcade Shop | Idleon Toolbox"
      description="Track your arcade shop upgrades, ball counts, golden balls, and bonus effects in Legends of Idleon"
    />
    {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed/> : null}
    <PageSummary>
      <StatTile label={'Balls'} icon={'data/PachiBall0.png'} value={arcadeFailed ? '-' : formatNum(balls ?? 0)}/>
      <StatTile label={'Gold balls'} icon={GOLD_BALL_ICON} value={ballsText(goldBalls)}/>
      <StatTile label={'Gold ball multi'} value={multiText}
                breakdown={!arcadeFailed && goldBallMulti?.breakdown ? { ...goldBallMulti.breakdown, totalValue: multiText } : undefined}/>
      <StatTile label={'Royal balls'} icon={ROYAL_BALL_ICON} value={ballsText(royalBalls)}/>
      <StatTile label={'Omega balls'} icon={OMEGA_BALL_ICON} value={ballsText(omegaBalls)}/>
      <StatTile label={'Cost to max all'} icon={!failedSection && totalCostToMax > 0 ? GOLD_BALL_ICON : undefined}
                value={failedSection ? '-' : formatGame(totalCostToMax, COST_RULE)}/>
    </PageSummary>
    <Box>
      {/* A failed section's upgrades are all at zero: nothing for the filters to hide */}
      {arcadeFailed ? null : <Toolbar state={toolbar} defaults={ARCADE_TOOLBAR} onChange={setToolbar}
                                      onReset={resetToolbar} total={shop.length} shown={shown.length}
                                      noun={'upgrades'}>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.Filter name={'hideSuper'} label={'Hide Super'}/>
        <Toolbar.Filter name={'hideOmega'} label={'Hide Omega'}/>
      </Toolbar>}
      {arcadeFailed ? <CardGrid size={'m'}>{shop.map(upgradeCard)}</CardGrid> : <>
        {activeUpgrades.length ? <>
          <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>Current rotation</Typography>
          <CardGrid size={'m'}>{activeUpgrades.map(upgradeCard)}</CardGrid>
        </> : null}
        {inactiveUpgrades.length ? <>
          <Typography variant={'sectionTitle'} component={'h2'}
                      sx={{ mt: activeUpgrades.length ? 4 : 0, mb: 1.5 }}>Off rotation</Typography>
          <CardGrid size={'m'}>{inactiveUpgrades.map(upgradeCard)}</CardGrid>
        </> : null}
      </>}
    </Box>
  </>;
};

export default ArcadeShop;
