import React, { useContext, useMemo } from "react";
import { Card, CardContent, Typography, Stack } from "@mui/material";
import { AppContext } from "components/common/context/AppProvider";
import ProgressBar from "components/common/ProgressBar";
import { prefix } from "utility/helpers";
import { Box } from "@mui/system";

const Worship = () => {
  const { state } = useContext(AppContext);

  const totalCharge = useMemo(() => state?.characters?.reduce((res, { worship }) => res + worship?.currentCharge, 0), [state]);

  return (
    <>
      <Typography variant={"h2"}>Worship</Typography>
      <Card sx={{ width: 300, my: 3 }}>
        <CardContent>Total Charge: {totalCharge}</CardContent>
      </Card>
      <Stack gap={3} direction="row" flexWrap="wrap">
        {state?.characters?.map(({ worship, name, classIndex }, index) => {
          const worshipProgress = (worship?.currentCharge / (worship?.maxCharge || worship?.currentCharge)) * 100;
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300 }}>
              <CardContent>
                <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt='' />
                <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>{name}</Typography>
                <ProgressBar percent={worshipProgress > 100 ? 100 : worshipProgress} bgColor={"secondary.dark"} />
                <Box my={2}>
                  <Typography>
                    Charge: {worship?.currentCharge} / {worship?.maxCharge}
                  </Typography>
                  <Typography>Charge Rate: {Math.round(worship?.chargeRate * 24)}% / day</Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};

export default Worship;
