import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "utility/helpers";
import styled from "@emotion/styled";
import { PlayersList } from "../../../components/common/styles";
import { isArtifactAcquired } from "../../../parsers/sailing";

const Sigils = () => {
  const { state } = useContext(AppContext);
  const { alchemy, sailing } = state?.account || {};
  const chilledYarnArtifact = isArtifactAcquired(sailing?.artifacts, 'Chilled_Yarn');

  return (
    <Stack>
      <Typography variant={"h2"} mb={3}>
        Sigils
      </Typography>
      <Stack direction={"row"} flexWrap={"wrap"} gap={2}>
        {alchemy?.p2w?.sigils?.map((sigil, index) => {
          if (index > 24) return null;
          const {
            name,
            progress,
            effect,
            unlocked,
            unlockCost,
            boostCost,
            bonus,
            characters
          } = sigil;

          return (
            <Card
              sx={{
                border: characters?.length > 0 ? "2px solid lightblue" : "",
                opacity: unlocked === -1 ? 0.5 : 1,
                width: { xs: 160, md: 250 }
              }}
              key={`${name}-${index}`}
            >
              <CardContent>
                <Stack gap={1} direction={"row"} alignItems={"center"}>
                  <SigilIcon maxLevel={unlocked === 1} className={"icon"} src={`${prefix}data/aSiga${index}.png`}
                             alt=""/>
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <PlayersList players={characters} characters={state?.characters}/>

                  </Stack>
                </Stack>
                <Stack mt={2} gap={2}>
                  <Typography
                    sx={{ color: chilledYarnArtifact ? 'info.light' : '' }}>Effect: {cleanUnderscore(effect?.replace(/{/g, bonus))}</Typography>
                  {progress < boostCost ? (
                    <Typography>
                      Progress: {notateNumber(progress, "Small")}/{unlocked === 0 ? notateNumber(boostCost, "Small") : notateNumber(unlockCost, "Small")}
                    </Typography>
                  ) : (
                    <Typography color={"success.main"}>MAXED</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

const SigilIcon = styled.img`
  object-fit: contain;
  filter: hue-rotate(${({ maxLevel }) => (maxLevel ? "200deg" : "0deg")});
`;

export default Sigils;
