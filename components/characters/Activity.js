import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import styled from "@emotion/styled";

const Activity = ({ afkTarget }) => {
  return (
    <Card sx={{ width: 200 }} variant={"outlined"}>
      <CardContent>
        <Typography color={"info.light"}>Activity</Typography>
        {afkTarget && afkTarget !== "_" ? (
          <Stack direction="row" alignItems="center" gap={1}>
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
