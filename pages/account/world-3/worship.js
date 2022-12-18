import React, { useContext, useMemo } from "react";
import { Card, CardContent, Typography, Stack } from "@mui/material";
import { AppContext } from "components/common/context/AppProvider";
import ProgressBar from "components/common/ProgressBar";
import { cleanUnderscore, prefix } from "utility/helpers";
import Tooltip from "../../../components/Tooltip";
import Box from "@mui/material/Box";

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
        {state?.characters?.map(({ worship, tools, name, classIndex, skillsInfo }, index) => {
          const worshipProgress = (worship?.currentCharge / (worship?.maxCharge || worship?.currentCharge)) * 100;
          const skull = tools.find(({ name }) => name.includes('Skull'));
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300 }}>
              <CardContent>
                <Stack direction={'row'}>
                  <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=''/>
                  {skull &&<Tooltip title={cleanUnderscore(skull.name)}>
                    <img style={{ height: 38 }} src={`${prefix}data/${skull.rawName}.png`} alt=''/>
                  </Tooltip>}
                </Stack>
                <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>{name}</Typography>
                <Typography variant={'caption'}>Worship
                  lv. {skillsInfo?.worship?.level}</Typography>
                <ProgressBar percent={worshipProgress > 100 ? 100 : worshipProgress} bgColor={"secondary.dark"}/>
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
