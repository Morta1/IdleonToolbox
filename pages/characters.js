import React, { useContext, useMemo } from "react";
import { Grid, Stack, Typography } from "@mui/material";
import Character from "components/characters";
import { AppContext } from "components/common/context/AppProvider";
import { NextSeo } from "next-seo";

const Characters = () => {
  const { state } = useContext(AppContext);
  const numberOfCharacters = useMemo(() => Object.values(state?.displayedCharacters || [])?.filter((val) => val).length, [state]);
  const characterCols = Math.max(3, 12 / numberOfCharacters);
  return <>
    <NextSeo
      title="Idleon Toolbox | Characters"
      description="Characters overview for a lot of the game aspects"
    />
    {numberOfCharacters > 0 ? (
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
    )}
  </>
};

export default Characters;
