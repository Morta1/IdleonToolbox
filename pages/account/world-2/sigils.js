import React, { useContext } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, prefix } from "utility/helpers";
import Tooltip from "components/Tooltip";
import styled from "@emotion/styled";

const Sigils = () => {
  const { state } = useContext(AppContext);

  return (
    <Stack>
      <Typography variant={"h2"} mb={3}>
        Sigils
      </Typography>
      <Stack direction={"row"} flexWrap={"wrap"} gap={2}>
        {state?.account?.alchemy?.sigils?.map((sigil, index) => {
          if (index > 20) return null;
          const { name, progress, effect, unlocked, unlockCost, boostBonus, boostCost, unlockBonus, characters } = sigil;
          return (
            <Tooltip key={`sigil-${index}`} title={characters?.length > 0 ? <SigilTooltip characters={state?.characters} sigilChars={characters} /> : ''}>
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
                    <SigilIcon maxLevel={unlocked === 1} className={"icon"} src={`${prefix}data/aSiga${index}.png`} alt="" />
                    <Typography>{cleanUnderscore(name)}</Typography>
                  </Stack>
                  <Stack mt={2} gap={2}>
                    <Typography>Effect: {cleanUnderscore(effect?.replace(/{/g, unlocked === 1 ? boostBonus : unlockBonus))}</Typography>
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
            </Tooltip>
          );
        })}
      </Stack>
    </Stack>
  );
};

const SigilTooltip = ({ characters, sigilChars }) => {
  return (
    <>
      {sigilChars?.map(({ index }) => {
        return <Typography key={`sigil-char-${index}`}>{characters?.[index]?.name}</Typography>;
      })}
    </>
  );
};

const SigilIcon = styled.img`
  object-fit: contain;
  filter: hue-rotate(${({ maxLevel }) => (maxLevel ? "200deg" : "0deg")});
`;

export default Sigils;
