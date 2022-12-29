import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import Tooltip from "../Tooltip";

const Activity = ({ afkTarget, divStyle }) => {
  return (
    <Card sx={{ width: 200 }} variant={"outlined"}>
      <CardContent>
        <Typography color={"info.light"}>Activity</Typography>
        {afkTarget && afkTarget !== "_" ? (
          <Stack direction="row" alignItems="center" gap={1}>
            {afkTarget === 'Divinity' ?
              <Tooltip title={cleanUnderscore(divStyle?.description.replace('@', ''))}>
                <img style={{ height: 40 }} src={`${prefix}etc/Div_Style_${divStyle?.index ?? 0}.png`} alt=""/>
              </Tooltip> : null}
            <ActivityImg src={`${prefix}afk_targets/${afkTarget}.png`} alt=""/>
            <Typography>{cleanUnderscore(afkTarget)}</Typography>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="center" gap={1}>
            <ActivityImg src={`${prefix}data/Afkz5.png`} alt=""/>
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
