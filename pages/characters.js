import React, { useContext, useMemo } from "react";
import { Grid, Stack, Typography } from "@mui/material";
import Character from "components/characters";
import { AppContext } from "components/common/context/AppProvider";

const characters = () => {
  const { state } = useContext(AppContext);
  const numberOfCharacters = useMemo(() => Object.values(state?.displayedCharacters || [])?.filter((val) => val).length, [state]);
  const characterCols = Math.max(3, 12 / numberOfCharacters);
  return numberOfCharacters > 0 ? (
    <>
      <Grid container sx={{ gap: { xs: 2 } }} columns={12.5}>
        {state?.characters?.map((character, index) => {
          return state?.displayedCharacters?.[character?.name] ? <Character filters={state?.filters} account={state?.account}
           character={character} cols={characterCols} lastUpdated={state?.lastUpdated} key={`${character?.name}-${index}`} /> : null;
        })}
      </Grid>
    </>
  ) : (
    <Stack alignItems={"center"} justifyContent={"center"}>
      <Typography variant={"h4"}>Please select a character</Typography>
    </Stack>
  );
};

export default characters;
