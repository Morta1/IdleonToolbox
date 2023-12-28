import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '../../../../utility/helpers';
import Tooltip from '../../../Tooltip';

const Traits = ({ statBoosts }) => {
  return <>
    {statBoosts.map(({ section, levelReq, bonuses }, sectionIndex) => {
      return <Stack my={3} key={section + sectionIndex} direction={'row'} gap={2}>
        <Stack sx={{ width: 200 }} gap={1}>
          <Typography sx={{ fontWeight: 'bold' }}>{section}</Typography>
          <Typography>Rank {levelReq}+</Typography>
        </Stack>
        <Stack direction={'row'} gap={2} alignItems={'center'}>
          {bonuses.map(({ bonus, isActive, bonusIndex }, index) => {
            const iconName = isActive ? 'DungTraitA' : 'DungTraitB';
            return <Stack key={'bonus' + index} direction={'row'} gap={2}>
              <Tooltip title={cleanUnderscore(bonus)}>
                <img src={`${prefix}data/${iconName}${bonusIndex}.png`} alt={''}/>
              </Tooltip>
            </Stack>
          })}
        </Stack>
      </Stack>
    })}
  </>
};

export default Traits;
