import { Typography } from '@mui/material';
import { cleanUnderscore, growth } from 'utility/helpers';
import { gameBonusText } from '@utility/gameNotation';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import StatusText from '@components/common/StatusText';

const PlayerBubbles = ({ bubbles }) => {
  const equipped = bubbles?.filter(({ bubbleName }) => bubbleName) ?? [];
  return <Panel title={'Equipped bubbles'}>
    {equipped.length ? <CardGrid size={'icon'} sheetColumns={[8, 6]}>
      {equipped.map((bubble, index) => {
        const name = bubble.bubbleName === 'BUG]' ? 'Bug2' : bubble.bubbleName;
        return <IconTile key={`${name}-${index}`} icon={`data/${bubble.rawName}.png`} alt={cleanUnderscore(name)}
                         details={<BubbleDetails {...bubble} bubbleName={name}/>}/>;
      })}
    </CardGrid> : <StatusText status={'needs'}>No active bubble</StatusText>}
  </Panel>;
};

const BubbleDetails = ({ bubbleName, desc, func, level, x1, x2 }) => <>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(bubbleName)}</Typography>
  <Typography variant={'body2'}>{cleanUnderscore(desc ?? '').replace(/({}?)|\$/g, gameBonusText(growth(func, level, x1, x2)))}</Typography>
</>;

export default PlayerBubbles;
