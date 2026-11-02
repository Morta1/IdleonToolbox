import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { ItemCardHeader } from '@components/common/cards/ItemCard';
import { MissingArt } from '@components/common/GameIcon';

// CookingMB sprites are an 82x56 canvas with the meal anchored to the bottom-center; art height
// grows with the meal index (early meals ~24px tall, late ones fill the canvas). The box size is
// fixed so text beside it lines up no matter which meal is drawn. The meal stands on the plate's
// top edge: any overlap hides the plate under the meal. Tall late-game meals overflow the box top.
// The plated meal copies the game's picture, so it is not a GameIcon (5a Decision 5); a meal sprite that fails to
// load shows GameIcon's missing-art box at the box's size, never the browser's broken image.
const MealIcon = ({ rawName, plateLevel = 0, small = false, alt = '' }) => {
  const [failedName, setFailedName] = useState(null);
  const hasPlate = plateLevel > 0;
  if (rawName && failedName === rawName) {
    const height = small ? 40 : 64;
    return <MissingArt style={{ width: small ? 56 : 82, height, fontSize: Math.max(10, height / 2) }}
                       role={alt ? 'img' : undefined} aria-label={alt || undefined}
                       aria-hidden={alt ? undefined : true}>?</MissingArt>;
  }
  // An image that failed before hydration fired its error before React was listening.
  const checkFailed = (img) => {
    if (img?.complete && img.naturalWidth === 0) setFailedName(rawName);
  };
  return <Box small={small ? 1 : 0} plate={hasPlate ? 1 : 0}>
    {hasPlate ? <img className={'plate'} src={`${prefix}data/CookingPlate${plateLevel - 1}.png`} alt=""/> : null}
    <img className={'meal'} ref={checkFailed} src={`${prefix}data/${rawName}.png`} alt={alt}
         onError={() => setFailedName(rawName)}/>
  </Box>
};

const PLATE_HEIGHT = 18;

const Box = styled('div', { shouldForwardProp: (prop) => prop !== 'small' && prop !== 'plate' })(({ small, plate }) => {
  const scale = small ? .75 : 1;
  return {
    flexShrink: 0,
    position: 'relative',
    width: small ? 56 : 82,
    height: small ? 40 : 64,
    '& img': {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    '& .meal': {
      width: 82 * scale,
      height: 56 * scale,
      bottom: plate ? PLATE_HEIGHT : 0
    },
    '& .plate': {
      width: 62,
      height: PLATE_HEIGHT,
      bottom: 0
    }
  };
});

// Plated meal icon beside its name, with a muted subtitle line and optional badge icons at the top right
export const MealHeader = ({ rawName, name, level, subtitle, badges }) => {
  return <ItemCardHeader icon={<MealIcon rawName={rawName} plateLevel={level} alt={rawName}/>}
                         title={cleanUnderscore(name)} meta={subtitle} aside={badges}/>
};

export default MealIcon;
