import { Stack } from '@mui/material';
import { cleanUnderscore, gameFill, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const TheDen = ({ hole }) => {
  const theDen = hole?.caverns?.theDen;
  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Best score'} icon={'etc/Amp_Best_Score.png'} value={gameFill(theDen?.bestScore ?? 0, 'Comma', { whole: true })}/>
      <StatTile label={'Next opal at'} icon={'data/Opal.png'}
                value={formatGame(theDen?.nextOpalAt ?? 0, 'Holes.HoundNextOpalScoreReq')}/>
      <StatTile label={'Amplifier multi'} value={`${formatGame(theDen?.ampMulti ?? 1, 'Holes.AmpMulti')}x`}/>
      {opalsFoundTile(hole, 2)}
    </Stack>
    <CardGrid size={'m'}>
      {(theDen?.amplifiers ?? []).map(({ ampName, ampDescription, level, maxLevel, bonus }, index) =>
        <ItemCard key={`amp-${index}`} icon={`data/HoleFightAmp${index}.png`} title={titleCaseName(cleanUnderscore(ampName))}
                  level={{ value: level ?? 0, max: maxLevel }} status={index < (theDen?.ownedAmps ?? 0) ? undefined : 'locked'}>
          {/* The parser's bonus is already the game's Small or Big */}
          <ItemCard.Desc text={(ampDescription ?? '').replace('{', bonus)}/>
        </ItemCard>)}
    </CardGrid>
  </>;
};

export default TheDen;
