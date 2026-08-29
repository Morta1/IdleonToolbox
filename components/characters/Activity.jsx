import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import { getActivityIcon } from '@utility/spriteImages';
import Tooltip from '../Tooltip';
import { isGodEnabledBySorcerer } from '@parsers/world-4/lab';
import { isCompanionBonusActive } from '@parsers/misc';
import { getDeityLinkedIndex } from '@parsers/world-5/divinity';

const Activity = ({ playerId, afkTarget, targetMonster, monsterFace, account, divStyle, characters }) => {
  const isLabConnectedByDivinity = () => {
    return account?.lab?.connectedPlayers?.find((char) => char?.playerId === playerId)?.isDivinityConnected;
  }

  const gods = getDeityLinkedIndex(account, characters, 4);
  const hasGoatGod = gods.includes(playerId);

  return (
    <Card sx={{ width: 220 }} variant={'outlined'}>
      <CardContent>
        <Typography color={'info.light'}>Activity</Typography>
        {afkTarget && afkTarget !== '_' ? (
          <Stack direction="row" alignItems="center" gap={1}>
            {afkTarget === 'Divinity' || isLabConnectedByDivinity() || hasGoatGod ?
              <Tooltip title={cleanUnderscore(divStyle?.description.replace('@', ''))}>
                <img style={{ height: 40, width: 58 }} src={`${prefix}etc/Div_Style_${divStyle?.index ?? 0}.png`}
                  alt="" />
              </Tooltip> : null}
            <Stack>
              <Stack direction={'row'} alignItems="center" gap={1}>
                <ActivityImg src={getActivityIcon({ afkTarget, targetMonster, monsterFace })} alt="" />
                <Typography>{cleanUnderscore(afkTarget)}</Typography>
              </Stack>
              {isLabConnectedByDivinity() ? <Stack direction={'row'} alignItems="center" gap={1}>
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
