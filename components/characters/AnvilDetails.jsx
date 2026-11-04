import React from 'react';
import { formatNum, getCoinsArray } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CoinDisplay from '../common/CoinDisplay';
import { calcAnvilExp, getPlayerAnvil } from '@parsers/world-1/anvil';
import GameIcon from '@components/common/GameIcon';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';

const Coins = ({ amount }) => <CoinDisplay title={''} maxCoins={3} money={getCoinsArray(amount)}/>;

const AnvilDetails = ({ character, account, characters }) => {
  const { stats } = getPlayerAnvil(character, characters, account);
  const {
    xpPoints,
    speedPoints,
    capPoints,
    anvilSpeed,
    anvilCapacity,
    anvilCost,
    baseAnvilExp,
    availablePoints,
    pointsFromCoins,
    pointsFromMats,
    pointsFromAcme
  } = stats;
  const smithingLevel = character?.skillsInfo?.smithing?.level ?? 0;
  const totalPoints = pointsFromCoins + pointsFromMats + smithingLevel + pointsFromAcme;
  return <Panel title={'Anvil details'}>
    <Panel.Group label={'Points'}>
      <Panel.KV label={'Spent'} value={`${formatNum(totalPoints - availablePoints)} / ${formatNum(totalPoints)}`}/>
      {availablePoints > 0 ? <Panel.KV label={'Unspent'} value={<StatusText status={'needs'}>{formatNum(availablePoints)}</StatusText>}/> : null}
      <Panel.KV label={'From materials'} value={formatNum(pointsFromMats)}/>
      <Panel.KV label={'From coins'} value={formatNum(pointsFromCoins)}/>
      <Panel.KV label={'From Smithing'} value={formatNum(smithingLevel)}/>
      <Panel.KV label={'From Acme'} value={formatNum(pointsFromAcme)}/>
      <Panel.KV label={'In EXP'} value={formatNum(xpPoints)}/>
      <Panel.KV label={'In speed'} value={formatNum(speedPoints)}/>
      <Panel.KV label={'In capacity'} value={formatNum(capPoints)}/>
    </Panel.Group>
    <Panel.Group label={'Bonus'}>
      <Panel.KV label={'EXP'} value={`${formatGame(calcAnvilExp(character, characters, account, baseAnvilExp, xpPoints), 'AnvilProduceStats.ProdExpBonus')}%`}/>
      <Panel.KV label={'Speed'} value={formatGame(anvilSpeed, 'AnvilProduceStats.ProductionSpeed')}/>
      <Panel.KV label={'Capacity'} value={formatGame(anvilCapacity, 'AnvilProduceStats.Cap', { whole: true })}/>
    </Panel.Group>
    <Panel.Group label={'Material'}>
      {anvilCost?.rawName ? <Panel.KV label={'Item'} value={<GameIcon src={`data/${anvilCost?.rawName}.png`} size={24} alt={'Anvil upgrade material'}/>}/> : null}
      <Panel.KV label={'Upgrade cost'} value={formatNum(anvilCost?.nextMatUpgrade, 'whole')}/>
      <Panel.KV label={'Total spent'} value={formatNum(anvilCost?.totalMats, 'whole')}/>
    </Panel.Group>
    <Panel.Group label={'Money'}>
      <Panel.KV label={'Upgrade cost'} value={<Coins amount={anvilCost?.nextCoinUpgrade}/>}/>
      <Panel.KV label={'Total spent'} value={<Coins amount={anvilCost?.totalCoins}/>}/>
      {anvilCost?.coinsToMax > 0 ? <Panel.KV label={'Coins to max'} value={<Coins amount={anvilCost?.coinsToMax}/>}/> : null}
    </Panel.Group>
  </Panel>;
};

export default AnvilDetails;
