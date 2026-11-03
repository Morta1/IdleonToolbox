import { Stack } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const TheDen = ({ hole }) => {
  const theDen = hole?.caverns?.theDen;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {/* The best score is the parser's text, in commas */}
      <StatTile label={'Best score'} icon={'etc/Amp_Best_Score.png'} value={theDen?.bestScore ?? 0}/>
      <StatTile label={'Next opal at'} icon={'data/Opal.png'}
                value={formatGame(theDen?.nextOpalAt ?? 0, 'Holes.HoundNextOpalScoreReq')}/>
      <StatTile label={'Amplifier multi'} value={`${formatGame(theDen?.ampMulti ?? 1, 'Holes.AmpMulti')}x`}/>
      {opalsFoundTile(hole, 2)}
    </Stack>
    <CardGrid size={'m'}>
      {(theDen?.amplifiers ?? []).map(({ ampName, ampDescription, level, bonus }, index) =>
        <ItemCard key={`amp-${index}`} icon={`data/HoleFightAmp${index}.png`} title={cleanUnderscore(ampName)}
                  level={{ value: level ?? 0 }} status={index < (theDen?.ownedAmps ?? 0) ? undefined : 'locked'}>
          {/* The parser's bonus is already the game's Small or Big */}
          <ItemCard.Desc text={(ampDescription ?? '').replace('{', bonus)}/>
        </ItemCard>)}
    </CardGrid>
  </>;
};

export default TheDen;
