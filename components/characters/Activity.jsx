import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from 'utility/helpers';
import styled from '@emotion/styled';
import Tooltip from '../Tooltip';
import { isGodEnabledBySorcerer } from '@parsers/lab';
import { isCompanionBonusActive } from '@parsers/misc';
import { getDeityLinkedIndex } from '@parsers/divinity';

const Activity = ({ playerId, afkTarget, account, divStyle, characters }) => {
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
                <ActivityImg src={`${prefix}afk_targets/${afkTarget}.png`} alt="" />
                <Typography>{cleanUnderscore(afkTarget)}</Typography>
              </Stack>
              {isLabConnectedByDivinity() ? <Stack direction={'row'} alignItems="center" gap={1}>
                <ActivityImg src={`${prefix}afk_targets/Divinity.png`} alt="" />
                <Typography>Divinity</Typography>
              </Stack> : null}
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={1}>
            <ActivityImg src={`${prefix}data/Afkz5.png`} alt="" />
            <Typography>Nothing</Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const ActivityImg = styled.img`
  width: 35px;
  height: 35px;
  object-fit: contain;
`;

export default Activity;
