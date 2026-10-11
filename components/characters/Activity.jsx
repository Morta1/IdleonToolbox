import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getActivityIcon } from '@utility/spriteImages';
import Tooltip from '../Tooltip';
import { isGainingDivinityPoints, isMeditatingForDivinity } from '@parsers/world-5/divinity';

const Activity = ({ playerId, afkTarget, targetMonster, monsterFace, account, divStyle, characters }) => {
  const character = characters?.[playerId];
  const gainsDivinity = isGainingDivinityPoints(character, account, characters);
  const meditatesElsewhere = afkTarget !== 'Divinity' && isMeditatingForDivinity(character, account, characters);

  return (
    <Card sx={{ width: 220 }} variant={'outlined'}>
      <CardContent>
        <Typography color={'info.light'}>Activity</Typography>
        {afkTarget && afkTarget !== '_' ? (
          <Stack direction="row" alignItems="center" gap={1}>
            {gainsDivinity ?
              <Tooltip title={cleanUnderscore(divStyle?.description.replace('@', ''))}>
                <img style={{ height: 40, width: 58 }} src={`${prefix}etc/Div_Style_${divStyle?.index ?? 0}.png`}
                  alt="" />
              </Tooltip> : null}
            <Stack>
              <Stack direction={'row'} alignItems="center" gap={1}>
                <ActivityImg src={getActivityIcon({ afkTarget, targetMonster, monsterFace })} alt="" />
                <Typography>{cleanUnderscore(afkTarget)}</Typography>
              </Stack>
              {meditatesElsewhere ? <Stack direction={'row'} alignItems="center" gap={1}>
                <ActivityImg src={`${prefix}afk_targets/Divinity.png`} alt="Divinity" />
                <Typography>Divinity</Typography>
              </Stack> : null}
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={1}>
            <ActivityImg src={`${prefix}data/Afkz5.png`} alt="Afkz5" />
            <Typography>Nothing</Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const ActivityImg = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`;

export default Activity;
