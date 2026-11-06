import { Box } from '@mui/material';
import { cleanUnderscore, formatNum, getCoinsArray } from '@utility/helpers';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import CoinDisplay from '@components/common/CoinDisplay';
import { getUpgradeHelpText } from '@components/common/UpgradeHelpIcon';
import { NextSeo } from 'next-seo';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { parseUpgradeVault } from '@parsers/misc/upgradeVault';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { MissingData, isSectionFailed } from '@components/common/styles';

const VAULT_TOOLBAR = { search: '', hideMaxed: false };

// A failed section draws the parser's own catalog on an empty save: names, sprites and sentences, nothing owned
const vaultCatalog = () => {
  try {
    return parseUpgradeVault(undefined, {}, []);
  } catch {
    return {};
  }
};

const coins = (amount) => <CoinDisplay dense money={getCoinsArray(amount ?? 0)}/>;

const UpgradeVault = () => {
  const { state } = useContext(AppContext);
  const vaultFailed = isSectionFailed(state?.account, 'upgradeVault');
  const vault = vaultFailed ? vaultCatalog() : (state?.account?.upgradeVault ?? {});
  const { upgrades = [], totalUpgradeLevels, nextUnlock, costReduction } = vault;
  const [view, setView, resetView] = useToolbarState('upgrade-vault', VAULT_TOOLBAR);
  const search = view.search?.trim().toLowerCase();
  const matches = (upgrade) => !search || cleanUnderscore(upgrade?.description ?? '').toLowerCase().includes(search)
    || cleanUpgradeName(upgrade?.name ?? '').toLowerCase().includes(search);
  const shown = vaultFailed ? upgrades
    : upgrades.filter((upgrade) => matches(upgrade) && (!view.hideMaxed || (upgrade?.level ?? 0) < upgrade?.maxLevel));
  const reductionText = formatNum(costReduction?.cheaperFactor ?? 1, 'mult');

  return <>
    <NextSeo
      title="Upgrade Vault | Idleon Toolbox"
      description="Keep track of your upgrade vault progress, upgrade, levels, cost to upgrade and more"
    />
    {vaultFailed ? <MissingData name={'Upgrade Vault'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Total levels'} value={vaultFailed ? '-' : formatNum(totalUpgradeLevels ?? 0)}/>
      {vaultFailed ? <StatTile label={'Vault cost reduction'} value={'-'}/>
        : costReduction?.cheaperFactor > 1 ? <StatTile label={'Vault cost reduction'} value={reductionText}
                                                       breakdownTitle={'Vault cost reduction'}
                                                       breakdown={{ ...costReduction.breakdown, totalValue: reductionText }}/> : null}
      {vaultFailed ? <StatTile label={'Next upgrade'} value={'-'}/>
        : nextUnlock?.unlockLevel ? <StatTile label={'Next upgrade'} value={cleanUpgradeName(nextUnlock.name ?? '')}
                                              sub={`At ${formatNum(nextUnlock.unlockLevel)} total levels`}
                                              info={cleanUnderscore(nextUnlock.description ?? '')}/> : null}
    </PageSummary>
    <Box>
      {vaultFailed ? null : <Toolbar state={view} defaults={VAULT_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={upgrades.length} shown={shown.length} noun={'upgrades'}>
        <Toolbar.Search placeholder={'Search upgrades'}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
      </Toolbar>}
      <CardGrid size={'m'}>
        {shown.map((upgrade) => {
          const { index, name, cost, costToMax, description, unlockLevel, maxLevel, level = 0, unlocked } = upgrade ?? {};
          const maxed = level >= maxLevel;
          // The game's (?) box for the upgrade, shown on the card rather than behind an i
          const help = getUpgradeHelpText('vault', index);
          return <ItemCard key={index} icon={`data/VaultUpg${index}.png`} title={cleanUpgradeName(name ?? '')}
                           level={vaultFailed ? undefined : { value: level, max: maxLevel }}
                           status={vaultFailed ? undefined : maxed ? 'maxed' : unlocked ? undefined : 'locked'}
                           statusLabel={!vaultFailed && !maxed && !unlocked ? `Unlocks at ${formatNum(unlockLevel ?? 0)} total levels` : undefined}
                           footer={vaultFailed || !unlocked ? null : <ItemCard.Facts rows={[
                             ['Cost', coins(cost)],
                             ['Cost to max', coins(costToMax)]
                           ]}/>}>
            <ItemCard.Desc text={cleanUnderscore(description ?? '').split('\n')}/>
            {help ? <ItemCard.Section label={'More info'}><ItemCard.Desc text={help.split('\n')}/></ItemCard.Section> : null}
          </ItemCard>;
        })}
      </CardGrid>
    </Box>
  </>;
};

export default UpgradeVault;
