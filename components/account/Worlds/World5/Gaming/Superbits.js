import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber } from "../../../../../utility/helpers";

const Superbits = ({ superbits }) => {
  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'}>
      {superbits?.map(({ name, description, unlocked, bonus, totalBonus, additionalInfo }, index) => {
        return <Card key={name + `${index}`} sx={{
          width: 300,
          border: unlocked ? "1px solid #81c784" : "",
          opacity: !unlocked ? 0.5 : 1,
        }}>
          <CardContent>
            <Typography>{cleanUnderscore(name.capitalize())}</Typography>
            <Typography
              sx={{ mt: 2 }}>{cleanUnderscore(description?.replace('}', bonus)?.replace('{', notateNumber(totalBonus)))}</Typography>
            {additionalInfo ? <Typography sx={{ mt: 2 }}>{cleanUnderscore(additionalInfo)}</Typography> : null}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Superbits;
