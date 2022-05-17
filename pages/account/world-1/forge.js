import { AppContext } from "../../../components/common/context/AppProvider";
import { useContext } from "react";
import { Card, CardContent, Grid, Stack, Typography, useMediaQuery } from "@mui/material";
import { prefix } from "../../../utility/helpers";

const slot = {
  width: 72,
  alignItems: 'center'
}

const Forge = () => {
  const { state } = useContext(AppContext);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

  return <>
    <Typography mt={2} mb={2} variant={'h2'}>Forge</Typography>
    <Grid container gap={2}>
      {state?.account?.forge?.map(({ ore, barrel, bar, isBrimestone }, index) => {
        const materials = [ore, barrel, bar];
        return <Grid item key={`${ore}-${barrel}-${bar}-${index}`}>
          <Card sx={{ position: 'relative', borderColor: isBrimestone ? '#9b689bbf' : 'none' }}
                variant={'outlined'} key={`${ore}-${barrel}-${bar}-${index}`}>
            <CardContent>
              <Stack direction={'row'}>
                {materials?.map(({ rawName, quantity }, matIndex) => {
                  return <Stack key={`${rawName}-${matIndex}`} sx={slot}>
                    <img style={{ width: !isMd ? 'auto' : 36 }} src={`${prefix}data/${rawName}.png`} alt=""/>
                    {quantity > 0 ?
                      <Typography variant={'body1'} component={'span'}>{quantity}</Typography> : null}
                  </Stack>
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      })}
    </Grid>
  </>
};

export default Forge;
