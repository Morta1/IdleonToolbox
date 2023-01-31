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
    ver: "3.1.37",
    gameVer: "1.74",
    date: "31/01/2022",
    features: ['Update the website with 1.74 data and assets', 'Added "King of the remembrance" calculation to printer'],
    fixes: ['Shrine bonus is now calculated correctly (hopefully)', 'Added extra levels from symbol talents and bear god', 'Fixed family bonuses to account for The Family Guy talent'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.36",
    gameVer: "1.73",
    date: "23/01/2022",
    features: [],
    fixes: ['Fixed atom collider bug when freshly opened'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.35",
    gameVer: "1.73",
    date: "11/01/2022",
    features: ['Added images and data from version 1.73'],
    fixes: ['Fixed sigil bonuses'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.34",
    gameVer: "1.72",
    date: "11/01/2022",
    features: ['Added images and data from version 1.72', <Typography>Added <Link
      href={'https://idleontoolbox.com/account/world-3/atom-collider'}>Atom Collider</Link> page</Typography>],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.33",
    gameVer: "1.71",
    date: "06/01/2022",
    features: ['Added library checkouts counter with breakpoints for 16, 18, 20 on Account -> General page (let me know if the timers are off)', 'Added percentage completed of the boat trip to the island'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.32",
    gameVer: "1.71",
    date: "31/12/2022",
    features: [],
    fixes: ['Fixed a bug where accounts without world 5 data would crash'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.31",
    gameVer: "1.71",
    date: "30/12/2022",
    features: ['Added max possible nugget roll possible', 'Added the required resources for a boat upgrade'],
    fixes: ['Fixed a bug with islands names in sailing'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.30",
    gameVer: "1.71",
    date: "29/12/2022",
    features: ['Added chests, boats and captains display', 'Added crystal chance breakdown',
      'Added divinity style to the activity filter when character is afk in divinity'],
    fixes: ['Added indication for lab by linking Goharut as a god'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.29",
    gameVer: "1.71",
    date: "28/12/2022",
    features: ['Added timer for acorns in gaming page'],
    fixes: ['Fixed gaming upgrades bonus and cost'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.28",
    gameVer: "1.71",
    date: "27/12/2022",
    features: ['Added a timer for dirty shovel (+ nuggets break points)',
      'Applied most artifacts bonuses all over the website',
      'Added tooltip over printer items showing the boosted value from lab,artifacts,gods',
      'Divinity - now correctly showing unlocked gods'],
    fixes: ['Sigils not calculated with artifacts bonus'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.27",
    gameVer: "1.70",
    date: "26/12/2022",
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/sailing'}>Sailing</Link> page</Typography>,
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/divinity'}>Divinity</Link> page</Typography>,
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/gaming'}>Gaming</Link> page</Typography>
    ],
    fixes: ['Added refinery speed stamp to refinery calculations', 'Fixed minor bug with un-acquired stamps'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.26",
    gameVer: "1.70",
    date: "23/12/2022",
    features: [],
    fixes: ['Added missing meals (from world 5)', 'Added basic logic for deities to activate lab'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.25",
    gameVer: "1.70",
    date: "22/12/2022",
    features: [],
    fixes: ['Added world 5 quests npc', 'Added world 5 vials', 'Added world 5 cards', 'Added world 5 death note',
      'Added world 5 bubbles'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.24",
    gameVer: "1.70",
    date: "20/12/2022",
    features: [],
    fixes: ['Fixed small calculation error in max worship'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.23",
    gameVer: "1.70",
    date: "19/12/2022",
    features: ['Added data and assets for world 5!'],
    fixes: ['Fixed timer in "Stats" filter to count up instead of down (please let me know if there are any issue with timers)'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.22",
    gameVer: "1.60",
    date: "21/11/2022",
    features: [],
    fixes: ['Fixed small calculation error in cooking page', 'Added missing Demon Genie icon',
      'Added exp per hour to exp calculator'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.21",
    gameVer: "1.60",
    date: "11/10/2022",
    features: [],
    fixes: ['Fixed total mat printed fixed'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.20",
    gameVer: "1.60",
    date: "09/10/2022",
    features: ['Added boop to zow/chow view', 'Added total material printed to Account -> General'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.19",
    gameVer: "1.60",
    date: "15/09/2022",
    features: ['Added additional information to anvil, worship and trap pages'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.18",
    gameVer: "1.60",
    date: "09/08/2022",
    features: ['Added an option to hide capped meals', 'Added progress indicator for cards',
      'Cards you haven\'t found will appear with low opacity'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.17",
    gameVer: "1.60",
    date: "30/07/2022",
    features: [],
    fixes: ['Fixed AFK time in stats', 'Fixed obols ordering'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.16",
    gameVer: "1.60",
    date: "12/07/2022",
    features: ['Updated data to patch 1.60'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.15",
    gameVer: "1.59",
    date: "08/07/2022",
    features: ['Added number of ladles needed for level up in meals page'],
    fixes: ['Fixed meal speed calculations', 'Fixed overflowing ladle calculations'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.14",
    gameVer: "1.59",
    date: "08/07/2022",
    features: [<Typography>Added total critters calculations to <Link
      href={'https://idleontoolbox.com/account/world-3/traps'}>Traps</Link> page</Typography>],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.13",
    gameVer: "1.59",
    date: "08/07/2022",
    features: ['Added an option to login with email and password (I\'m still not saving anything anywhere so don\'t worry)'],
    fixes: ['Fixed a bug in traps page caused when there\'s no trap box equipped'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.12",
    gameVer: "1.59",
    date: "05/07/2022",
    features: [<Typography>Added sections to the <Link
      href={'https://idleontoolbox.com/tools/item-planner'}>item planner</Link> page that allows you to track several
      items separately</Typography>,
      'Updated the website data with 1.59 patch'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.11",
    gameVer: "1.58",
    date: "02/07/2022",
    features: [],
    fixes: ['Cogstruction: fix for empties cog array'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.10",
    gameVer: "1.58",
    date: "28/06/2022",
    features: [<Typography>Added trap type, quantity and exp (by hovering the trap) to the <Link
      href={'https://idleontoolbox.com/account/world-3/traps'}>Traps</Link> page</Typography>],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.8",
    gameVer: "1.58",
    date: "14/06/2022",
    features: ['Added meal speed contribution view'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.7",
    gameVer: "1.58",
    date: "01/06/2022",
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-2/cauldrons'}>Cauldrons</Link> page to view all cauldrons and
        cauldrons upgrades from p2w tab</Typography>
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.6",
    gameVer: "1.58",
    date: "30/05/2022",
    features: ['Updated to version 1.58'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.5",
    gameVer: "1.57",
    date: "26/05/2022",
    features: [
      <Typography>Added builds from idleon companion under Tools and can be accessed like this <Link
        href={'https://idleontoolbox.com/tools/builds?b=barbarian&c=1'}>https://idleontoolbox.com/tools/builds?b=barbarian&c=1</Link> (The
        new classes are still missing builds, let me know if you want to add some)</Typography>,
      <Typography>Added forge upgrades tab to the <Link
        href={'https://idleontoolbox.com/account/world-1/forge'}>Forge</Link> page</Typography>,
      <Typography>Added claims counter for spices under to the <Link
        href={'https://idleontoolbox.com/account/world-4/cooking'}>Cooking</Link> page</Typography>,

    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.4",
    gameVer: "1.57",
    date: "26/05/2022",
    features: ['Added coin cost to max calculation for anvil', 'Small refinery visual bug fix'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.3",
    gameVer: "1.57",
    date: "24/05/2022",
    features: ['Added an option to apply Overflowing ladle (Blood Berserker talent) to meals'],
    fixes: [],
    deprecatedFeatures: []
  },
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
    features: ["Reworked the website - the website is now responsive and can be used in mobile as well!",
      "WIP: builds (from idleon companion)"],
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
