import { Card, CardContent, Stack, Typography } from "@mui/material";
import { numberWithCommas } from "utility/helpers";
import React from 'react';

const Highscores = ({ title, highscore }) => {
  // coloHighscores
  // minigameHighscores
  return (
    <Stack gap={1.5} justifyContent={'center'}>
      <Typography variant={'h5'}>{title}</Typography>
      <Card>
        <CardContent>
          {highscore?.map((score, index) => {
            const realScore = score?.score ? score?.score : score;
            const key = score?.minigame || `${index + 1}`;
            return <div key={`${index}-${index}`}>
              {key ? <Typography variant={'body1'} component={'span'}>{key.capitalize()}: </Typography> : null}
              <Typography variant={'body1'} component={'span'}>{numberWithCommas(parseInt(realScore))}</Typography>
            </div>
          })}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Highscores;
