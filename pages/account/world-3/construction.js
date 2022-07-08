import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { cleanUnderscore, kFormatter, prefix } from "utility/helpers";
import { AppContext } from "components/common/context/AppProvider";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";
import Button from "@mui/material/Button";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import InfoIcon from "@mui/icons-material/Info";
import Link from "@mui/material/Link";

const bonusTextSx = {
  fontSize: 12,
  fontWeight: 400,
  position: "absolute",
  top: 0,
  left: 0,
  backgroundColor: "black"
};

const Construction = () => {
  const { state } = useContext(AppContext);
  const [view, setView] = useState("build");

  const handleCopy = async (data) => {
    try {
      await navigator.clipboard.writeText(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Typography variant={"h2"} textAlign={"center"} mb={3}>
        Construction
      </Typography>
      <Stack alignItems={"center"}>
        <ToggleButtonGroup value={view} exclusive onChange={(e, value) => (value?.length ? setView(value) : null)}>
          <ToggleButton value="build">Build</ToggleButton>
          <ToggleButton value="exp">Exp</ToggleButton>
          <ToggleButton value="flaggy">Flaggy</ToggleButton>
          <ToggleButton value="classExp">Class Exp</ToggleButton>
        </ToggleButtonGroup>
        <Stack my={1}>
          <Stack my={1} gap={1} direction={"row"} alignItems={"center"} justifyContent={"center"}>
            <Typography variant={"h6"} textAlign={"center"}>
              Cogstruction{" "}
            </Typography>
            <Tooltip
              followCursor={false}
              title={
                <>
                  You can export your data and use it in{" "}
                  <Link target={"_blank"} underline={"always"} color={"info.dark"} href="https://github.com/automorphis/Cogstruction" rel="noreferrer">
                    Cogstruction
                  </Link>
                </>
              }
            >
              <InfoIcon />
            </Tooltip>
          </Stack>
          <Stack direction={"row"} gap={2}>
            <Button variant={"contained"} color={"primary"} sx={{ textTransform: "unset" }} onClick={() => handleCopy(state?.account?.construction?.cogstruction?.cogData)} startIcon={<FileCopyIcon />}>
              Cogstruction Data
            </Button>
            <Button variant={"contained"} color={"primary"} sx={{ textTransform: "unset" }} onClick={() => handleCopy(state?.account?.construction?.cogstruction?.empties)} startIcon={<FileCopyIcon />}>
              Cogstruction Empties
            </Button>
          </Stack>
        </Stack>
        <Box
          mt={3}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(8, minmax(43px, 1fr))", md: "repeat(12, minmax(43px, 1fr))" }
          }}
        >
          {state?.account?.construction?.board?.map((slot, index) => {
            const { currentAmount, requiredAmount, flagPlaced, cog } = slot;
            const filled = (currentAmount / requiredAmount) * 100;
            const rest = 100 - filled;
            return (
              <Box key={index}>
                <Tooltip title={<CogTooltip {...slot} character={cog?.name?.includes("Player") ? cog?.name?.split("_")[1] : ""} />}>
                  <SlotBackground filled={filled} rest={rest}>
                    {flagPlaced ? <FlagIcon src={`${prefix}data/CogFLflag.png`} alt="" /> : null}
                    {cog?.name && !flagPlaced ? <SlotIcon src={`${prefix}data/${cog?.name?.includes("Player") ? "headBIG" : cog?.name}.png`} alt="" /> : null}
                    {view === "build" && !flagPlaced ? <Typography sx={bonusTextSx}>{kFormatter(cog?.stats?.a?.value) ?? null}</Typography> : null}
                    {view === "exp" && !flagPlaced ? <Typography sx={bonusTextSx}>{kFormatter(cog?.stats?.b?.value) ?? kFormatter(cog?.stats?.d?.value) ?? null}</Typography> : null}
                    {view === "flaggy" && !flagPlaced ? <Typography sx={bonusTextSx}>{kFormatter(cog?.stats?.c?.value) ?? null}</Typography> : null}
                    {view === "classExp" && !flagPlaced ? <Typography sx={bonusTextSx}>{kFormatter(cog?.stats?.j?.value) ?? null}</Typography> : null}
                  </SlotBackground>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </>
  );
};

const CogTooltip = ({ character, currentAmount, requiredAmount, cog }) => {
  return (
    <>
      {character ? <Typography sx={{ fontWeight: "bold" }}>{character}</Typography> : null}
      {currentAmount < requiredAmount ? (
        <Typography>
          {kFormatter(currentAmount, 2)} / {kFormatter(requiredAmount, 2)} ({kFormatter((currentAmount / requiredAmount) * 100, 2)}%)
        </Typography>
      ) : null}
      {Object.values(cog?.stats)?.map(({ name, value }, index) =>
        name ? (
          <div key={`${name}-${index}`}>
            {kFormatter(value, 2)}
            {cleanUnderscore(name)}
          </div>
        ) : null
      )}
    </>
  );
};

const SlotBackground = styled.div`
  position: relative;
  background-image: url(${() => `${prefix}data/CogSq0.png`});
  background-repeat: no-repeat;
  width: 43px;

  &:before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    ${({ filled }) => (filled === 0 || filled === 100 ? "" : `background: linear-gradient(to top, #9de060 ${filled}%, transparent 0%);`)}

    width: 44px;
    height: 41px;
    top: 1px;
    left: -1px;
  }
`;

const FlagIcon = styled.img`
  width: 43px;
  height: 42px;
`;

const SlotIcon = styled.img`
  width: 43px;
  height: 42px;
`;

export default Construction;
