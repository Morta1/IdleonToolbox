import Tooltip from '../Tooltip';
import { cleanUnderscore, growth, prefix } from 'utility/helpers';
import { Card, CardContent, Stack, Typography } from '@mui/material';

const PlayerBubbles = ({ bubbles }) => {
  const empty = bubbles?.every(({ bubbleName }) => !bubbleName);
  return <>
    <Stack direction={'row'} sx={{ height: 'fit-content' }}>
      {empty ? <Card variant={'outlined'}>
        <CardContent><Tooltip title={'Missing Active Bubble'}>
          <img src={`${prefix}data/aUpgradesG2.png`}
               style={{ width: 42, height: 42, filter: 'brightness(0)' }}
               alt=""/>
        </Tooltip></CardContent></Card> : null}
      {!empty ? <Card variant={'outlined'}>
        <CardContent>
          <Stack direction={'row'} gap={2} flexWrap="wrap" justifyContent={'center'}>
            {bubbles?.map((bubble, index) => {
              const { bubbleName, rawName } = bubble;
              if (!bubbleName) return null;
              const alteredBubbleName = bubbleName === 'BUG]' ? 'Bug2' : bubbleName;
              return <Tooltip key={alteredBubbleName + index}
                              title={<BubbleTooltip {...{ ...bubble, bubbleName: alteredBubbleName }}/>}>
                <img src={`${prefix}data/${rawName}.png`}
                     style={{ width: 42, height: 42 }}
                     alt=""/>
              </Tooltip>;
            })}
          </Stack>
        </CardContent>
      </Card> : null}
    </Stack>
  </>
};

const BubbleTooltip = ({ bubbleName, desc, func, level, x1, x2 }) => {
  const effect = growth(func, level, x1, x2);
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(bubbleName)}</Typography>
    <Typography>{cleanUnderscore(desc).replace(/({}?)|\$/g, effect)}</Typography>
  </>;
}

export default PlayerBubbles;
