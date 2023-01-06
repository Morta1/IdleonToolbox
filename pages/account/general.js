import { Divider, Grid, Stack } from "@mui/material";
import ObolsView from "components/account/Worlds/World2/ObolsView";
import Currencies from "components/account/Misc/Currencies";
import Shrines from "components/account/Worlds/World3/Shrines";
import Statues from "components/account/Worlds/World1/Statues";
import Highscores from "components/account/Misc/Highscores";
import Totals from "components/account/Misc/Totals";
import { AppContext } from "components/common/context/AppProvider";
import { useContext } from "react";
import Library from "../../components/account/Worlds/World3/Library";

const dividerSx = { marginTop: 4, display: { xs: "flex", sm: "none" } };

const General = () => {
  const { state } = useContext(AppContext);
  return <>
    <Grid container justifyContent={'center'} gap={5} columns={{ md: 8, lg: 12, xl: 16 }}>
      <Grid item xs={12} sm={12} md={5}>
        <ObolsView obols={state?.account?.obols} type={'account'}/>
        <Divider sx={dividerSx}/>
      </Grid>
      <Grid item xs={3}>
        <Currencies {...(state?.account?.currencies || {})}/>
        <Divider sx={dividerSx}/>
      </Grid>
      <Grid item xs={3}>
        <Shrines shrines={state?.account?.shrines}/>
        <Divider sx={dividerSx}/>
      </Grid>
      <Grid item xs={3}>
        <Library libraryTimes={state?.account?.libraryTimes} lastUpdated={state?.lastUpdated}/>
        <Divider sx={dividerSx}/>
      </Grid>
      <Grid item xs={3}>
        <Statues statues={state?.account?.statues}/>
        <Divider sx={dividerSx}/>
      </Grid>
      <Grid item xs={3}>
        <Stack gap={1.5}>
          <Highscores title={'Colosseum Highscores'} highscore={state?.account?.highscores?.coloHighscores}/>
          <Divider sx={dividerSx}/>
          <Highscores title={'Minigames Highscores'} highscore={state?.account?.highscores?.minigameHighscores}/>
          <Divider sx={dividerSx}/>
        </Stack>
      </Grid>
      <Grid item xs={3}>
        <Totals account={state?.account}/>
      </Grid>
    </Grid>
  </>
};


export default General;
