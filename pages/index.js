import React, { useState } from "react";
import {
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
  useMediaQuery
} from "@mui/material";
import styled from "@emotion/styled";
import Button from "@mui/material/Button";
import InfoIcon from "@mui/icons-material/Info";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import Instructions from "components/common/Instructions";
import { useTheme } from "@emotion/react";
import PastebinInstructions from "components/common/PastebinInstructions";

const patchNotes = [
  {
    ver: "3.1.2",
    gameVer: "1.57",
    date: "24/05/2022",
    features: ['Apocalypses page under Account tab'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.1",
    gameVer: "1.57",
    date: "24/05/2022",
    features: [],
    fixes: ['Hopefully fixed lab calculations'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.0",
    gameVer: "1.57",
    date: "23/05/2022",
    features: [
      'Updated all data to version 1.57',
      '(Things might still be inaccurate, I\'m still updating the formulas to account for all the new stuff)',
      'Added a light version of a "Public Profile" using pastebin to import your data, instructions can be found on the button above (let me know if you experience any kind of problems in any type of connection)'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.10",
    gameVer: "1.56.1",
    date: "22/05/2022",
    features: [],
    fixes: [
      'Fixed a bug with dungeons happy hour timer counting up',
      'Fixed a bug with cogstruction data export'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.9",
    gameVer: "1.56.1",
    date: "21/05/2022",
    features: [],
    fixes: [
      'Fixed sorting meals logic',
      'Fixed meals cost calculations'],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.8",
    gameVer: "1.56.1",
    date: "21/05/2022",
    features: [
      'Added towers page under Account -> World 3'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.7",
    gameVer: "1.56.1",
    date: "20/05/2022",
    features: [
      '(Re-)Added the item browser which lets you find an item anywhere in your account'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.6",
    gameVer: "1.56.1",
    date: "20/05/2022",
    features: [
      'Added \'chance not to consume food\' percentage in \'Stats\' filter'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.5",
    gameVer: "1.56.1",
    date: "19/05/2022",
    features: [],
    fixes: [
      'Added doubling bonus chips to the calculations of cards and star signs',
      'Fixed a small bug with displaying cards'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.4",
    gameVer: "1.56.1",
    date: "19/05/2022",
    features: [
      "Added minigame and library currency to Account -> General",
      "Small visual update for dungeons"
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.3",
    gameVer: "1.56.1",
    date: "19/05/2022",
    features: ["Quick and dirty storage page"],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.2",
    gameVer: "1.56.1",
    date: "18/05/2022",
    features: [],
    fixes: ["Re-added points distribution in anvil details"],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.1",
    gameVer: "1.56.1",
    date: "18/05/2022",
    features: [],
    fixes: ["Fixed a visual bug in construction page", "Fixed calculation of anvil details"],
    deprecatedFeatures: []
  },
  {
    ver: "3.0.0",
    gameVer: "1.56.1",
    date: "12/05/2022",
    features: ["Reworked the website - the website is now responsive and can be used in mobile as well!", "WIP: builds (from idleon companion)"],
    fixes: [],
    deprecatedFeatures: []
  }
];
const Home = () => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const [openPastebin, setOpenPastebin] = useState(false);

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(localStorage.getItem("rawJson"));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container>
      <Typography style={{ textAlign: "center" }} variant={"h1"}>
        Idleon Toolbox
      </Typography>
      <Typography style={{ textAlign: "center" }} variant={"body1"}>
        Idleon toolbox helps you track all of your account and characters&apos; progress with ease!
      </Typography>
      <Typography style={{ textAlign: "center" }} variant={"body2"}>
        For any question, suggestion or bug report, please contact me in discord <span
        style={{ fontWeight: "bold" }}>Morojo#2331</span> or open an issue on <Link
        href="https://github.com/Morta1/IdleonToolbox/issues">github</Link>
      </Typography>
      <Stack direction={fullScreen ? "column" : "row"} alignItems="flex-start" flexWrap={"wrap"} justifyContent="center"
             spacing={2} style={{ margin: "35px 0" }}>
        <Button variant={"outlined"} onClick={() => setOpen(true)} startIcon={<InfoIcon/>}>
          Learn how to connect
        </Button>
        {/* <Stack> */}
        <Button variant={"outlined"} startIcon={<FileCopyIcon/>} onClick={handleCopyRaw}>
          Copy Raw JSON
        </Button>
        {/* <Typography color='#b7b7b7' variant="caption" component='span'>(while logged in)</Typography>
        </Stack> */}
        <a style={{ display: "flex", alignItems: "center" }} href="https://ko-fi.com/S6S7BHLQ4" target="_blank"
           rel="noreferrer">
          <img height="36" style={{ border: 0, height: 36, width: "100%", objectFit: "contain" }}
               src="https://cdn.ko-fi.com/cdn/kofi1.png?v=3" alt="Buy Me a Coffee at ko-fi.com"/>
        </a>
      </Stack>
      <Stack direction={fullScreen ? "column" : "row"} alignItems="flex-start" flexWrap={"wrap"} justifyContent="center"
             spacing={2} style={{ margin: "35px 0" }}>
        <Button variant={"outlined"} onClick={() => setOpenPastebin(true)} startIcon={<InfoIcon/>}>
          How to share your profile with pastebin
        </Button>
      </Stack>
      {patchNotes.map(({ ver, gameVer, date, features, fixes, deprecatedFeatures }, index) => {
        return (
          <React.Fragment key={`${ver}-${date}-${index}`}>
            <Grid container spacing={2} style={{ marginTop: 50 }}>
              <Grid item xs={12} sm={3}/>
              <Grid item xs={12} sm={4}>
                <Typography variant={"h4"}>v{ver}</Typography>
                {gameVer ? <Typography variant={"subtitle1"}>Game ver {gameVer}</Typography> : null}
                <Typography variant={"subtitle2"}>{date}</Typography>
              </Grid>
              <Grid item xs={12} sm={5}>
                <StyledSection icon={"green"} topMargin={false} title={"New features"} list={features}/>
                <StyledSection icon={"purple"} title={"Fixes"} list={fixes}/>
                <StyledSection icon={"red"} title={"Deprecated features"} list={deprecatedFeatures}/>
              </Grid>
            </Grid>
            <Divider style={{ margin: "3em 0" }}/>
          </React.Fragment>
        );
      })}
      <Dialog open={openPastebin} onClose={() => setOpenPastebin(false)}>
        <DialogTitle>Pastebin</DialogTitle>
        <DialogContent>
          <PastebinInstructions/>
        </DialogContent>
      </Dialog>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Instructions</DialogTitle>
        <DialogContent>
          <Instructions/>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

const svgs = {
  purple: (
    <svg style={{ flexShrink: 0, fill: "rgb(158 140 247)", width: 24, height: 24 }} viewBox="0 0 24 24"
         aria-hidden="true">
      <circle cx="12" cy="12" r="12" opacity="0.2"/>
      <path
        d="M9.5,17a1,1,0,0,1-.707-.293l-3-3a1,1,0,0,1,1.414-1.414L9.5,14.586l7.293-7.293a1,1,0,1,1,1.414,1.414l-8,8A1,1,0,0,1,9.5,17Z"/>
    </svg>
  ),
  green: (
    <svg style={{ flexShrink: 0, fill: "hsl(120, 50%, 69%)", width: 24, height: 24 }} viewBox="0 0 24 24"
         aria-hidden="true">
      <circle cx="12" cy="12" r="12" opacity="0.2"/>
      <path d="M17,11H13V7a1,1,0,0,0-2,0v4H7a1,1,0,0,0,0,2h4v4a1,1,0,0,0,2,0V13h4a1,1,0,0,0,0-2Z"/>
    </svg>
  ),
  red: (
    <svg style={{ flexShrink: 0, fill: "hsl(342, 89%, 62%)", width: 24, height: 24 }}
         className="list__icon icon color-error" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" opacity="0.2"/>
      <path d="M12,15a1,1,0,0,1-1-1V6a1,1,0,0,1,2,0v8A1,1,0,0,1,12,15Z"/>
      <circle cx="12" cy="18" r="1"/>
    </svg>
  )
};

const StyledSection = ({ title, list, icon, topMargin = true }) => {
  if (!list || list.length === 0) return null;
  return (
    <div style={{ marginTop: topMargin ? 20 : 0 }}>
      <Typography variant={"h4"}>{title}</Typography>
      <Stack spacing={2} style={{ marginTop: 20 }}>
        {list.map((item, index) => {
          return (
            <StyledRow key={`${title}-${index}`}>
              {svgs?.[icon]}
              <Typography variant={"body1"} component={"div"}>
                {item}
              </Typography>
            </StyledRow>
          );
        })}
      </Stack>
    </div>
  );
};

const StyledRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export default Home;
