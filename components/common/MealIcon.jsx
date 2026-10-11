import { styled } from '@mui/material/styles';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { CardHeader } from '@components/common/UpgradeCard';

// CookingMB sprites are an 82x56 canvas with the meal anchored to the bottom-center; art height
// grows with the meal index (early meals ~24px tall, late ones fill the canvas). The box size is
// fixed so text beside it lines up no matter which meal is drawn. The meal stands on the plate's
// top edge: any overlap hides the plate under the meal. Tall late-game meals overflow the box top.
const MealIcon = ({ rawName, plateLevel = 0, small = false, alt = '' }) => {
  const hasPlate = plateLevel > 0;
  return <Box small={small ? 1 : 0} plate={hasPlate ? 1 : 0}>
    {hasPlate ? <img className={'plate'} src={`${prefix}data/CookingPlate${plateLevel - 1}.png`} alt=""/> : null}
    <img className={'meal'} src={`${prefix}data/${rawName}.png`} alt={alt}/>
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

// Plated meal icon beside its bold name, with a muted subtitle line and optional badge icons
export const MealHeader = ({ rawName, name, level, subtitle, badges }) => {
  return <CardHeader icon={<MealIcon rawName={rawName} plateLevel={level} alt={rawName}/>}
                     title={cleanUnderscore(name)} subtitle={subtitle} badges={badges}/>
};

export default MealIcon;
