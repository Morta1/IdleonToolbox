import { Link, Typography } from '@mui/material';
import React from 'react';

/* eslint-disable react/jsx-key */
export const patchNotes = [
  {
    'ver': '3.3.10',
    'gameVer': '2.0.43',
    'date': '28/09/2025',
    'features': [
      'Updated the website with version 2.0.43 data and assets',
    ],
    'fixes': []
  },
  {
    'ver': '3.3.10',
    'gameVer': '2.0.41',
    'date': '28/09/2025',
    'features': [
      'Added a class-specific "Wrong Items" alert to notify when class-specific form items are used outside their form.',
      'Added a class-specific "Better Weapon" alert to notify when a better form-specific weapon is available in the inventory.',
      'Added navigation links on chests in the storage page to open their corresponding wiki page.',
      'Added time estimation for resource costs in the upgrade optimizer pages, based on resources per hour.',
      'Added an indicator on character cards in the dashboard to show whether they are currently in a form (Wraith, Tempest, or Arcanist).',
    ],
    'fixes': []
  },
  {
    'ver': '3.3.9',
    'gameVer': '2.0.41',
    'date': '19/08/2025',
    'features': [
      'Bubbles page visual update',
    ],
    'fixes': []
  },
  {
    'ver': '3.3.8',
    'gameVer': '2.0.41',
    'date': '11/07/2025',
    'features': [
      'Added summoning stones',
      'Added missing classes for builds page',
    ],
    'fixes': [
      'Fixed "only affordable skills" in optimizers page',
      'Fixed bits breakdown with missing items',

    ]
  },
  {
    'ver': '3.3.7',
    'gameVer': '2.0.41',
    'date': '06/07/2025',
    'features': [
      'Updated the website with version 2.0.41 data and assets'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.6',
    'gameVer': '2.0.40',
    'date': '24/06/2025',
    'features': [
      'Updated the website with version 2.0.40 data and assets',
      'Added tesseract page under Account -> Class Specific -> Tesseract',
      'Added total tesseract upgrades, total tachyons leaderboards',
      'Applied tesseract bonuses across the website'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.5',
    'gameVer': '2.0.38',
    'date': '20/06/2025',
    'features': [
      'Added statistics page for various game mechanics'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.4',
    'gameVer': '2.0.37',
    'date': '31/05/2025',
    'features': [
      'Updated the website with version 2.0.37 data and assets',
      'Added Armor Smithy page under Account -> World 3',
      'Added Emperor page under Account -> World 6'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.3',
    'gameVer': '2.0.36',
    'date': '10/05/2025',
    'features': [
      'Added initial calculation for class exp multi (might still not be 100% accurate)',
      'All sampling setups in Sampling Companion are now ready to use (Afk Fighting, Chopping, Mining, Catching, Fishing, Trapping Eff)'
    ],
    'fixes': [
      'Fixed shrine bonus calculation and display',
      'Hiding empty section after a search in Compass -> Upgrades',
      'Fixed sigil speed calculations',
      'Fixed opal chance in bravery cavern',
      'Fixed extra dust calculation in compass page',
      'Fixed Pets alerts in the dashboard',
      'Fixed farming alerts in dashboard'
    ]
  },
  {
    'ver': '3.3.2',
    'gameVer': '2.0.36',
    'date': '30/04/2025',
    'features': [
      'Updated the website with version 2.0.36 data and assets'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.1',
    'gameVer': '2.0.36',
    'date': '27/04/2025',
    'features': [
      'Default display for ASC -> Drops is X / hr (total amount will be found in the tooltip)',
      'Added a new experimental page - Sampling Companion - which helps you track BIS items for a specific sampling setup (currently only AFK Fighting) - let me know what you think'
    ],
    'fixes': []
  },
  {
    'ver': '3.3.0',
    'gameVer': '2.0.36',
    'date': '26/04/2025',
    'features': [
      'Added "Sort by type" option in Compass -> Upgrades',
      'Added "Hide future abominations" to hide abominations images in Compass -> Abominations',
      'Added "Show drops" to see which monster drops tempest bow/ring in Compass -> Medallions',
      'Updated the medallions list to be accurate as I\'m aware'
    ],
    'fixes': [
      'Fixed a bug with contributing exp to shrine'
    ]
  },
  {
    'ver': '3.3.0',
    'gameVer': '2.0.36',
    'date': '25/04/2025',
    'features': [
      'Updated the website with version 2.0.36 data and assets',
      'Added Compass page under Account -> Misc containing Upgrades, abominations, portals and medallions',
      'Added exalted stamps indication + bonus'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.99',
    'gameVer': '2.0.35',
    'date': '19/04/2025',
    'features': [
      'Add NBLB indicator in stamps page',
      'Added "sort by time" option for study page',
      'Added breakdown for rupie value, crop evolution, bell exp rate, villager exp (separated to Base / Additive / Multiplicative sections)'
    ],
    'fixes': [
      'Small ui update for leaderboards',
      'Changed the order of tabs in Pets  page (Showing Shinies tab first)',
      'Fixed foraging speed ',
      'Fixed a bug where Land Rank was showing even if it is locked'
    ]
  },
  {
    'ver': '3.2.98',
    'gameVer': '2.0.35',
    'date': '11/04/2025',
    'features': [
      'Revamped the breeding → pets page to include breedability',
      'Added breedability level alerts to the dashboard',
      'Added jars alerts to the dashboard',
      'Updated the companions page to display companions by category',
      'Added a tasks unlock page',
      'Added the ability to see exact cog values on the construction page',
      'Added a den score leaderboard',
      'Added "cost to max" on non-maxed items'
    ],
    'fixes': [
      'Fixed tome score calculations',
      'Fixed the missing Axolotl image',
      'Fixed the "weapon power" display for trapping and summoning',
      'Fixed missing values for owl upgrades',
      'Fixed a bug with calculating shiny progress in ASC',
      'Fixed the missing value for the Seraph Cosmos star sign',
      'Fixed villagers breakdown values',
      'Fixed post office total points calculations'
    ]
  },
  {
    'ver': '3.2.97',
    'gameVer': '2.0.35',
    'date': '01/04/2025',
    'features': [
      'Updated the website with version 2.0.35 data and assets',
      'Added event-shop page under account -> misc',
      'Leaderboards - you\'re now able to search your account\'s rank even if you\'re not top 10 (or top 250!)',
      'Added bean trade alert to the dashboard',
      'Fixed display of white and dark rupies',
      'Fixed villagers per hour calculation',
      'Fixed gambit points calculation',
      'Fixed printer companion calculation',
      'Fixed small bug in refinery calculation',
      'Fixed bravery damage',
      'Fixed endless bonuses',
      'Fixed bug with timers in atom colliders'
    ],
    'fixes': [
      'Updated drop rate calculation with the new companion, monument, measurement bonuses',
      'Fixed vote ballot multi bonus'
    ]
  },
  {
    'ver': '3.2.96',
    'gameVer': '2.0.34',
    'date': '22/03/2025',
    'features': [
      'Updated the website with version 2.0.34 data and assets',
      'Added wisdom content page and timer to dashboard',
      'Added an alert when villager is ready to be leveled up',
      'Added equinox fill rate breakdown to equinox page'
    ],
    'fixes': [
      'Updated drop rate calculation with the new companion, monument, measurement bonuses',
      'Fixed vote ballot multi bonus'
    ]
  },
  {
    'ver': '3.2.95',
    'gameVer': '2.0.32',
    'date': '21/03/2025',
    'features': [
      'Added filtering to stamps page',
      'Added slab bonuses to slab page',
      'Added total levels to summoning upgrades page',
      'Added kills per hour / day to ASC'
    ],
    'fixes': [
      'Fixed equinox fill rate calculation',
      'Fixed indication of missing artifacts in artifacts page'
    ]
  },
  {
    'ver': '3.2.94',
    'gameVer': '2.0.32',
    'date': '16/03/2025',
    'features': [
      'Updated the website with version 2.0.32 data',
      'Added Gambit page and applied gambit bonuses across the website',
      'Added summoners doublers indication in summoning upgrades page'
    ],
    'fixes': [
      'Fixed equinox rate calc',
      'Fixed villager exp per hour calc'
    ]
  },
  {
    'ver': '3.2.93',
    'gameVer': '2.0.31',
    'date': '14/03/2025',
    'features': [
      'Added steam login 🚀',
      'Updated the website with version 2.0.31 data',
      'Added The Jars, Evertree, Wisdom*, Gambit* and The Temple pages',
      'Added the new companions'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.92',
    'gameVer': '2.0.30',
    'date': '08/03/2025',
    'features': [
      'Renamed "Active Drop Calculator" to "Active Stuff Calculator" as it now tracks coins, kills, exp, cards, shiny progress (for BM) and drops!'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.91',
    'gameVer': '2.0.30',
    'date': '06/03/2025',
    'features': [
      'Added active drop calculator',
      'You can now exclude copper, oak, spore cap, fly and goldfish from the printer atom alerts',
      'Added an alert for dna splicer tool (based on level req)'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.91',
    'gameVer': '2.0.30',
    'date': '04/03/2025',
    'features': [
      'Search – You can now search for tabs inside pages as well!',
      'Added an alert for ready-to-upgrade meals.',
      'Added a level threshold input to the Bubbles page.',
      'Added a free companion claim alert.',
      'Increased the number of endless fights you can view to 200 (up from 100).',
      'Changed the unspent anvil points alert to use a threshold instead of a simple checkbox.'
    ],
    'fixes': [
      'Fixed the "skilling card" alert so it no longer appears on Death Bringer when the Wrath skill is active.',
      'Fixed the Equinox timer tooltip.'
    ]
  },
  {
    'ver': '3.2.90',
    'gameVer': '2.0.30',
    'date': '24/02/2025',
    'features': [`Updated the website with version 2.0.30`],
    'fixes': [
      'Fixed cash multi calculation (missing multikill as its super hard to calculate)'
    ]
  },
  {
    'ver': '3.2.89',
    'gameVer': '2.0.29',
    'date': '18/02/2025',
    'features': [],
    'fixes': [
      'Fixed cash multi calculation + breakdown',
      'Fixed slab bonuses calculations',
      'Fixed Roo and Owl feather/fish generation rate',
      'Fixed Sailing speed'
    ]
  },
  {
    'ver': '3.2.88',
    'gameVer': '2.0.29',
    'date': '08/02/2025',
    'features': [`Updated the website with version 2.0.29 data, assets + new vault upgrade bonuses`],
    'fixes': []
  },
  {
    'ver': '3.2.87',
    'gameVer': '2.0.27',
    'date': '08/02/2025',
    'features': [`Added a workaround for steam login (click "Login" -> "Steam Workaround")`],
    'fixes': ['Drop rate calculations']
  },
  {
    'ver': '3.2.86',
    'gameVer': '2.0.27',
    'date': '04/02/2025',
    'features': ['Updated the website with version 2.0.27 data, assets and upgrade vault page'],
    'fixes': []
  },
  {
    'ver': '3.2.86',
    'gameVer': '2.0.26',
    'date': '23/01/2025',
    'features': [
      'Added "wow" apocalypse to apocalypses pages',
      'Added grimoire page',
      'Implemented (hopefully) all grimore bonuses across the site',
      'Added 100 and 110 breakpoints to meals order',
      'Added an option to stamps alert to only show gilded stamp when stamp reducer is 0'
    ],
    'fixes': [
      'Fixed equinox timer in the dashboard page',
      'Fixed star talents order',
      'Fixed a bug where pocket divinity wasn\'t taken into account for talent added levels'
    ]
  },
  {
    'ver': '3.2.85',
    'gameVer': '2.0.26',
    'date': '19/01/2025',
    'features': [
      'Updated the website with version 2.0.26 data and assets'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.84',
    'gameVer': '2.0.25',
    'date': '16/12/2024',
    'features': [
      'Updated the website with version 2.0.25 data and assets'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.83',
    'gameVer': '2.0.22',
    'date': '28/11/2024',
    'features': [
      'Added a time to full tooltip to calculate time to full for X buckets',
      'Added tome total points leader and (re-)added slab leaderboard'
    ],
    'fixes': [
      'Fix an issue with import dashboard settings',
      'Fixed an issue with missing images' +
      ' on Summoning -> Battles page',
      'Fixed a calculation error for summoning bonuses'
    ]
  },
  {
    'ver': '3.2.82',
    'gameVer': '2.0.22',
    'date': '24/11/2024',
    'features': ['Added the ability to pin your favorite pages for easy and quick navigation'],
    'fixes': [
      'Fixed farming total crop calculation',
      'Fixed shiny multi rate calculation',
      'Fixed chip rotation calculation',
      'Fixed dragon statue enhancing itself'
    ]
  },
  {
    'ver': '3.2.81',
    'gameVer': '2.0.22',
    'date': '21/11/2024',
    'features': [
      'Updated the website with version 2.0.22 data',
      'Added missing "max points" for majiks bonuses',
      'Added missing bravery bonuses',
      'Added talent tab name in talents display'
    ],
    'fixes': [
      'Fixed the well motherlode and the hive alert to be displayed correctly',
      'Fixed anvil exp and speed calculations',
      'Fixed Paying Respect being treated as skilling',
      'Fixed a bug with calculating material cost in the old stamps page',
      'Fixed dragon statue calculations',
      'Fixed Time To Full calculation in The Well',
      'Fixed Vote multiplier calculation'
    ]
  },
  {
    'ver': '3.2.80',
    'gameVer': '2.0.21',
    'date': '15/11/2024',
    'features': [
      'Added hole page under Account -> world 5 with all villagers and their content',
      'Added relevant alerts to the dashboard',
      'Added winner bonuses from endless summoning update'
    ],
    'fixes': []
  },
  {
    'ver': '3.2.79',
    'gameVer': '2.0.13',
    'date': '24/10/2024',
    'features': [
      'The Apocalypse page will now save your last displayed characters.',
      'Player inventory in Sneaking page will now show item levels above 99.',
      'Characters\' talents will now be highlighted in red when their max level isn\'t maxed by the library.'
    ],
    'fixes': [
      'Fixed a bug where card search didn\'t include set bonuses in the search.',
      'Fixed a visual bug with the Fisheroo timer.',
      'Fixed a visual bug in the gem shop page showing the wrong gem price.',
      'Fixed a visual bug in the Kill Roy permanent upgrades tab.'
    ]
  },
  {
    ver: '3.2.78',
    gameVer: '2.0.13',
    date: '14/09/2024',
    features: ['Added killroy\'s upgrades and moved killroy page to world 2'],
    fixes: []
  },
  {
    ver: '3.2.77',
    gameVer: '2.0.13',
    date: '04/09/2024',
    features: [
      'Added green stacks leaderboard under General',
      'Added some more description to the login dialog to hopefully prevent repeated questions',
      'Fixed a bug where meals appeared on a different order.',
      'Fixed calculations for bean trade in farming page'
    ],
    fixes: []
  },
  {
    ver: '3.2.76',
    gameVer: '2.0.13',
    date: '30/07/2024',
    features: ['Updated the website with version 2.0.13 data and assets', 'Added vote ballot page'],
    fixes: []
  },
  {
    ver: '3.2.75',
    gameVer: '2.0.12',
    date: '08/07/2024',
    features: ['Added ranks to farming page'],
    fixes: []
  },
  {
    ver: '3.2.74',
    gameVer: '2.0.11',
    date: '23/06/2024',
    features: ['Added timers tab to the dashboard configurations - you can now customize your timers view!'],
    fixes: [
      'Fixed a bug in tome death note and equinox clouds calculations',
      'Fixed a bug in logbooks counters',
      'Fixed a bug in fish per hour calculation'
    ]
  },
  {
    ver: '3.2.73',
    gameVer: '2.0.11',
    date: '22/06/2024',
    features: [
      'Updated the website with version 2.0.11 data and assets',
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-2/kangaroo'}>poopy kangaroo</Link> page under Account - World
        2</Typography>,
      'Added 3 kangaroo alerts to the dashboard: shiny % threshold, fisheroo reset, greatest catch'
    ],
    fixes: []
  },
  {
    ver: '3.2.72',
    gameVer: '2.0.10',
    date: '06/06/2024',
    features: [
      'Added a threshold filter to the bubbles page',
      'Added a "unobtainable" filter to the slab page + removed un-obtainable dungeon items',
      'Added feather restart and mega feather restart timers to the dashboard'
    ],
    fixes: [
      'Fixed owl alerts',
      'Fixed farming market displayed values'
    ]
  },
  {
    ver: '3.2.72',
    gameVer: '2.0.10',
    date: '06/06/2024',
    features: [
      'Updated the website with version 2.0.10 data and assets',
      'Added owl page under world 1 (bonuses aren\'t applied across the site yet)'
    ],
    fixes: []
  },
  {
    ver: '3.2.71',
    gameVer: '2.0.9',
    date: '06/06/2024',
    features: [
      'Added a dashboard alert for unclaimed jewels / chips (if you have enough resource to buy them)'
    ],
    fixes: [
      'Fixed the calculation for the jewel and chip rotations',
      'Fixed a bug with calculating max cost of buildings',
      'Fixed breeding foraging costs calculation',
      'Fixed a bug with world 2 alert (vials attempts)'
    ]
  },
  {
    ver: '3.2.70',
    gameVer: '2.0.9',
    date: '28/05/2024',
    features: [
      'Added "no meal left behind" to meals tab under cooking',
      'Added shimmer island alert for unclaimed reward',
      'Added a "last looted" alert to sneaking to get alerted when you haven\'t looted for X minutes',
      'Added the class names you need to do killroy with for the killroy alert',
      'Added tome ranking to the tome page',
      'Added god rank, jade coins, white essence, highest crop og leaderboards (will take effect immediately)',
      'Added total green mushroom kills, total boats leaderboard (will take effect after you upload your profile again)'
    ],
    fixes: [
      'Fixed a bug with calculating account level in leaderboard'
    ]
  },
  {
    ver: '3.2.69',
    gameVer: '2.0.9',
    date: '26/05/2024',
    features: [
      'Updated the website with version 2.0.9 data and assets',
      'Added Battles tab to the summoning page including the army health and damage'
    ],
    fixes: [
      'Fixed some bugs with alerts'
    ]
  },
  {
    ver: '3.2.68',
    gameVer: '2.0.8',
    date: '25/05/2024',
    features: [
      'Updated the dashboard\'s layout: alerts are now organized by worlds / general. Rows will disappear when there are no longer alerts to show in them',
      'Added bubble breakdown in bubble page',
      'Added import / export button inside "Configure alerts" dialog',
      'Vial attempts will now show only if you have the materials available'
    ],
    fixes: []
  },
  {
    ver: '3.2.67',
    gameVer: '2.0.8',
    date: '23/05/2024',
    features: [
      'Added gemstones to sneaking page',
      'Added max cost for buildings page',
      'Added poing mini game score and multi to gaming page under Imports tab',
      'Added an alert for acquiring gems from killing bosses'
    ],
    fixes: [
      'Fixed calculation for number of bubbles from NBLB',
      'Fixed drop rate calculations (with small margin of error)'
    ]
  },
  {
    ver: '3.2.66',
    gameVer: '2.0.8',
    date: '16/05/2024',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-4/tome'}>Tome</Link> page under Account - World
        4</Typography>,
      'Added a column to the refinery page to show how much of a a material you own'
    ],
    fixes: ['Fixed breeding foraging speed calculations', 'Fixed a bug where some alerts wouldn\'t turn off']
  },
  {
    ver: '3.2.65',
    gameVer: '2.0.8',
    date: '09/05/2024',
    features: [
      'Updated the website with version 2.0.8 data (this patch might miss some assets)',
      'Added a dashboard alert for total crops',
      'Added a dashboard alert for using the wrong divinity style',
      'Added total crops display under farming -> plot',
      'Added an indication of your max meal level under cooking -> meals',
      'Updated material tracker ui a little bit + updated its alerts in the dashboard',
      'Added an alert for when you have available upgrade slots on your items'
    ],
    fixes: ['Fixed a bug calculating shiny level multi caused by miscalculating star sign']
  },
  {
    ver: '3.2.64',
    gameVer: '2.0.7',
    date: '30/04/2024',
    features: [
      'Updated the website with version 2.0.7 data and assets',
      'Added hoops mini game high score to Account -> General page',
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-4/killroy-prime'}>Killroy Prime</Link> page under Account - World
        4</Typography>
    ],
    fixes: [
      'Fixed sneaking, farming and summoning skill mastery on Rift page'
    ]
  },
  {
    ver: '3.2.63',
    gameVer: '2.0.6',
    date: '27/04/2024',
    features: [
      'Updated the website with version 2.0.6 data and assets',
      'Added world 6 achievements and tasks',
      'Updated world 6 achievement bonuses to all relevant stats',
      'Added a threshold input to the Summoning -> Familiar dashboard alert',
      'Added a "Total Time" stat to the refinery page - to show how long it takes to get from 0% to 100%',
      'Moved Slab page to W5 category',
      'Moved Beanstalk page to W6 category',
      'Removed page titles from all pages as they don\'t add any value and and take up space'
    ],
    fixes: ['Fixed cooking speed']
  },
  {
    ver: '3.2.62',
    gameVer: '2.0.5',
    date: '25/04/2024',
    features: ['Added a dashboard alert for Familiar bonus from summoning'],
    fixes: ['Fixed a bug in tasks page', 'Possible fix for cooking speed']
  },
  {
    ver: '3.2.61',
    gameVer: '2.0.5',
    date: '24/04/2024',
    features: [],
    fixes: ['Fixed cooking speed', 'Fixed some ui bugs in dashboard page',
      'Fixed a bug in the calculation of how an unlocked world is determined',
      'Added a small disclaimer to the laboratory page regarding px width bug']
  },
  {
    ver: '3.2.60',
    gameVer: '2.0.5',
    date: '17/03/2024',
    features: ['Added upgrade cost and cost to max for cauldrons',
      'Added the bonus from "Pure Opal Rhombol" jewel to the crop depot'],
    fixes: ['Fixed salts dashboard alert']
  },
  {
    ver: '3.2.59',
    gameVer: '2.0.5',
    date: '11/03/2024',
    features: [''],
    fixes: ['Fixed death note for minibosses', 'Removed the rank for summoning skill from skills under characters page']
  },
  {
    ver: '3.2.58',
    gameVer: '2.0.5',
    date: '04/03/2024',
    features: ['Updated the website with latest patch data and assets', 'Added an alert for plots'],
    fixes: ['']
  },
  {
    ver: '3.2.57',
    gameVer: '2.0.5',
    date: '02/04/2024',
    features: [
      'Updated the website with version 2.0.5 data and assets',
      'Added w3/4/5/6 mini boss counter to the dashboard',
      'Updated talent presets to be "Preset 1" and "Preset 2"',
      'Applying threshold in breeding - pets now shows the time to reach that threshold for leveling pets'],
    fixes: []
  },
  {
    ver: '3.2.56',
    gameVer: '2.0.4',
    date: '28/03/2024',
    features: [
      'Added available vial attempts dashboard alert',
      'Added the 3rd tier of sigil',
      'Added checkbox to apocalypse page to hide super chows'
    ],
    fixes: ['Added the new captain image to dashboard alerts']
  },
  {
    ver: '3.2.55',
    gameVer: '2.0.4',
    date: '25/03/2024',
    features: ['Added mini bosses to death note page'],
    fixes: ['Added missing "next requirement" for beans in "Market" tab under farming page',
      'Fixed sigil speed calculations', 'Added missing spirited valley title in quest page']
  },
  {
    ver: '3.2.54',
    gameVer: '2.0.4',
    date: '24/03/2024',
    features: ['Updated the website with version 2.0.4 data and assets'],
    fixes: ['Some fixes']
  },
  {
    ver: '3.2.53',
    gameVer: '2.0.3',
    date: '09/03/2024',
    features: ['Updated the website with version 2.0.3 data and assets',
      'Added talents and cards preset view in Characters page'],
    fixes: []
  },
  {
    ver: '3.2.52',
    gameVer: '2.0.2',
    date: '24/02/2024',
    features: [],
    fixes: [
      'Fixed meal speed calculation',
      'Fixed lab connection bug',
      'Fixed a bug where shrines didn\'t show affected players',
      'Fixed Jade Emporium prices',
      'Fixed statue bonus calculations',
      'Fixed a bug where talent additional levels were added to a level 0 talents'
    ]
  },
  {
    ver: '3.2.51',
    gameVer: '2.0.2',
    date: '02/03/2024',
    features: [
      'Updated the website with version 2.0.2 data and assets',
      'Initial support for summoning skill page including essences, upgrades and winner bonuses',
      'Added beanstalk page under Account -> Misc',
      'Updated bribes',
      'Updated artifacts',
      'Added a timer in farming page to countdown to next cycle'
    ],
    fixes: [
      'Fixed star sign / constellation page'
    ]
  },
  {
    ver: '3.2.50',
    gameVer: '2.0.1',
    date: '27/02/2024',
    features: [
      'Initial support for farming skill page including plot data, market and crop depot and crop',
      'Added MSA Totalizer bonuses to worship page (World 3 -> Worship)',
      'Updated some calculations with farming bonuses',
      'Added the missing data for the last tower defence totem in worship page',
      'Updated infinite stars logic to only apply bonuses that are unlocked'
    ],
    fixes: [
      'Fixed missing images',
      'Fixed sneaking floor to start from 1 instead of 0',
      'Fixed a bug where the last hatchet didn\'t appear in dashboard alerts'
    ]
  },
  {
    ver: '3.2.49',
    gameVer: '2.0.1',
    date: '24/02/2024',
    features: [
      'Updated the website with version 2.0.1 data and assets'
    ],
    fixes: []
  },
  {
    ver: '3.2.48',
    gameVer: '2',
    date: '23/02/2024',
    features: [
      'Initial support for sneaking skill page including inventory, jade emporium, ninja upgrades and charms',
      'Added missing monster images',
      'Added w6 to quests page'
    ],
    fixes: [
      'Fixed a bug with territory tab in breeding page'
    ]
  },
  {
    ver: '3.2.47',
    gameVer: '2',
    date: '18/02/2024',
    features: [
      'Initial support for version 2.0 (world 6) with data and assets'
    ],
    fixes: []
  },
  {
    ver: '3.2.46',
    gameVer: '1.92',
    date: '24/01/2024',
    features: [
      'Added talents "Added levels" value and breakdown to talents under characters page',
      'Added dashboard alerts for using the wrong card set while fighting / skilling'
    ],
    fixes: [
      'Fixed refinery calculation (was missing arcade shop bonus)',
      'Fixed bubbles page to be grid aligned',
      'Build cost filter in Account -> Buildings page now shows the correct order'
    ]
  },
  {
    ver: '3.2.45',
    gameVer: '1.92',
    date: '26/01/2024',
    features: [
      'Added Character tab to leaderboards page with the following leaderboards: Drop rate, Defence, Accuracy, Hp, Mp',
      'Added Log Book and Total Shiny Levels leaderboards to General Tab',
      'Bubbles page now show all bubbles on the same page as 4 columns similar to how they are displayed in-game (old bubbles page also exists)',
      'Added collect rate for critter quantity and exp',
      'Added the ability to see the totals of collected exp and traps ',
      'Added a display for liquids cauldron\'s Cap and Rate on cauldrons  page',
      'Gilded stamp bonus can now be switched on/off on both new and old stamps page',
      'Added an indication for unobtainable stamps on the stamp page (you can see this by hovering the stamp)',
      'Added a tiny progress bar below statues and shrines',
      'Added a breakdown tooltip to the library in dashboard page.\n'
    ],
    fixes: [
      'Fixed a bug on divinity page where bits weren\'t showing correctly',
      'Removed weird items from items list on tools pages (NULL, BLANK)'
    ]
  },
  {
    ver: '3.2.44',
    gameVer: '1.92',
    date: '23/01/2024',
    features: [
      'Added the old stamps page',
      'Added missing calculation for traps critters and exp',
      'Added the ability to edit materials on the material tracker page',
      'Added the note from material tracker to the dashboard alert regarding material tracker items'
    ],
    fixes: [
      'Grammar'
    ]
  },
  {
    ver: '3.2.43',
    gameVer: '1.92',
    date: '20/01/2024',
    features: [
      'Added distance and minimum travel time distance (+ breakdown) to the boats page',
      'Added superbit costs to the superbits page'
    ],
    fixes: [
      'Fixed a bug with food lust not updating data is updated on meals page'
    ]
  },
  {
    ver: '3.2.42',
    gameVer: '1.92',
    date: '19/01/2024',
    features: [
      'Added loot and speed breakpoints to boats page',
      'Added an indication for items that are acquired from dungeons (in material tracker, slab page, etc..)',
      'Added breakdown to capacity bags under characters page (filter bags and hover over the bag to see it)',
      'Added color to the missing ingredient in stamps page'
    ],
    fixes: [
      'Fixed a bug with dashboard resetting to default',
      'Fixed a bug with charge rate calculation',
      'Fixed a bug where 0 money wouldn\'t display anything'
    ]
  },
  {
    ver: '3.2.41',
    gameVer: '1.92',
    date: '13/01/2024',
    features: [
      'Added afk gains description for cooking'
    ],
    fixes: [
      'Fixed afk gains for fighting'
    ]
  },
  {
    ver: '3.2.40',
    gameVer: '1.92',
    date: '12/01/2024',
    features: [
      'Updated stamps page (might be a bit buggy)',
      'Updated the Active Exp Calculator to be able to calculate a selected level',
      'Added an alert for maximum capacity for sailing chests to the dashboard',
      'Added missing items to material tracker',
      'Added enemies to the Territories tab',
      'Added distinction between the various types of Exp in the quests page'
    ],
    fixes: [
      'Fixed alerts for refinery salts',
      'Fixed card search stars calculations'
    ]
  },
  {
    ver: '3.2.39',
    gameVer: '1.92',
    date: '06/01/2024',
    features: [
      'Added an option to material tracker in dashboard settings to apply threshold either from above or below',
      'Added an option to the character dashboard settings to always see talents regardless of their cooldown',
      'Added an estimated trash per day to the islands page',
      'Added the following leaderboards: Bit, Total Cards, Total Vials, Colosseum and Minigames, Fractal hours, Dungeon credits and Flurbos, Afk time',
      'Made RNG items display in dungeons page more concise'
    ],
    fixes: [
      'Fixed a bug with displaying crystal countdown progress while skill isn\'t specced',
      'Fixed weekly bosses dashboard alert not disappearing when unchecked',
      'Grammar :)'
    ]
  },
  {
    ver: '3.2.38',
    gameVer: '1.92',
    date: '04/01/2024',
    features: [
      'Added an option to search a player in the leaderboards',
      'Added card set information on the cards page',
      'Added eggs alert to the dashboard',
      'Added an option to copy weekly bosses data to clipboard',
      'Added penpals highscore to Account -> General page',
      'Updated the website\'s tab title in the browser to show the page name first (e.g. "Dungeons | Idleon Toolbox")'
    ],
    fixes: [
      'Fixed a bug in calculating foraging speed in breeding page',
      'Fixed a visual bugs in gaming page',
      'Fixed the issue with crushing pages (hopefully)'
    ]
  },
  {
    ver: '3.2.37',
    gameVer: '1.92',
    date: '30/12/2023',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-4/breeding'}>Territory</Link> tab to the breeding
        page</Typography>,
      'Added a toggle to Pets tabs in breeding page to group pets by worlds / stats',
      'Added an option to see the whole raw json data in the data page'
    ],
    fixes: [
      'Fixed log book',
      'Fixed a bug in guaranteed drop calculator page',
      'Fixed drop rate calculations',
      'Fixed consistency of "Maxed" display across the site (and grammar :))'
    ]
  },
  {
    ver: '3.2.36',
    gameVer: '1.92',
    date: '29/12/2023',
    features: [
      <Typography><Link
        href={'https://idleontoolbox.com/account/misc/weekly-bosses'}>weekly bosses</Link> page is now much more
        detailed</Typography>,
      <Typography>Added <Link
        href={'https://idleontoolbox.com/tools/guaranteed-drop-calculator'}>guaranteed drop
        calculator</Link> page</Typography>,
      'Added log book to gaming page',
      'Added condense view to bubbles page'
    ],
    fixes: []
  },
  {
    ver: '3.2.35',
    gameVer: '1.92',
    date: '26/12/2023',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/misc/weekly-bosses'}>weekly bosses</Link> page and added them to the
        dashboard as well</Typography>
    ],
    fixes: []
  },
  {
    ver: '3.2.34',
    gameVer: '1.92',
    date: '24/12/2023',
    features: [
      'Added condensed view for the stamps page',
      'Added an alert for when a character has unspent anvil points'
    ],
    fixes: []
  },
  {
    ver: '3.2.33',
    gameVer: '1.92',
    date: '24/12/2023',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/leaderboards'}>leaderboards</Link> page</Typography>,
      'To participate in the leaderboards, please upload your profile with leaderboard consent.'
    ],
    fixes: [
      'Fixed small bug with player bubbles'
    ]
  },
  {
    ver: '3.2.32',
    gameVer: '1.92',
    date: '22/12/2023',
    features: [
      'Added unselected dungeon trait alert to the dashboard',
      'Added an alert to notify when a character equips \'Blunder hill\' and is at a level greater than 50.'
    ],
    fixes: [
      'Fixed texts across to site to be more consistent'
    ]
  },
  {
    ver: '3.2.31',
    gameVer: '1.92',
    date: '21/12/2023',
    features: [
      <Typography>Enhanced the <Link
        href={'https://idleontoolbox.com/account/misc/dungeons'}>dungeons</Link> page - added rng items and stat boosts</Typography>,
      <Typography>Added group by option to the <Link
        href={'https://idleontoolbox.com/account/misc/storage'}>storage</Link> page</Typography>,
      <Typography>Added exp per trap + total exp per character to <Link
        href={'https://idleontoolbox.com/account/world-3/traps'}>traps</Link> page</Typography>
    ],
    fixes: [
      'Fixed a bug in cooking page where recipe kitchens were calculated as cooking meals'
    ]
  },
  {
    ver: '3.2.30',
    gameVer: '1.92',
    date: '20/12/2023',
    features: [
      'Added the option to select multiple items to the material tracker page',
      'Added a material tracker alert to the dashboard under Etc -> Material tracker (in case you don\'t see the error, clear the dashboard config in data page)'
    ],
    fixes: [
      'Fixed a bug with dashboard characters\' afk time not showing "Active" when it should'
    ]
  },
  {
    ver: '3.2.29',
    gameVer: '1.92',
    date: '19/12/2023',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/tools/material-tracker'}>material tracker</Link> page - Add a material, set
        your own threshold and keep track of your inventory.</Typography>
    ],
    fixes: []
  },
  {
    ver: '3.2.28',
    gameVer: '1.92',
    date: '16/12/2023',
    features: [
      'Added mutation tab to Gaming page including DNA and mutation cost',
      'Added refinery speed breakdown to refinery page',
      'Added the ability to see all challenges in Equinox page',
      'Added killroy and weekly boss (daily) alerts to dashboard'
    ],
    fixes: [
      'Fixed some calculations in stamps page'
    ]
  },
  {
    ver: '3.2.27',
    gameVer: '1.92',
    date: '12/12/2023',
    features: [
      <Typography>Added the ability to upload and share your profile under <Link
        href={'https://idleontoolbox.com/data'}>data</Link> page</Typography>,
      'Removed pastebin support'
    ],
    fixes: [
      'Fixed the calculation of jewel and chips rotations'
    ]
  },
  {
    ver: '3.2.26',
    gameVer: '1.92',
    date: '06/12/2023',
    features: [
      'Account -> Guild page now support tracking of 3 days (let me know if the behavior is not as expected)',
      'Characters -> Talents now showing all skills\' level and max level',
      'Added sigil speed to sigils page',
      'Account -> Stamps show the chance for a gilded stamp'
    ],
    fixes: [
      'Fixed the calculation of jewel and chips rotations'
    ]
  },
  {
    ver: '3.2.25',
    gameVer: '1.92',
    date: '30/11/2023',
    features: [
      'Added cost calculations to divinity page',
      'Added the ability to see zow/chow for all characters with a filter',
      'In character page, added the ability to hide all maxed post office boxes',
      'In character page, added a Chips filter'
    ],
    fixes: []
  },
  {
    ver: '3.2.25',
    gameVer: '1.92',
    date: '28/11/2023',
    features: [
      'Added more information to shrines tooltip (affecting characters, exp/hr)'
    ],
    fixes: []
  },
  {
    ver: '3.2.25',
    gameVer: '1.92',
    date: '23/11/2023',
    features: [
      'Added an option to optimize the construction board by "Player xp rate" - this is highly experimental and might not work as expected so use at your own risk',
      'Added cog stat calculator to construction page',
      'Added "Plants picked" stat to the totals list in general page'
    ],
    fixes: [
      'Fixed a bug with construction exp calculations',
      'Fixed class icons on active exp calc'
    ]
  },
  {
    ver: '3.2.24',
    gameVer: '1.92',
    date: '13/11/2023',
    features: [
      'Added a checkbox to show/hide the cost of the next level of salts in refinery page'
    ],
    fixes: [
      'Fixed a bug with worship alerts for individual characters',
      'Fixed sprouts growth speed calculation',
      'Fixed stamp reducer tooltip display'
    ]
  },
  {
    ver: '3.2.23',
    gameVer: '1.92',
    date: '11/11/2023',
    features: [
      'Added the ability to set a threshold for stamp reducer in dashboard alert',
      'Added BobJoePickle to the World 2 shop options for the daily purchases',
      'Added a feature to indicate the printer sample rate exceeding 90%.',
      'Added the ability to highlight bubbles that are above the configured efficiency threshold in the bubbles page',
      'Added more information to the Gaming -> General page, including: # of envelopes, snail level, encouragement, success and reset rates and more',
      'Added tasks and merits pages under the account page + dashboard alerts for tasks',
      'Added cost to next level and cost to max for atoms in atom collider page',
      'Added a timer for counting down until the forge is emptied.',
      'Added a display for the material cost of the next rank of all salts',
      'Added gem shop page under account page with some priority options',
      'Added more collapsable sections to the account page to make the navigation bar more concise'
    ],
    fixes: [
      'Fixed a bug where optimizing construction board was taking locked slots into account',
      'Fixed a bug with the atom collider atoms max level',
      'Fixed some bugs that popped up from the latest update'
    ]
  },
  {
    ver: '3.2.22',
    gameVer: '1.92',
    date: '08/11/2023',
    features: [
      'Added a prototype for optimizing construction board (under construction tab) - use at your own risk :)'
    ],
    fixes: []
  },
  {
    ver: '3.2.22',
    gameVer: '1.92',
    date: '06/11/2023',
    features: [
      'Added totems tab in the worship page to calculate Exp and Souls from each totem'
    ],
    fixes: []
  },
  {
    ver: '3.2.21',
    gameVer: '1.92',
    date: '03/11/2023',
    features: [],
    fixes: [
      'Fixed construction calculations'
    ]
  },
  {
    ver: '3.2.20',
    gameVer: '1.92',
    date: '29/10/2023',
    features: [
      'Added a tooltip to the dungeon page "Next happy hour" to show the actual date and time',
      'Added breeding multipliers and chance for breeding page'
    ],
    fixes: [
      'Fixed a bug where shrines placed on World 1 town weren\'t showing up on the website',
      'Fixed drop rate formula',
      'Fixed a display bug where star talents were displayed incorrectly.',
      'Fixed sailing speed calculation',
      'Fixed a bug with statue calculating statue bonus for onyx statue'
    ]
  },
  {
    ver: '3.2.19',
    gameVer: '1.92',
    date: '25/10/2023',
    features: [],
    fixes: [
      'Updated the display of the equipment view in Characters page to represent the actual equipment slots',
      'Fixed a small typing issue with meals sorting',
      'Fixed a bug with calculating 10 Ad Tablet bonus',
      'Added a tooltip to indicate quest status in Quests page'
    ]
  },
  {
    ver: '3.2.18',
    gameVer: '1.92',
    date: '24/10/2023',
    features: ['Updated the website with version 1.92 data and assets'],
    fixes: [
      'Fixed a problem with the max level of equinox',
      'Fixed alerts for equinox'
    ]
  },
  {
    ver: '3.2.17',
    gameVer: '1.91',
    date: '20/10/2023',
    features: [
      'Updated the website with version 1.91 data and assets',
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-3/equinox'}>Equinox</Link> page under world 3</Typography>],
    fixes: []
  },
  {
    ver: '3.2.16',
    gameVer: '1.90',
    date: '04/10/2023',
    features: ['Added an option to export guild data to json format'],
    fixes: []
  },
  {
    ver: '3.2.15',
    gameVer: '1.90',
    date: '02/10/2023',
    features: ['Added an option to view rank 1 skills for across all characters',
      'Hiding ranks for sailing and gaming'],
    fixes: []
  },
  {
    ver: '3.2.14',
    gameVer: '1.90',
    date: '16/09/2023',
    features: [],
    fixes: ['Updated the website with version 1.90 data and assets']
  },
  {
    ver: '3.2.13',
    gameVer: '1.89',
    date: '14/09/2023',
    features: [],
    fixes: ['Fixed logic for calculating buildings max level']
  },
  {
    ver: '3.2.12',
    gameVer: '1.89',
    date: '10/09/2023',
    features: [],
    fixes: ['Fixed calculation for meal speed from super chows']
  },
  {
    ver: '3.2.11',
    gameVer: '1.89',
    date: '26/08/2023',
    features: [],
    fixes: ['Added missing npcs to quests page', 'Fixed a bug with statue calculations']
  },
  {
    ver: '3.2.10',
    gameVer: '1.89',
    date: '23/08/2023',
    features: [],
    fixes: ['Fixed zow and chow logic']
  },
  {
    ver: '3.2.9',
    gameVer: '1.89',
    date: '22/08/2023',
    features: [
      'Updated the website with latest version\'s data and assets',
      'Added world 4 new npcs',
      'Added onyx display and calculations'
    ],
    fixes: []
  },
  {
    ver: '3.2.8',
    gameVer: '1.89',
    date: '09/08/2023',
    features: [
      'Updated the website with version 1.89 data and assets'
    ],
    fixes: []
  },
  {
    ver: '3.2.7',
    gameVer: '1.88',
    date: '09/08/2023',
    features: [
      'Added a timer for atom collider upgrades'
    ],
    fixes: [
      'Fixed a bug with captain comparison in dashboard'
    ]
  },
  {
    ver: '3.2.6',
    gameVer: '1.88',
    date: '09/08/2023',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-2/islands'}>Islands</Link> page under world 2</Typography>,
      'Added total stats line to the stats filter under character page'
    ],
    fixes: [
      'Added (the missing) Omar Da Ogar npc to quests page'
    ]
  },
  {
    ver: '3.2.5',
    gameVer: '1.88',
    date: '04/08/2023',
    features: [
      'Updated the website with version 1.88 data and assets'
    ],
    fixes: []
  },
  {
    ver: '3.2.4',
    gameVer: '1.87',
    date: '04/08/2023',
    features: [
      'Added Blood Berserker and Beast Master builds'
    ],
    fixes: [
      'Better performance for guilds leaderboard',
      'Fixed minor god bonus',
      'Fixed equipped bubble calculation',
      'Fixed calculation for afk gains formula',
      'Fixed captain comparison logic and enhanced the display for it',
      'Fixed a bug with displaying anvil related dashboard alerts'
    ]
  },
  {
    ver: '3.2.3',
    gameVer: '1.87',
    date: '31/07/2023',
    features: [
      <Typography>Added 2 guild related pages, <Link
        href={'https://idleontoolbox.com/account/guild'}>Guild</Link> page and <Link
        href={'https://idleontoolbox.com/guilds'}>Guilds</Link> page</Typography>
    ],
    fixes: [
      'Fixed a bug with lab line width calculations',
      'Fixed a bug with personal guild gp calculations',
      'Fixed a bug with guild bonus calculations',
      'Updated the guild leaderboard to be top 100'
    ]
  },
  {
    ver: '3.2.2',
    gameVer: '1.87',
    date: '20/07/2023',
    features: [
      'Added data and assets from version 1.87'
    ],
    fixes: []
  },
  {
    ver: '3.2.1',
    gameVer: '1.86',
    date: '14/07/2023',
    features: [
      <Typography>Added chips and jewels rotations to <Link
        href={'https://idleontoolbox.com/account/world-4/laboratory'}>Laboratory</Link> page with the ability to filter
        specific jewels / chips </Typography>,
      'Added submitted builds for Blood berserker, Elemental Sorcerer and Bubonic Conjuror',
      'Added the ability to select only one character to display in characters page',
      'Added charge syphon timer to the dashboard ',
      'Added meals breakpoint for level 40, 50 and 60'
    ],
    fixes: [
      'Fixed a bug with sorting buildings by time',
      'Fixed a bug with wrong icon displayed in breeding page'
    ]
  },
  {
    ver: '3.2.0',
    gameVer: '1.86',
    date: '01/07/2023',
    features: [
      'Added data and assets from version 1.86',
      'Updated design for Buildings page',
      'Added world 4 and world 5 bosses keys to Account -> General page',
      'Updated logic and design for upgradable bubbles from NLBL by lithium atom'
    ],
    fixes: [
      'Fixed a bug with trimmed slot',
      'Fixed kitchen speed notation',
      'Fixed a bug with lab and printer caused by doot doot',
      'Fixed display for respawn time at Characters -> Stats',
      'Fixed a display bug for very high damage numbers',
      'Fixed an overflow bug with money values'
    ]
  },
  {
    ver: '3.1.99',
    gameVer: '1.84',
    date: '19/06/2023',
    features: [
      'Added total production per hour to the anvil page'
    ],
    fixes: []
  },
  {
    ver: '3.1.98',
    gameVer: '1.84',
    date: '18/06/2023',
    features: [
      'Added 1.84 data and assets',
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/companions'}>Companions</Link> page</Typography>
    ],
    fixes: []
  },
  {
    ver: '3.1.97',
    gameVer: '1.83',
    date: '17/06/2023',
    features: [],
    fixes: ['Fixed a bug with apple login']
  },
  {
    ver: '3.1.97',
    gameVer: '1.83',
    date: '16/06/2023',
    features: [
      'Added Total daily charge, charge with syphon and time to full display for worship page'
    ],
    fixes: ['Fixed a bug with stamp calculations', 'Fixed worship max charge and rate calculations']
  },
  {
    ver: '3.1.96',
    gameVer: '1.83',
    date: '15/06/2023',
    features: [
      'Updated the login flow of the website 🎉',
      <Typography component={'span'}><Typography component={'span'}
                                                 sx={{ fontWeight: 'bold' }}>Deprecated</Typography> the ability to
        paste data into the website (steam data extractor is no longer supported, please use one of the other 3 login
        methods [Email, Google, Apple])</Typography>

    ],
    fixes: ['Fixed a bug with max liquid calculation']
  },
  {
    ver: '3.1.95',
    gameVer: '1.83',
    date: '13/06/2023',
    features: [
      'Updated design for the homepage 🎉 🎊 🎉',
      <Typography><Typography sx={{ fontWeight: 'bold' }} component={'span'}>*Experimental*</Typography> Added more
        stats to Stats filter
        under <Link
          href={'https://idleontoolbox.com/characters'}>Characters</Link> page e.g crit chance and damage, kills per
        hour (works better when you have 100% survivability),
        defence [* MIGHT BE VERY INACCURATE]</Typography>,
      'Updated some components design in hope for better readability',
      <Typography>Moved the utility buttons to a separate <Link
        href={'https://idleontoolbox.com/data'}>Data</Link> page</Typography>,
      <Typography>Updated the structure of dashboard alerts (if you're encountering any issue try to clean localStorage
        from the new <Link
          href={'https://idleontoolbox.com/data'}>Data</Link> page)</Typography>
    ],
    fixes: [
      'Now displaying the correct effect for all stamps on the stamps page',
      'Fixed an issue with 0 star cards',
      'Fixed a bug with bags capacity',
      'Bugs created on this release 😅'
    ]
  },
  {
    ver: '3.1.94',
    gameVer: '1.83',
    date: '09/06/2023',
    features: [
      'Added "Subtract green stacks" to stamps page'
    ],
    fixes: [
      'Fixed printer calculation and breakdown'
    ]
  },
  {
    ver: '3.1.93',
    gameVer: '1.83',
    date: '07/06/2023',
    features: [
      'Added a God Planner to the tools section'
    ],
    fixes: [
      'Fixed a bug with bits display in gaming page',
      'Fixed a bug with shinies alert in dashboard'
    ]
  },
  {
    ver: '3.1.92',
    gameVer: '1.83',
    date: '06/06/2023',
    features: [
      'Added a timer for construction buildings to Buildings page and a timer on dashboard for closest building to finish',
      'Added a checkbox to filter by time to build in Buildings page'
    ],
    fixes: ['Fixed issues with login in iPhone']
  },
  {
    ver: '3.1.92',
    gameVer: '1.83',
    date: '06/06/2023',
    features: [
      'Added an overview of islands/captains to Boats And Captains tab in Sailing page',
      'Added detailed information about statues in account page'
    ],
    fixes: []
  },
  {
    ver: '3.1.91',
    gameVer: '1.83',
    date: '03/06/2023',
    features: [
      'Added data and assets from version 1.83'
    ],
    fixes: []
  },
  {
    ver: '3.1.90',
    gameVer: '1.82',
    date: '01/06/2023',
    features: [
      'Added Void Trial Rerun, Arena Spirit, Taste Test to dashboard alerts',
      'Added few submitted builds',
      'Updated the view for refinery page (hopefully for the better) and now accounting for printed items from Printer'
    ],
    fixes: [
      'Fixed atom particles display',
      'Fixed bubble calculations'
    ]
  },
  {
    ver: '3.1.89',
    gameVer: '1.82',
    date: '31/05/2023',
    features: [
      'Added Damage, Hp, Mp, Accuracy, Movement Speed info to Characters -> Stats filter (Might be inaccurate :) )',
      'Added Construction calculations for Build rate, Player XP boost and flaggy rate',
      'Added missing pet images in Breeding',
      'Added happy hour timer to dashboard',
      'Added an alert for finished flags on construction',
      'Added a display of all fence pets in breeding page'
    ],
    fixes: [
      'Fixed postoffice, statues calculations',
      'Possible fix for dashboard throwing exception randomly when update filters'
    ]
  },
  {
    ver: '3.1.88',
    gameVer: '1.82',
    date: '27/05/2023',
    features: [
      'Added dungeon items to item planner',
      'Added inventory display in Characters page -> Inventory filter'
    ],
    fixes: [
      'Fixed a bug in item browser'
    ]
  },
  {
    ver: '3.1.87',
    gameVer: '1.82',
    date: '26/05/2023',
    features: [
      'Added shiny level alert to the dashboard',
      'Added Random Event (when you haven\'t done an event) alert to the dashboard',
      'Added capacity check for stamps upgrade, hovering the required item will show the recommended character with max capacity',
      'Added capacity information to Characters page -> Bags filter (tooltip)'
    ],
    fixes: [
      'Fixed a display bug showing the wrong effect at the overflowing ladle tooltip',
      'Fixed a bug with 6 cards not showing even when bonus is unlocked'
    ]
  },
  {
    ver: '3.1.86',
    gameVer: '1.82',
    date: '25/05/2023',
    features: [
      'Added a "Closest trap" timer to dashboard view',
      'Added a "Next printer cycle" timer to dashboard view'
    ],
    fixes: [
      'Fixed cooking speed calc',
      'Fixed shinies time calculations'
    ]
  },
  {
    ver: '3.1.85',
    gameVer: '1.82',
    date: '24/05/2023',
    features: [
      'Added concise character information to dashboard '
    ],
    fixes: [
      'Some small fixes all over the place :D'
    ]
  },
  {
    ver: '3.1.84',
    gameVer: '1.82',
    date: '23/05/2023',
    features: [
      'Added Import / Export to item planner (importing will override all of your sections)',
      'Added afk gains breakdown (to help debug issues :D)',
      'Added total kitchens speed to cooking page -> kitchens tab',
      'Towers pages renamed to Buildings page'
    ],
    fixes: [
      'Fixed atom calculations in Printer page',
      'Fixed max levels for all buildings'
    ]
  },
  {
    ver: '3.1.83',
    gameVer: '1.82',
    date: '22/05/2023',
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
    ]
  },
  {
    ver: '3.1.82',
    gameVer: '1.82',
    date: '20/05/2023',
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
    ]
  },
  {
    ver: '3.1.81',
    gameVer: '1.81',
    date: '19/05/2023',
    features: [
      <Typography>Added sailing trades to <Link
        href={'https://idleontoolbox.com/account/world-5/sailing'}>Sailing</Link> page under Trades tab</Typography>
    ],
    fixes: [
      'Fixed boat speed calculation (it was missing the SB talent)'
    ]
  },
  {
    ver: '3.1.80',
    gameVer: '1.81',
    date: '18/05/2023',
    features: [
      'Added \'Totals\' section to the printer page, showing atoms generated from printer and total items printed in an hour/day/printer go brrr (let me know if it\'s inaccurate)',
      'Added shops alerts to the dashboard',
      'Updated logic for showing an alert for refinery'
    ],
    fixes: []
  },
  {
    ver: '3.1.79',
    gameVer: '1.81',
    date: '17/05/2023',
    features: [
      'Added Respawn Time value and breakdown under Characters page -> Stats filter',
      'Added a threshold input for alchemy in dashboard options (for liquids capacity)'
    ],
    fixes: [
      'Fixed a bug with sigils not displaying in dashboard'
    ]
  },
  {
    ver: '3.1.78',
    gameVer: '1.81',
    date: '16/05/2023',
    features: [
      'Added countdown timer for sigils'
    ],
    fixes: [
      'Fixed calculation for atom collider\'s cost calculation'
    ]
  },
  {
    ver: '3.1.77',
    gameVer: '1.81',
    date: '14/05/2023',
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
    ]
  },
  {
    ver: '3.1.76',
    gameVer: '1.81',
    date: '11/05/2023',
    features: [],
    fixes: [
      'Fixed card progress calculations and added 5th star bonus to card page',
      'Fixed a bug with bubble required material calculation',
      'Fixed a bug with bubble atom cost calculation'
    ]
  },
  {
    ver: '3.1.75',
    gameVer: '1.81',
    date: '10/05/2023',
    features: [
      'Added a dashboard alert for max capacity liquids in alchemy',
      <Typography>Added liquids progress to the <Link
        href={'https://idleontoolbox.com/account/orld-2/cauldrons'}>cauldrons</Link> page</Typography>,
      'Added 0 to 20 (static) timer to library '
    ],
    fixes: [
      'Fixed Library Checkouts superbit bonus',
      'Fixed shiny pets level up timer'
    ]
  },
  {
    ver: '3.1.74',
    gameVer: '1.81',
    date: '09/05/2023',
    features: [
      'Added timers for egg and shiny levels'
    ],
    fixes: []
  },
  {
    ver: '3.1.73',
    gameVer: '1.81',
    date: '08/05/2023',
    features: [
      'Added Boat Speed value and a timer to "Boats and Captains" tab (Sailing page)',
      'Added shop captains to "Boats and Captains" tab (Sailing page)'
    ],
    fixes: [
      'Fixed meals actual values in Meals and Kitchen tabs',
      'Fixed boat artifact chance',
      'Fixed an issue with statues not showing the correct statue level',
      'Fixed a bug in Skill Mastery with second bonus from Sailing, Gaming and divinity'
    ]
  },
  {
    ver: '3.1.72',
    gameVer: '1.81',
    date: '06/05/2023',
    features: ['Enhanced talents and post office dashboard configuration and changed the design a little bit'],
    fixes: []
  },
  {
    ver: '3.1.71',
    gameVer: '1.81',
    date: '05/05/2023',
    features: [<Typography>Added printer sample rate to the <Link
      href={'https://idleontoolbox.com/account/world-3/printer'}>Printer</Link> page</Typography>],
    fixes: ['Fixed a bug with bonuses from equipment']
  },
  {
    ver: '3.1.70',
    gameVer: '1.81',
    date: '03/05/2023',
    features: ['New Alert in dashboard that will appear when your character can equip a new tier of a tool (pickaxe, hatchet, etc)'],
    fixes: []
  },
  {
    ver: '3.1.69',
    gameVer: '1.81',
    date: '01/05/2023',
    features: [<Typography>Added superbit information to <Link
      href={'https://idleontoolbox.com/account/world-5/gaming'}>Gaming</Link> page</Typography>,
      'Added colored bits in gaming page'],
    fixes: []
  },
  {
    ver: '3.1.68',
    gameVer: '1.81',
    date: '29/04/2023',
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
    fixes: ['Fixed a bug with library causing the app to crash']
  },
  {
    ver: '3.1.67',
    gameVer: '1.80b',
    date: '28/04/2023',
    features: ['Added an option to see production alert 1 hour before its being full',
      'Added threshold levels indication for skill mastery'],
    fixes: ['More accurate bargain tag check for dashboard',
      'Ready talents are now showing only when they are available for the character',
      'Fixed a bug with gilded stamp',
      'Library is only showing when world 3 is unlocked (dashboard)']
  },
  {
    ver: '3.1.66',
    gameVer: '1.80b',
    date: '23/04/2023',
    features: [],
    fixes: ['Alerts are now only showing if you\'ve unlocked the relevant world!',
      <Typography>Added indication for infinite stars on <Link
        href={'https://idleontoolbox.com/account/constellations'}>Constellations</Link> page - star sign
        tab</Typography>,
      'Added shiny bonuses to Refinery and Meals',
      'Updated alerts logic']
  },
  {
    ver: '3.1.65',
    gameVer: '1.80b',
    date: '22/04/2023',
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
    fixes: []
  },
  {
    ver: '3.1.63',
    gameVer: '1.80',
    date: '20/04/2023',
    features: ['Fixed Apple login'],
    fixes: []
  },
  {
    ver: '3.1.62',
    gameVer: '1.80',
    date: '19/04/2023',
    features: ['Added support for Apple login', 'Added data and assets from version 1.80'],
    fixes: []
  },
  {
    ver: '3.1.61',
    gameVer: '1.79',
    date: '18/04/2023',
    features: [],
    fixes: ['Fixed a bug with gaming alerts', 'Fixed a bug with refinery']
  },
  {
    ver: '3.1.60',
    gameVer: '1.79',
    date: '15/04/2023',
    features: [],
    fixes: ['Fixed a bug with Crystal Countdown calculation']
  },
  {
    ver: '3.1.59',
    gameVer: '1.79',
    date: '14/04/2023',
    features: [],
    fixes: ['Added missing rank up alert for salts in refinery']
  },
  {
    ver: '3.1.58',
    gameVer: '1.79',
    date: '10/04/2023',
    features: [
      <Typography>Added the ability to create custom builds in <Link
        href={'https://idleontoolbox.com/tools/builds'}>Builds</Link> page</Typography>
    ],
    fixes: [
      'Fixed item planner bug',
      'Fixed a bug with calculating additional talent levels for Elemental Sorcerer (again)'
    ]
  },
  {
    ver: '3.1.57',
    gameVer: '1.79',
    date: '09/04/2023',
    features: ['Added Defence tag to Card Search'],
    fixes: [
      'Fixed material calculations for bubbles',
      'Fixed a bug with calculating additional talent levels for Elemental Sorcerer'
    ]
  },
  {
    ver: '3.1.57',
    gameVer: '1.79',
    date: '05/04/2023',
    features: [
      'Added particle cost for bubbles (displayed when required material is higher than 100M)',
      'Added indication of how many particle upgrade left to bubble page',
      'Added Giant Mob Spawn Chance card to the dashboard (near library timer)'
    ],
    fixes: [
      'Fixed a bug on Item Planner when selecting \'Show Missing Items\'',
      'Updated required material for bubble to be capped at 1000M (1B)'
    ]
  },
  {
    ver: '3.1.56',
    gameVer: '1.79',
    date: '04/04/2023',
    features: [
      <Typography>Updated some logic and display for <Link
        href={'https://idleontoolbox.com/account/slab'}>Slab</Link> page</Typography>
    ],
    fixes: ['Fixed a bug with guild data when importing from steam-extractor']
  },
  {
    ver: '3.1.55',
    gameVer: '1.79',
    date: '03/04/2023',
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
    ]
  },
  {
    ver: '3.1.54',
    gameVer: '1.79',
    date: '01/04/2023',
    features: ['Added data and assets from version 1.79'],
    fixes: []
  },
  {
    ver: '3.1.53',
    gameVer: '1.78c',
    date: '28/03/2023',
    features: [],
    fixes: ['Fixed a bug where Traps option in also turned off Obols option in dashboard setting',
      'Updated logic for max traps with CALL ME ASH bubble now working globally']
  },
  {
    ver: '3.1.52',
    gameVer: '1.78c',
    date: '28/03/2023',
    features: ['Added gaming dashboard alerts (Max sprouts and sprinkler drops, squirrel and shovel alerts if you haven\'t clicked for over an hour)',
      'Added sprouts and sprinkler drops indication to gaming page'],
    fixes: []
  },
  {
    ver: '3.1.51',
    gameVer: '1.78c',
    date: '27/03/2023',
    features: ['Added data and assets from version 1.78c',
      'Added indication for stamps that you can upgrade based on your stored materials and money'],
    fixes: []
  },
  {
    ver: '3.1.50',
    gameVer: '1.78.0',
    date: '25/03/2023',
    features: ['Added data and assets from version 1.78',
      'Added \'Sort By\' filter for meals (for next level ,lv. 11 and lv. 30)'],
    fixes: ['Fixed the email and password login flow (didn\'t notice it wasn\'t working correctly)']
  },
  {
    ver: '3.1.49',
    gameVer: '1.77.0',
    date: '24/03/2023',
    features: ['Added \'Sort By\' filter for meals (for next level ,lv. 11 and lv. 30)'],
    fixes: ['Fixed library speed calculation']
  },
  {
    ver: '3.1.48',
    gameVer: '1.77.0',
    date: '22/03/2023',
    features: ['Added library timer to dashboard'],
    fixes: ['Updated logic for post office dashboard notification (doesn\'t show up when maxed all boxes)']
  },
  {
    ver: '3.1.47',
    gameVer: '1.77.0',
    date: '21/03/2023',
    features: [<Typography><Link
      href={'https://idleontoolbox.com/dashboard'}>Dashboard</Link> page!</Typography>,
      <Typography>Added a tooltip for boss keys + colo tickets on <Link
        href={'https://idleontoolbox.com/account/general'}>General</Link> page</Typography>,
      <Typography>Added Stamp Reducer indication on <Link
        href={'https://idleontoolbox.com/account/world-3/atom-collider'}>Atom Collider</Link> page</Typography>,
      'Added Subtract Green Stacks option for vials in dashboard (this will subtract 10M from your current amount to make sure you will still have green stack after upgrading)',
      'Added a tooltip for exact quantity for items in storage'],
    fixes: ['Fixed wizard towers max level (from atom collider)', 'Some bug fixes for low level accounts',
      'Added missing W5 catching and chopping targets (ops)', 'Fixed a bug on Vials page']
  },
  {
    ver: '3.1.46',
    gameVer: '1.77.0',
    date: '18/03/2023',
    features: [],
    fixes: ['Update looty (hopefully it is more accurate)', 'Update W5 quest header (visual update)',
      'Updated atoms description with the correct "Total Bonus"',
      'Fixed cooking speed to account for "Fluoride - Void Plate Chef" atom']
  },
  {
    ver: '3.1.45',
    gameVer: '1.77.0',
    date: '17/03/2023',
    features: [],
    fixes: ['Added Elemental Sorcerer family bonus to talent levels']
  },
  {
    ver: '3.1.44',
    gameVer: '1.77.0',
    date: '15/03/2023',
    features: ['Added extra printer slots', 'Added calculation for \'Polytheism\' talent of Elemental Sorcerer'],
    fixes: []
  },
  {
    ver: '3.1.43',
    gameVer: '1.77.0',
    date: '04/03/2023',
    features: ['Updated the website with 1.77.0 data and assets'],
    fixes: []
  },
  {
    ver: '3.1.42',
    gameVer: '1.76.0',
    date: '24/02/2023',
    features: ['Updated the website with 1.76.0 data and assets', 'Added new constellations'],
    fixes: ['Carry bags order']
  },
  {
    ver: '3.1.41',
    gameVer: '1.75.1',
    date: '10/02/2023',
    features: ['Added materials per hour for refinery page'],
    fixes: []
  },
  {
    ver: '3.1.40',
    gameVer: '1.75.1',
    date: '10/02/2023',
    features: ['Updated the website with 1.75.1 data and assets'],
    fixes: []
  },
  {
    ver: '3.1.39',
    gameVer: '1.75',
    date: '10/02/2023',
    features: ['Updated the website with 1.75 data and assets'],
    fixes: []
  },
  {
    ver: '3.1.38',
    gameVer: '1.74',
    date: '09/02/2023',
    features: [],
    fixes: ['minor issue with captain exp requirement']
  },
  {
    ver: '3.1.37',
    gameVer: '1.74',
    date: '31/01/2023',
    features: ['Update the website with 1.74 data and assets',
      'Added "King of the remembrance" calculation to printer'],
    fixes: ['Shrine bonus is now calculated correctly (hopefully)',
      'Added extra levels from symbol talents and bear god',
      'Fixed family bonuses to account for The Family Guy talent']
  },
  {
    ver: '3.1.36',
    gameVer: '1.73',
    date: '23/01/2023',
    features: [],
    fixes: ['Fixed atom collider bug when freshly opened']
  },
  {
    ver: '3.1.35',
    gameVer: '1.73',
    date: '11/01/2023',
    features: ['Added images and data from version 1.73'],
    fixes: ['Fixed sigil bonuses']
  },
  {
    ver: '3.1.34',
    gameVer: '1.72',
    date: '11/01/2023',
    features: ['Added images and data from version 1.72', <Typography>Added <Link
      href={'https://idleontoolbox.com/account/world-3/atom-collider'}>Atom Collider</Link> page</Typography>],
    fixes: []
  },
  {
    ver: '3.1.33',
    gameVer: '1.71',
    date: '06/01/2023',
    features: ['Added library checkouts counter with breakpoints for 16, 18, 20 on Account -> General page (let me know if the timers are off)',
      'Added percentage completed of the boat trip to the island'],
    fixes: []
  },
  {
    ver: '3.1.32',
    gameVer: '1.71',
    date: '31/12/2022',
    features: [],
    fixes: ['Fixed a bug where accounts without world 5 data would crash']
  },
  {
    ver: '3.1.31',
    gameVer: '1.71',
    date: '30/12/2022',
    features: ['Added max possible nugget roll possible', 'Added the required resources for a boat upgrade'],
    fixes: ['Fixed a bug with islands names in sailing']
  },
  {
    ver: '3.1.30',
    gameVer: '1.71',
    date: '29/12/2022',
    features: ['Added chests, boats and captains display', 'Added crystal chance breakdown',
      'Added divinity style to the activity filter when character is afk in divinity'],
    fixes: ['Added indication for lab by linking Goharut as a god']
  },
  {
    ver: '3.1.29',
    gameVer: '1.71',
    date: '28/12/2022',
    features: ['Added timer for acorns in gaming page'],
    fixes: ['Fixed gaming upgrades bonus and cost']
  },
  {
    ver: '3.1.28',
    gameVer: '1.71',
    date: '27/12/2022',
    features: ['Added a timer for dirty shovel (+ nuggets break points)',
      'Applied most artifacts bonuses all over the website',
      'Added tooltip over printer items showing the boosted value from lab,artifacts,gods',
      'Divinity - now correctly showing unlocked gods'],
    fixes: ['Sigils not calculated with artifacts bonus']
  },
  {
    ver: '3.1.27',
    gameVer: '1.70',
    date: '26/12/2022',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/sailing'}>Sailing</Link> page</Typography>,
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/divinity'}>Divinity</Link> page</Typography>,
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-5/gaming'}>Gaming</Link> page</Typography>
    ],
    fixes: ['Added refinery speed stamp to refinery calculations', 'Fixed minor bug with un-acquired stamps']
  },
  {
    ver: '3.1.26',
    gameVer: '1.70',
    date: '23/12/2022',
    features: [],
    fixes: ['Added missing meals (from world 5)', 'Added basic logic for deities to activate lab']
  },
  {
    ver: '3.1.25',
    gameVer: '1.70',
    date: '22/12/2022',
    features: [],
    fixes: ['Added world 5 quests npc', 'Added world 5 vials', 'Added world 5 cards', 'Added world 5 death note',
      'Added world 5 bubbles']
  },
  {
    ver: '3.1.24',
    gameVer: '1.70',
    date: '20/12/2022',
    features: [],
    fixes: ['Fixed small calculation error in max worship']
  },
  {
    ver: '3.1.23',
    gameVer: '1.70',
    date: '19/12/2022',
    features: ['Added data and assets for world 5!'],
    fixes: ['Fixed timer in "Stats" filter to count up instead of down (please let me know if there are any issue with timers)']
  },
  {
    ver: '3.1.22',
    gameVer: '1.60',
    date: '21/11/2022',
    features: [],
    fixes: ['Fixed small calculation error in cooking page', 'Added missing Demon Genie icon',
      'Added exp per hour to exp calculator']
  },
  {
    ver: '3.1.21',
    gameVer: '1.60',
    date: '11/10/2022',
    features: [],
    fixes: ['Fixed total mat printed fixed']
  },
  {
    ver: '3.1.20',
    gameVer: '1.60',
    date: '09/10/2022',
    features: ['Added boop to zow/chow view', 'Added total material printed to Account -> General'],
    fixes: []
  },
  {
    ver: '3.1.19',
    gameVer: '1.60',
    date: '15/09/2022',
    features: ['Added additional information to anvil, worship and trap pages'],
    fixes: []
  },
  {
    ver: '3.1.18',
    gameVer: '1.60',
    date: '09/08/2022',
    features: ['Added an option to hide capped meals', 'Added progress indicator for cards',
      'Cards you haven\'t found will appear with low opacity'],
    fixes: []
  },
  {
    ver: '3.1.17',
    gameVer: '1.60',
    date: '30/07/2022',
    features: [],
    fixes: ['Fixed AFK time in stats', 'Fixed obols ordering']
  },
  {
    ver: '3.1.16',
    gameVer: '1.60',
    date: '12/07/2022',
    features: ['Updated data to patch 1.60'],
    fixes: []
  },
  {
    ver: '3.1.15',
    gameVer: '1.59',
    date: '08/07/2022',
    features: ['Added number of ladles needed for level up in meals page'],
    fixes: ['Fixed meal speed calculations', 'Fixed overflowing ladle calculations']
  },
  {
    ver: '3.1.14',
    gameVer: '1.59',
    date: '08/07/2022',
    features: [<Typography>Added total critters calculations to <Link
      href={'https://idleontoolbox.com/account/world-3/traps'}>Traps</Link> page</Typography>],
    fixes: []
  },
  {
    ver: '3.1.13',
    gameVer: '1.59',
    date: '08/07/2022',
    features: ['Added an option to login with email and password (I\'m still not saving anything anywhere so don\'t worry)'],
    fixes: ['Fixed a bug in traps page caused when there\'s no trap box equipped']
  },
  {
    ver: '3.1.12',
    gameVer: '1.59',
    date: '05/07/2022',
    features: [<Typography>Added sections to the <Link
      href={'https://idleontoolbox.com/tools/item-planner'}>item planner</Link> page that allows you to track several
      items separately</Typography>,
      'Updated the website data with 1.59 patch'],
    fixes: []
  },
  {
    ver: '3.1.11',
    gameVer: '1.58',
    date: '02/07/2022',
    features: [],
    fixes: ['Cogstruction: fix for empties cog array']
  },
  {
    ver: '3.1.10',
    gameVer: '1.58',
    date: '28/06/2022',
    features: [<Typography>Added trap type, quantity and exp (by hovering the trap) to the <Link
      href={'https://idleontoolbox.com/account/world-3/traps'}>Traps</Link> page</Typography>],
    fixes: []
  },
  {
    ver: '3.1.8',
    gameVer: '1.58',
    date: '14/06/2022',
    features: ['Added meal speed contribution view'],
    fixes: []
  },
  {
    ver: '3.1.7',
    gameVer: '1.58',
    date: '01/06/2022',
    features: [
      <Typography>Added <Link
        href={'https://idleontoolbox.com/account/world-2/cauldrons'}>Cauldrons</Link> page to view all cauldrons and
        cauldrons upgrades from p2w tab</Typography>
    ],
    fixes: []
  },
  {
    ver: '3.1.6',
    gameVer: '1.58',
    date: '30/05/2022',
    features: ['Updated to version 1.58'],
    fixes: []
  },
  {
    ver: '3.1.5',
    gameVer: '1.57',
    date: '26/05/2022',
    features: [
      <Typography>Added builds from idleon companion under Tools and can be accessed like this <Link
        href={'https://idleontoolbox.com/tools/builds?b=barbarian&c=1'}>https://idleontoolbox.com/tools/builds?b=barbarian&c=1</Link> (The
        new classes are still missing builds, let me know if you want to add some)</Typography>,
      <Typography>Added forge upgrades tab to the <Link
        href={'https://idleontoolbox.com/account/world-1/forge'}>Forge</Link> page</Typography>,
      <Typography>Added claims counter for spices under to the <Link
        href={'https://idleontoolbox.com/account/world-4/cooking'}>Cooking</Link> page</Typography>

    ],
    fixes: []
  },
  {
    ver: '3.1.4',
    gameVer: '1.57',
    date: '26/05/2022',
    features: ['Added coin cost to max calculation for anvil', 'Small refinery visual bug fix'],
    fixes: []
  },
  {
    ver: '3.1.3',
    gameVer: '1.57',
    date: '24/05/2022',
    features: ['Added an option to apply Overflowing ladle (Blood Berserker talent) to meals'],
    fixes: []
  },
  {
    ver: '3.1.2',
    gameVer: '1.57',
    date: '24/05/2022',
    features: ['Apocalypses page under Account tab'],
    fixes: []
  },
  {
    ver: '3.1.1',
    gameVer: '1.57',
    date: '24/05/2022',
    features: [],
    fixes: ['Hopefully fixed lab calculations']
  },
  {
    ver: '3.1.0',
    gameVer: '1.57',
    date: '23/05/2022',
    features: [
      'Updated all data to version 1.57',
      '(Things might still be inaccurate, I\'m still updating the formulas to account for all the new stuff)',
      'Added a light version of a "Public Profile" using pastebin to import your data, instructions can be found on the button above (let me know if you experience any kind of problems in any type of connection)'
    ],
    fixes: []
  },
  {
    ver: '3.0.10',
    gameVer: '1.56.1',
    date: '22/05/2022',
    features: [],
    fixes: [
      'Fixed a bug with dungeons happy hour timer counting up',
      'Fixed a bug with cogstruction data export'
    ]
  },
  {
    ver: '3.0.9',
    gameVer: '1.56.1',
    date: '21/05/2022',
    features: [],
    fixes: [
      'Fixed sorting meals logic',
      'Fixed meals cost calculations']
  },
  {
    ver: '3.0.8',
    gameVer: '1.56.1',
    date: '21/05/2022',
    features: [
      'Added towers page under Account -> World 3'
    ],
    fixes: []
  },
  {
    ver: '3.0.7',
    gameVer: '1.56.1',
    date: '20/05/2022',
    features: [
      '(Re-)Added the item browser which lets you find an item anywhere in your account'
    ],
    fixes: []
  },
  {
    ver: '3.0.6',
    gameVer: '1.56.1',
    date: '20/05/2022',
    features: [
      'Added \'chance not to consume food\' percentage in \'Stats\' filter'
    ],
    fixes: []
  },
  {
    ver: '3.0.5',
    gameVer: '1.56.1',
    date: '19/05/2022',
    features: [],
    fixes: [
      'Added doubling bonus chips to the calculations of cards and star signs',
      'Fixed a small bug with displaying cards'
    ]
  },
  {
    ver: '3.0.4',
    gameVer: '1.56.1',
    date: '19/05/2022',
    features: [
      'Added minigame and library currency to Account -> General',
      'Small visual update for dungeons'
    ],
    fixes: []
  },
  {
    ver: '3.0.3',
    gameVer: '1.56.1',
    date: '19/05/2022',
    features: ['Quick and dirty storage page'],
    fixes: []
  },
  {
    ver: '3.0.2',
    gameVer: '1.56.1',
    date: '18/05/2022',
    features: [],
    fixes: ['Re-added points distribution in anvil details']
  },
  {
    ver: '3.0.1',
    gameVer: '1.56.1',
    date: '18/05/2022',
    features: [],
    fixes: ['Fixed a visual bug in construction page', 'Fixed calculation of anvil details']
  },
  {
    ver: '3.0.0',
    gameVer: '1.56.1',
    date: '12/05/2022',
    features: ['Reworked the website - the website is now responsive and can be used in mobile as well!',
      'WIP: builds (from idleon companion)'],
    fixes: []
  }
];
