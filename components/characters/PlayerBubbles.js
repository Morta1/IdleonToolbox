import Tooltip from "../Tooltip";
import { cleanUnderscore, growth, prefix } from "utility/helpers";
import { Stack, Typography } from "@mui/material";

const PlayerBubbles = ({ bubbles }) => {
  return <Stack>
    <Typography variant={'h5'}>Bubbles</Typography>
    <Stack direction={'row'}>
      {bubbles?.map((bubble, index) => {
        const { bubbleName, rawName } = bubble;
        const alteredBubbleName = bubbleName === 'BUG]' ? 'Bug2' : bubbleName;
        return <Tooltip key={alteredBubbleName + index}
                        title={<BubbleTooltip {...{ ...bubble, bubbleName: alteredBubbleName }}/>}>
          <img src={`${prefix}data/${rawName}.png`}
               alt=""/>
        </Tooltip>;
      })}
    </Stack>
  </Stack>
};

const BubbleTooltip = ({ bubbleName, desc, func, level, x1, x2 }) => {
  const effect = growth(func, level, x1, x2);
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(bubbleName)}</Typography>
    <Typography>{cleanUnderscore(desc).replace(/({}?)|\$/g, effect)}</Typography>
  </>
}

export default PlayerBubbles;
