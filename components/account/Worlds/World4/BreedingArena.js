import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, pascalCase } from "utility/helpers";

const BreedingArena = ({ maxArenaLevel, arenaBonuses }) => {
  return <>
    <Stack direction={'row'} justifyContent={'center'} my={3}>
      <Card>
        <CardContent>
          <Typography sx={{ color: 'success.light' }}>Max level: {maxArenaLevel}</Typography>
        </CardContent>
      </Card>
    </Stack>
    <Stack direction={'row'} justifyContent={'center'} flexWrap={'wrap'} gap={2}>
      {arenaBonuses?.map(({ bonus, wave }, index) => {
        return <Card variant={'outlined'} sx={{ width: 200, opacity: maxArenaLevel < wave ? .5 : 1 }}
                     key={`${wave}-${index}`}>
          <CardContent>
            <Typography sx={{ fontWeight: 'bold' }}>Wave {wave}</Typography>
            <Typography>{cleanUnderscore(pascalCase(bonus))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default BreedingArena;
