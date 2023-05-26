import React, { useEffect, useState } from "react";
import {
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Stack, Tooltip,
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
import DiscordInvite from "../components/DiscordInvite";

/* eslint-disable react/jsx-key */
const patchNotes = [
  {
    ver: "3.1.87",
    gameVer: "1.82",
    date: "26/05/2023",
    features: [
      'Added shiny level alert to the dashboard',
      'Added Random Event (when you haven\'t done an event) alert to the dashboard'
    ],
    fixes: [
      'Fixed a display bug showing the wrong effect at the overflowing ladle tooltip'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.86",
    gameVer: "1.82",
    date: "25/05/2023",
    features: [
      'Added a "Closest trap" timer to dashboard view',
      'Added a "Next printer cycle" timer to dashboard view',
    ],
    fixes: [
      'Fixed cooking speed calc',
      'Fixed shinies time calculations'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.85",
    gameVer: "1.82",
    date: "24/05/2023",
    features: [
      'Added concise character information to dashboard ',
    ],
    fixes: [
      'Some small fixes all over the place :D'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.84",
    gameVer: "1.82",
    date: "23/05/2023",
    features: [
      'Added Import / Export to item planner (importing will override all of your sections)',
      'Added afk gains breakdown (to help debug issues :D)',
      'Added total kitchens speed to cooking page -> kitchens tab',
      'Towers pages renamed to Buildings page'
    ],
    fixes: [
      'Fixed atom calculations in Printer page',
      'Fixed max levels for all buildings'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.83",
    gameVer: "1.82",
    date: "22/05/2023",
    features: [
      'Added Afk Gains value under Characters page -> Stats filter (Might be inaccurate, let me know)'
    ],
    fixes: [
      'WIP: Anvil details under characters page is still kind of broken',
      'Fixed logic for starsigns',
      'Fixed a bug with added levels to talents',
      'Fixed ccd calculations',
      'Fixed cash multi calculations',
      'Fixed printer sample calculations',
      'Fixed a bug with displaying shovel at the dashboard',
      'Fixed a bug with atom calculations'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.82",
    gameVer: "1.82",
    date: "20/05/2023",
    features: [
      'Added data and assets from version 1.82',
      <Typography>Added Random Events predictor to dashboard and <Link
        href={'https://idleontoolbox.com/account/random-events'}>Random Events</Link> page</Typography>,
      <Typography>Added Sailing Trades predictor to dashboard and <Link
        href={'https://idleontoolbox.com/account/world-5/sailing'}>Sailing</Link> page to Trades tab</Typography>,
      'Added cooking speed bonus by voidwalker enhancement',
      'Added Statues multi by voidwalker skill (Voodoo Statusification)'
    ],
    fixes: [
      'Now also check if the printer output is higher than atom threshold (instead of checking storage only)',
      'Now showing the actual boat speed in "Boats And Captain" tab'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.81",
    gameVer: "1.81",
    date: "19/05/2023",
    features: [
      <Typography>Added sailing trades to <Link
        href={'https://idleontoolbox.com/account/world-5/sailing'}>Sailing</Link> page under Trades tab</Typography>
    ],
    fixes: [
      'Fixed boat speed calculation (it was missing the SB talent)'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.80",
    gameVer: "1.81",
    date: "18/05/2023",
    features: [
      "Added 'Totals' section to the printer page, showing atoms generated from printer and total items printed in an hour/day/printer go brrr (let me know if it's inaccurate)",
      'Added shops alerts to the dashboard',
      'Updated logic for showing an alert for refinery'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.79",
    gameVer: "1.81",
    date: "17/05/2023",
    features: [
      'Added Respawn Time value and breakdown under Characters page -> Stats filter',
      'Added a threshold input for alchemy in dashboard options (for liquids capacity)'
    ],
    fixes: [
      'Fixed a bug with sigils not displaying in dashboard',
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.78",
    gameVer: "1.81",
    date: "16/05/2023",
    features: [
      'Added countdown timer for sigils'
    ],
    fixes: [
      'Fixed calculation for atom collider\'s cost calculation',
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.77",
    gameVer: "1.81",
    date: "14/05/2023",
    features: [
      'Added Cash Multi value and breakdown under Characters page -> Stats filter',
      'Added Drop Rate value and breakdown under Characters page -> Stats filter',
      'Added support for No more Praying superbit',
      'Added the correct bonus of golden food in Characters page -> Equipment filter -> Food tab',
      'Added an option for crystal cooldown on dashboard to see non maxed skills'
    ],
    fixes: [
      'Fixed some calculation with obols stats',
      'Fixed a bug with shrine bonus',
      'Now calculating star signs with Infinite stars bonus'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.76",
    gameVer: "1.81",
    date: "11/05/2023",
    features: [],
    fixes: [
      'Fixed card progress calculations and added 5th star bonus to card page',
      'Fixed a bug with bubble required material calculation',
      'Fixed a bug with bubble atom cost calculation'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.75",
    gameVer: "1.81",
    date: "10/05/2023",
    features: [
      'Added a dashboard alert for max capacity liquids in alchemy',
      <Typography>Added liquids progress to the <Link
        href={'https://idleontoolbox.com/account/orld-2/cauldrons'}>cauldrons</Link> page</Typography>,
      'Added 0 to 20 (static) timer to library '
    ],
    fixes: [
      'Fixed Library Checkouts superbit bonus',
      'Fixed shiny pets level up timer'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.74",
    gameVer: "1.81",
    date: "09/05/2023",
    features: [
      'Added timers for egg and shiny levels',
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.73",
    gameVer: "1.81",
    date: "08/05/2023",
    features: [
      'Added Boat Speed value and a timer to "Boats and Captains" tab (Sailing page)',
      'Added shop captains to "Boats and Captains" tab (Sailing page)'
    ],
    fixes: [
      'Fixed meals actual values in Meals and Kitchen tabs',
      'Fixed boat artifact chance',
      'Fixed an issue with statues not showing the correct statue level',
      'Fixed a bug in Skill Mastery with second bonus from Sailing, Gaming and divinity'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.72",
    gameVer: "1.81",
    date: "06/05/2023",
    features: ['Enhanced talents and post office dashboard configuration and changed the design a little bit'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.71",
    gameVer: "1.81",
    date: "05/05/2023",
    features: [<Typography>Added printer sample rate to the <Link
      href={'https://idleontoolbox.com/account/world-3/printer'}>Printer</Link> page</Typography>],
    fixes: ['Fixed a bug with bonuses from equipment'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.70",
    gameVer: "1.81",
    date: "03/05/2023",
    features: ['New Alert in dashboard that will appear when your character can equip a new tier of a tool (pickaxe, hatchet, etc)'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.69",
    gameVer: "1.81",
    date: "01/05/2023",
    features: [<Typography>Added superbit information to <Link
      href={'https://idleontoolbox.com/account/world-5/gaming'}>Gaming</Link> page</Typography>,
      'Added colored bits in gaming page'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.68",
    gameVer: "1.81",
    date: "29/04/2023",
    features: [
      'Added data and assets from version 1.81',
      'Added support for 5* cards',
      <Typography>Added Construct Mastery to <Link
        href={'https://idleontoolbox.com/account/world-4/rift'}>Rift</Link> page (if you've unlocked it)</Typography>,
      'Applied construct bonuses to Refinery page',
      'Applied superbit bonus to cooking',
      'Applied library bonus from superbit',
      'Work in progress: superbits upgrades and their effect on everything'
    ],
    fixes: ['Fixed a bug with library causing the app to crash'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.67",
    gameVer: "1.80b",
    date: "28/04/2023",
    features: ['Added an option to see production alert 1 hour before its being full',
      'Added threshold levels indication for skill mastery'],
    fixes: ['More accurate bargain tag check for dashboard',
      'Ready talents are now showing only when they are available for the character',
      'Fixed a bug with gilded stamp',
      'Library is only showing when world 3 is unlocked (dashboard)'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.66",
    gameVer: "1.80b",
    date: "23/04/2023",
    features: [],
    fixes: ['Alerts are now only showing if you\'ve unlocked the relevant world!',
      <Typography>Added indication for infinite stars on <Link
        href={'https://idleontoolbox.com/account/constellations'}>Constellations</Link> page - star sign
        tab</Typography>,
      'Added shiny bonuses to Refinery and Meals',
      'Updated alerts logic'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.65",
    gameVer: "1.80b",
    date: "22/04/2023",
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-4/rift'}>Rift</Link> page including Tasks, Bonuses and Skill
        Mastery page</Typography>,
      <Typography>Added Pets tab to <Link
        href={'https://idleontoolbox.com/account/world-4/breeding'}>Breeding</Link> page to display information
        about pets including shiny level, passive and gene information</Typography>,
      'Applied rift Vial Mastery bonus to all vials',
      'Applied rift Skill Mastery bonus to the Printer',
      'Added eldritch artifacts support'
    ],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.63",
    gameVer: "1.80",
    date: "20/04/2023",
    features: ['Fixed Apple login'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.62",
    gameVer: "1.80",
    date: "19/04/2023",
    features: ['Added support for Apple login', 'Added data and assets from version 1.80'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.61",
    gameVer: "1.79",
    date: "18/04/2023",
    features: [],
    fixes: ['Fixed a bug with gaming alerts', 'Fixed a bug with refinery'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.60",
    gameVer: "1.79",
    date: "15/04/2023",
    features: [],
    fixes: ['Fixed a bug with Crystal Countdown calculation'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.59",
    gameVer: "1.79",
    date: "14/04/2023",
    features: [],
    fixes: ['Added missing rank up alert for salts in refinery'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.58",
    gameVer: "1.79",
    date: "10/04/2023",
    features: [
      <Typography>Added the ability to create custom builds in <Link
        href={'https://idleontoolbox.com/tools/builds'}>Builds</Link> page</Typography>
    ],
    fixes: [
      'Fixed item planner bug',
      'Fixed a bug with calculating additional talent levels for Elemental Sorcerer (again)'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.57",
    gameVer: "1.79",
    date: "09/04/2023",
    features: ['Added Defence tag to Card Search'],
    fixes: [
      'Fixed material calculations for bubbles',
      'Fixed a bug with calculating additional talent levels for Elemental Sorcerer'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.57",
    gameVer: "1.79",
    date: "05/04/2023",
    features: [
      'Added particle cost for bubbles (displayed when required material is higher than 100M)',
      'Added indication of how many particle upgrade left to bubble page',
      'Added Giant Mob Spawn Chance card to the dashboard (near library timer)',
    ],
    fixes: [
      'Fixed a bug on Item Planner when selecting \'Show Missing Items\'',
      'Updated required material for bubble to be capped at 1000M (1B)'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.56",
    gameVer: "1.79",
    date: "04/04/2023",
    features: [
      <Typography>Updated some logic and display for <Link
        href={'https://idleontoolbox.com/account/slab'}>Slab</Link> page</Typography>
    ],
    fixes: ['Fixed a bug with guild data when importing from steam-extractor'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.55",
    gameVer: "1.79",
    date: "03/04/2023",
    features: [
      'Added an ability to search by description in Item Browser',
      'Added guild tasks alert to dashboard',
      'Added crystal cooldown alert to dashboard (when reaching max reduction)',
      'Added extra bubbles to \'No Bubble Left Behind\' from W4 merit shop',
      <Typography>Updated logic for <Link href={'https://idleontoolbox.com/tools/item-planner'}>Item
        Planner</Link> page!</Typography>,
      'Added names to sections and made them collapsable',
      'Enabled Item Planner and Item Browser to logged out users as well'
    ],
    fixes: [
      'Fix bug with max traps in dashboard',
      'Fixed a bug with \'Show Missing Item\' in Item Planner'
    ],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.54",
    gameVer: "1.79",
    date: "01/04/2023",
    features: ['Added data and assets from version 1.79'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.53",
    gameVer: "1.78c",
    date: "28/03/2023",
    features: [],
    fixes: ['Fixed a bug where Traps option in also turned off Obols option in dashboard setting',
      'Updated logic for max traps with CALL ME ASH bubble now working globally'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.52",
    gameVer: "1.78c",
    date: "28/03/2023",
    features: ['Added gaming dashboard alerts (Max sprouts and sprinkler drops, squirrel and shovel alerts if you haven\'t clicked for over an hour)',
      'Added sprouts and sprinkler drops indication to gaming page'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.51",
    gameVer: "1.78c",
    date: "27/03/2023",
    features: ['Added data and assets from version 1.78c',
      'Added indication for stamps that you can upgrade based on your stored materials and money'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.50",
    gameVer: "1.78.0",
    date: "25/03/2023",
    features: ['Added data and assets from version 1.78',
      'Added \'Sort By\' filter for meals (for next level ,lv. 11 and lv. 30)'],
    fixes: ['Fixed the email and password login flow (didn\'t notice it wasn\'t working correctly)'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.49",
    gameVer: "1.77.0",
    date: "24/03/2023",
    features: ['Added \'Sort By\' filter for meals (for next level ,lv. 11 and lv. 30)'],
    fixes: ['Fixed library speed calculation'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.48",
    gameVer: "1.77.0",
    date: "22/03/2023",
    features: ['Added library timer to dashboard'],
    fixes: ['Updated logic for post office dashboard notification (doesn\'t show up when maxed all boxes)'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.47",
    gameVer: "1.77.0",
    date: "21/03/2023",
    features: [<Typography><Link
      href={'https://idleontoolbox.com/dashboard'}>Dashboard</Link> page!</Typography>,
      <Typography>Added a tooltip for boss keys + colo tickets on <Link
        href={'https://idleontoolbox.com/account/general'}>General</Link> page</Typography>,
      <Typography>Added Stamp Reducer indication on <Link
        href={'https://idleontoolbox.com/account/world-3/atom-collider'}>Atom Collider</Link> page</Typography>,
      'Added Subtract Green Stacks option for vials in dashboard (this will subtract 10M from your current amount to make sure you will still have green stack after upgrading)',
      'Added a tooltip for exact quantity for items in storage'],
    fixes: ['Fixed wizard towers max level (from atom collider)', 'Some bug fixes for low level accounts',
      'Added missing W5 catching and chopping targets (ops)', 'Fixed a bug on Vials page'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.46",
    gameVer: "1.77.0",
    date: "18/03/2023",
    features: [],
    fixes: ['Update looty (hopefully it is more accurate)', 'Update W5 quest header (visual update)',
      'Updated atoms description with the correct "Total Bonus"',
      'Fixed cooking speed to account for "Fluoride - Void Plate Chef" atom'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.45",
    gameVer: "1.77.0",
    date: "17/03/2023",
    features: [],
    fixes: ['Added Elemental Sorcerer family bonus to talent levels'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.44",
    gameVer: "1.77.0",
    date: "15/03/2023",
    features: ['Added extra printer slots', 'Added calculation for \'Polytheism\' talent of Elemental Sorcerer'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.43",
    gameVer: "1.77.0",
    date: "04/03/2023",
    features: ['Updated the website with 1.77.0 data and assets'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.42",
    gameVer: "1.76.0",
    date: "24/02/2023",
    features: ['Updated the website with 1.76.0 data and assets', 'Added new constellations'],
    fixes: ['Carry bags order'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.41",
    gameVer: "1.75.1",
    date: "10/02/2023",
    features: ['Added materials per hour for refinery page'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.40",
    gameVer: "1.75.1",
    date: "10/02/2023",
    features: ['Updated the website with 1.75.1 data and assets'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.39",
    gameVer: "1.75",
    date: "10/02/2023",
    features: ['Updated the website with 1.75 data and assets'],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.38",
    gameVer: "1.74",
    date: "09/02/2023",
    features: [],
    fixes: ['minor issue with captain exp requirement'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.37",
    gameVer: "1.74",
    date: "31/01/2023",
    features: ['Update the website with 1.74 data and assets',
      'Added "King of the remembrance" calculation to printer'],
    fixes: ['Shrine bonus is now calculated correctly (hopefully)',
      'Added extra levels from symbol talents and bear god',
      'Fixed family bonuses to account for The Family Guy talent'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.36",
    gameVer: "1.73",
    date: "23/01/2023",
    features: [],
    fixes: ['Fixed atom collider bug when freshly opened'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.35",
    gameVer: "1.73",
    date: "11/01/2023",
    features: ['Added images and data from version 1.73'],
    fixes: ['Fixed sigil bonuses'],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.34",
    gameVer: "1.72",
    date: "11/01/2023",
    features: ['Added images and data from version 1.72', <Typography>Added <Link
      href={'https://idleontoolbox.com/account/world-3/atom-collider'}>Atom Collider</Link> page</Typography>],
    fixes: [],
    deprecatedFeatures: []
  },
  {
    ver: "3.1.33",
    gameVer: "1.71",
    date: "06/01/2023",
    features: ['Added library checkouts counter with breakpoints for 16, 18, 20 on Account -> General page (let me know if the timers are off)',
      'Added percentage completed of the boat trip to the island'],
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

  useEffect(() => {
    try {
      if (typeof window === 'object') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
    }
  }, []);

  const handleCopyITRaw = async () => {
    try {
      await navigator.clipboard.writeText(localStorage.getItem("rawJson"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      const data = JSON.parse(localStorage.getItem("rawJson"));
      await navigator.clipboard.writeText(JSON.stringify(data?.data));
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
        {/* <Typography color='#b7b7b7' variant="caption" component='span'>(while logged in)</Typography>
        </Stack> */}
        <a style={{ display: "flex", alignItems: "center" }} href="https://ko-fi.com/S6S7BHLQ4" target="_blank"
           rel="noreferrer">
          <img height="36" style={{ border: 0, height: 36, width: "100%", objectFit: "contain" }}
               src="https://cdn.ko-fi.com/cdn/kofi1.png?v=3" alt="Buy Me a Coffee at ko-fi.com"/>
        </a>
      </Stack>
      <Stack direction={fullScreen ? "column" : "row"} alignItems="flex-start" flexWrap={"wrap"} justifyContent="center"
             gap={2}>
        <Button variant={"outlined"} startIcon={<FileCopyIcon/>} onClick={handleCopyITRaw}>
          Copy IdleonToolbox JSON
        </Button>
        <Button variant={"outlined"} startIcon={<FileCopyIcon/>} onClick={handleCopyRaw}>
          Copy Raw JSON
        </Button>
      </Stack>
      <Stack direction={fullScreen ? "column" : "row"} alignItems="flex-start" flexWrap={"wrap"} justifyContent="center"
             spacing={2} style={{ margin: "35px 0" }}>
        <Button variant={"outlined"} onClick={() => setOpenPastebin(true)} startIcon={<InfoIcon/>}>
          How to share your profile with pastebin
        </Button>
      </Stack>
      <Stack direction={fullScreen ? "column" : "row"} alignItems="flex-start" flexWrap={"wrap"} justifyContent="center"
             spacing={2} style={{ margin: "35px 0" }}>
        <Tooltip title={'Reset your dashboard and bubble goals preferences'}>
          <Button color={'warning'} variant={"outlined"} onClick={() => localStorage.clear()} startIcon={<InfoIcon/>}>
            Clear local storage
          </Button>
        </Tooltip>
      </Stack>
      <DiscordInvite/>
      <Stack>
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
      </Stack>
      <Stack>
        <ins className="adsbygoogle"
             style={{ display: 'inline-block', height: 90 }}
             data-ad-client="ca-pub-1842647313167572"
             data-ad-slot="7203005854"
        />
      </Stack>
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
