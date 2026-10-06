// Alert data keys that differ from the option controlling them. resolveSettingsTarget reads the
// key off the alert, so without this the settings link lands on the tracker, not the option.
export const alertAliases = {
  'account.World 3.construction': { saltDeficit: 'saltBalance', saltRankUpRoom: 'saltBalance' },
  'account.World 3.printer': { atoms: 'includeResource' },
  'account.World 3.traps': { overdue: 'trapsOverdue' },
  'account.World 3.hatRack': { missingHats: 'hatsMissing' },
  'account.World 5.hole': {
    motherlodeMaxed: 'motherlode',
    hiveMaxed: 'theHive',
    evertreeMaxed: 'evertree',
    bottomlessTrenchMaxed: 'bottomlessTrench'
  },
  'account.World 6.etc': { emperorAttempts: 'emperor' },
  'account.World 7.gallery': { missingTrophies: 'trophiesMissing', missingNametags: 'nametagsMissing' },
  'account.World 7.legendTalents': { legendPointsLeftToSpend: 'pointsLeftToSpend' }
};

// Display text for the alert settings editor, keyed '<configType>.<section>' and
// '<configType>.<section>.<tracker>' (characters have no section). Plain data: the editor falls back
// to the key name for anything missing, and __test__/utility/alert-meta.test.js keeps every path and
// option name in step with baseTrackers.
export const sectionMeta = {
  'account.General': { label: 'General' },
  'account.World 1': { label: 'World 1' },
  'account.World 2': { label: 'World 2' },
  'account.World 3': { label: 'World 3' },
  'account.World 4': { label: 'World 4' },
  'account.World 5': { label: 'World 5' },
  'account.World 6': { label: 'World 6' },
  'account.World 7': { label: 'World 7' },
  'timers.General': { label: 'General' },
  'timers.Etc': { label: 'Other' },
  'timers.Clickers': { label: 'Clickers' },
  'timers.World 3': { label: 'World 3' },
  'timers.World 5': { label: 'World 5' },
  'timers.World 6': { label: 'World 6' },
  'timers.World 7': { label: 'World 7' }
};

export const alertMeta = {
  // Account: General
  'account.General.tasks': {
    label: 'Daily tasks',
    icon: 'etc/Merit_0',
    options: {
      tasks: { label: 'Worlds to check', help: 'Alerts when the daily task of a ticked world is not done yet.' }
    }
  },
  'account.General.materialTracker': {
    label: 'Material tracker',
    icon: 'data/Refinery1',
    // The item thresholds live on the tool's own page, not in this config.
    link: { text: 'Set item thresholds in', label: 'Tools > Material Tracker', href: '/tools/material-tracker' },
    options: {}
  },
  'account.General.guild': {
    label: 'Guild tasks',
    icon: 'etc/GP',
    options: {
      daily: { label: 'Daily guild tasks left' },
      weekly: { label: 'Weekly guild tasks left' }
    }
  },
  'account.General.shops': {
    label: 'Town shops',
    icon: 'data/ShopEZ0',
    options: {
      shops: {
        label: 'Watched shop items',
        help: 'Alerts while a ticked item still has stock in its shop. Shops of worlds you have not finished are skipped.'
      }
    }
  },
  'account.General.etc': {
    label: 'Miscellaneous',
    icon: 'data/CharSlot',
    options: {
      dungeonTraits: { label: 'Dungeon trait not selected', group: 'Account' },
      randomEvents: { label: 'No random event done today', group: 'Daily' },
      keys: {
        label: 'Keys and tickets ready',
        help: 'Alerts when keys or colosseum tickets have not been picked up for 3 days or more.',
        group: 'Account'
      },
      miniBosses: {
        label: 'Miniboss kills stacked',
        help: 'Alerts when a miniboss has this many kills available. The lowest value is 2.',
        unit: 'kills',
        group: 'Account'
      },
      newCharacters: {
        label: 'New character slot available',
        help: 'Alerts when your total character levels unlock another character.',
        group: 'Account'
      },
      gemsFromBosses: { label: 'Boss kills left for gems', group: 'Account' },
      familyObols: { label: 'Empty family obol slots', group: 'Account' },
      freeCompanion: { label: 'Free companion to claim', group: 'Events' },
      petMartGems: { label: 'Free Pet Mart gems', group: 'Events' },
      tournamentRegister: {
        label: 'Not registered for the Pet Tournament',
        help: 'Alerts when you have not registered for the current Pet Tournament.',
        group: 'Events'
      },
      raidRegister: {
        label: 'Not registered for the Raid',
        help: 'Alerts when you have not registered for the current Raid.',
        group: 'Events'
      },
      dailyCrystals: {
        label: 'Daily guaranteed crystals left',
        help: 'Alerts while guaranteed crystal mob kills remain for today.',
        group: 'Daily'
      },
      arcanistDailyDrops: {
        label: 'Arcanist drops left today',
        help: 'Alerts while Arcanist weapon or ring drops remain for today (100 of each a day). Each drop type can be turned off on its own.',
        group: 'Daily',
        itemIcons: { weapon: 'data/EquipmentWandsArc0', ring: 'data/EquipmentRingsArc0' }
      },
      topOfTheMornin: {
        label: 'Top of the Mornin kills left',
        help: 'Alerts while Top of the Mornin kills remain for today.',
        group: 'Daily'
      },
      glimmerwickCandle: {
        label: 'Glimmerwick Candle not used today',
        help: 'Alerts when you own a Glimmerwick Candle and have not wished on it today.',
        group: 'Daily'
      }
    }
  },

  // Account: World 1
  'account.World 1.stamps': {
    label: 'Stamps',
    icon: 'data/StampA34',
    options: {
      gildedStamps: { label: 'Gilded stamps available' },
      showGildedWhenNoAtomDiscount: {
        label: 'Only when the stamp atom discount is 0',
        help: 'Holds the gilded stamps alert back while the Stamp Reducer atom still gives a discount.',
        dependsOn: 'gildedStamps'
      },
      affordableStampLevels: {
        label: 'Stamps you can max with coins',
        help: 'Alerts when stamps can be levelled to max for at most this share of your account coins, cheapest first.',
        unit: '%'
      },
      exaltedStamps: {
        label: 'Exalted stamps to apply',
        help: 'Alerts when you have compass exalted stamps you have not applied yet.'
      }
    }
  },
  'account.World 1.owl': {
    label: 'Orion the owl',
    icon: 'etc/Owl',
    options: {
      featherRestart: { label: 'Feather Restart affordable' },
      megaFeatherRestart: { label: 'Mega Feather Restart affordable' }
    }
  },
  'account.World 1.forge': {
    label: 'Forge',
    icon: 'data/ForgeA',
    options: {
      emptySlots: { label: 'Empty forge slots' }
    }
  },

  // Account: World 2
  'account.World 2.alchemy': {
    label: 'Alchemy',
    icon: 'data/aJarB0',
    options: {
      bargainTag: { label: 'Bargain Tag not bought today', group: 'Liquid shop' },
      gems: { label: 'Alchemy gems not bought today', group: 'Liquid shop' },
      sigils: { label: 'Sigils ready to level up', group: 'Cauldrons' },
      liquids: {
        label: 'Liquid almost full',
        help: 'Alerts when a liquid cauldron is filled to this percent of its capacity.',
        unit: '%',
        group: 'Cauldrons'
      },
      vials: { label: 'Vials you can level up', group: 'Vials' },
      vialsAttempts: {
        label: 'Vial attempts left',
        help: 'Alerts when you have vial attempts and own the item a locked vial needs.',
        group: 'Vials'
      },
      p2wUpgrades: {
        label: 'Affordable P2W upgrades',
        help: 'Cauldron and liquid P2W upgrades you can level with your account coins.',
        group: 'Cauldrons'
      },
      subtractGreenStacks: {
        label: 'Leave a green stack in storage',
        help: 'Counts 10M fewer of each vial item, so a vial only alerts once you can level it and keep a green stack.',
        dependsOn: 'vials',
        group: 'Vials'
      },
      alternateParticles: { label: 'Alternate particle upgrades available', group: 'Cauldrons' }
    }
  },
  'account.World 2.islands': {
    label: 'Islands',
    icon: 'data/Island1',
    options: {
      unclaimedDays: {
        label: 'Island days unclaimed',
        help: 'Alerts when you have not collected your islands for this many days.',
        unit: 'days'
      },
      shimmerIsland: { label: 'Shimmer trial not claimed this week' },
      garbageUpgrade: { label: 'Garbage Gain upgrade affordable' },
      collectibleGarbage: {
        label: 'Garbage waiting on Trash Island',
        help: 'A single collection is capped at 100 garbage. Anything above it is lost.'
      },
      crystalIsland: {
        label: 'Crystal Island days unclaimed',
        help: 'Caps at 14 days, and a capped island spawns fewer giant crystal mobs (15) than 13 days does (27).',
        unit: 'days'
      }
    }
  },
  'account.World 2.postOffice': {
    label: 'Post office shipments',
    icon: 'data/UIlilbox',
    options: {
      dailyShipments: {
        label: 'Shipments to check',
        help: 'Alerts when a ticked shipment has no completed order today.'
      },
      showAlertOnlyWhen0Shields: {
        label: 'Only when the shipment has no shields',
        dependsOn: 'dailyShipments'
      }
    }
  },
  'account.World 2.arcade': {
    label: 'Arcade',
    icon: 'data/PachiBall0',
    options: {
      balls: { label: 'Ball capacity almost full', help: 'Alerts within 5% of your max ball capacity.' },
      unmaxedRotation: {
        label: 'Shop rotation upgrades below max',
        help: 'Alerts when the current arcade shop rotation has upgrades below max level.'
      },
      includeSuper: {
        label: 'Count Super upgrades as unmaxed',
        help: 'Also alerts when a rotation upgrade is maxed but not Super upgraded (Lv 101).',
        dependsOn: 'unmaxedRotation'
      }
    }
  },
  'account.World 2.weeklyBosses': {
    label: 'W2 boss raid',
    icon: 'data/Trophie',
    options: {
      daily: {
        label: 'Daily boss raid not done',
        help: 'Alerts when you have not reset the W2 boss raid today (bonus class exp and damage).'
      },
      trophy: {
        label: 'Trophies left this week',
        help: 'Alerts until you have beaten 5 skulls this week, the point where trophies stop dropping.'
      }
    }
  },
  'account.World 2.killRoy': {
    label: 'Killroy',
    icon: 'etc/Killroy',
    options: {
      general: { label: 'Killroy available', help: 'Alerts when you have not done a Killroy run this week.' },
      underHundredKills: {
        label: 'Monsters under 100 kills',
        help: 'Alerts when the current Killroy has monsters below 100 Killroy kills (for equinox).'
      },
      skulls: { label: 'Unspent Killroy skulls' }
    }
  },
  'account.World 2.kangaroo': {
    label: 'Poppy the kangaroo',
    icon: 'data/RooA',
    options: {
      shinyThreshold: {
        label: 'Shiny catch progress reached',
        help: 'Alerts when your shiny catch progress is above this percent.',
        unit: '%'
      },
      fisherooReset: { label: 'Fisheroo Reset affordable' },
      greatestCatch: { label: 'Greatest Catch affordable' }
    }
  },

  // Account: World 3
  'account.World 3.printer': {
    label: '3D printer',
    icon: 'data/ConTower0',
    options: {
      includeResource: {
        label: 'Watched printed items',
        help: 'Alerts when printing a ticked item will turn into atoms. Untick an item to silence it. Items not listed always alert.'
      },
      showAlertWhenFull: {
        label: 'Only once storage is at the cap',
        help: 'Waits until storage already holds the atom conversion amount, instead of alerting as soon as printing would push it past.'
      }
    }
  },
  'account.World 3.library': {
    label: 'Talent library',
    icon: 'data/Libz',
    inline: 'books',
    options: {
      books: { label: 'Books ready', help: 'Alerts when the library has this many books ready.', unit: 'books' }
    }
  },
  'account.World 3.construction': {
    label: 'Construction and refinery',
    icon: 'data/ClassIcons49',
    options: {
      flags: { label: 'Finished flags on the board' },
      buildings: { label: 'Buildings ready to build' },
      materials: {
        label: 'Salts out of materials',
        help: 'Alerts when a ticked salt has run out of materials, or will within the lead time below.'
      },
      matsThreshold: {
        label: 'Warn ahead of time',
        help: 'Alerts this many hours before a salt runs out of materials. 0 alerts only once they are gone.',
        unit: 'h',
        dependsOn: 'materials'
      },
      rankUp: { label: 'Salts ready to rank up' },
      saltBalance: {
        label: 'Salt balance',
        help: 'Compares each ticked salt to the highest rank the previous salt can keep fuelled.'
      },
      saltBalanceDirection: {
        label: 'Alert when a salt is',
        help: 'The limit is the highest rank the previous salt can keep fuelled.',
        foldInto: 'saltBalance'
      }
    }
  },
  'account.World 3.hatRack': {
    label: 'Hat rack',
    icon: 'data/HatHelpA',
    options: {
      hatsMissing: { label: 'Owned hats missing from the rack' }
    }
  },
  'account.World 3.equinox': {
    label: 'Equinox',
    icon: 'data/Quest78',
    options: {
      bar: { label: 'Equinox bar full', help: 'Only while an unlocked upgrade is still below max level.' },
      challenges: { label: 'Completed challenges to claim' },
      foodLust: {
        label: 'Food Lust stacks',
        help: 'Alerts once you hold this many stacks, capped at your Food Lust level, so the default only alerts when Food Lust is maxed.',
        unit: 'stacks'
      }
    }
  },
  'account.World 3.atomCollider': {
    label: 'Atom collider',
    icon: 'data/Atom0',
    inline: 'stampReducer',
    options: {
      stampReducer: {
        label: 'Stamp Reducer reached',
        help: 'Alerts when the Stamp Reducer atom reaches this percent. The max is 90.',
        unit: '%'
      }
    }
  },
  'account.World 3.traps': {
    label: 'Traps',
    icon: 'data/TrapBoxSet1',
    options: {
      trapsOverdue: { label: 'Traps ready to collect' }
    }
  },

  // Account: World 4
  'account.World 4.breeding': {
    label: 'Breeding',
    icon: 'data/PetEgg1',
    options: {
      eggs: { label: 'Egg nest full' },
      eggsRarity: {
        label: 'Egg rarity reached',
        help: 'Alerts when any egg is at least this rarity: 1 is Base, 2 Copper, 3 Iron.'
      },
      shinies: {
        label: 'Shiny level reached',
        help: 'Alerts when a fenced shiny pet reaches this shiny level.'
      },
      breedability: {
        label: 'Breedability level reached',
        help: 'Alerts when a fenced pet reaches this breedability level.'
      }
    }
  },
  'account.World 4.cooking': {
    label: 'Cooking',
    icon: 'data/ClassIcons51',
    options: {
      spices: { label: 'Spice clicks left' },
      ribbons: {
        label: 'Empty ribbon slots',
        help: 'Alerts when the ribbon shelf has this many empty slots or fewer (28 slots).'
      },
      meals: { label: 'Meals ready to level up' },
      alertOnlyCookedMeal: {
        label: 'Only meals a kitchen is cooking',
        dependsOn: 'meals'
      },
      cookingMastery: { label: 'Unspent Cooking Mastery points' }
    }
  },
  'account.World 4.laboratory': {
    label: 'Laboratory',
    icon: 'data/ClassIcons53',
    options: {
      chipsRotation: { label: 'Chip to claim in the repository' },
      jewelsRotation: { label: 'Jewel to claim in the repository' }
    }
  },
  'account.World 4.tome': {
    label: 'Tome',
    icon: 'etc/Tome_0',
    options: {
      nametagClaim: {
        label: 'Ranking nametags to claim',
        help: 'Alerts when Tome ranking nametags are available to claim.'
      }
    }
  },

  // Account: World 5
  'account.World 5.gaming': {
    label: 'Gaming',
    icon: 'data/ClassIcons56',
    options: {
      sprouts: { label: 'Sprouts at capacity' },
      drops: { label: 'Sprinkler drops at capacity' },
      squirrel: {
        label: 'Squirrel not clicked',
        help: 'Alerts when this many hours have passed since you clicked the squirrel.',
        unit: 'h'
      },
      shovel: {
        label: 'Shovel not clicked',
        help: 'Alerts when this many hours have passed since you clicked the shovel.',
        unit: 'h'
      }
    }
  },
  'account.World 5.sailing': {
    label: 'Sailing',
    icon: 'npcs/Chesty',
    options: {
      captains: { label: 'Better captain in the shop' },
      chests: { label: 'Chest capacity full' },
      alwaysAlertEnderCaptains: {
        label: 'Every Ender captain in the shop',
        help: 'Alerts on every Ender captain in the shop, even when all your captains are already Ender and its stats are not higher.',
        dependsOn: 'captains'
      }
    }
  },
  'account.World 5.hole': {
    label: 'The Hole',
    icon: 'data/HoleWellBucket0',
    options: {
      buckets: {
        label: 'Sediment reached',
        help: 'Alerts when a well sediment reaches this amount. 0 uses its max.',
        group: 'Resource caverns'
      },
      motherlode: { label: 'Motherlode layer ready to break', group: 'Resource caverns' },
      evertree: { label: 'Evertree layer ready to break', group: 'Resource caverns' },
      bottomlessTrench: { label: 'Bottomless Trench layer ready to break', group: 'Resource caverns' },
      bravery: {
        label: 'Bravery story ready',
        help: 'Alerts when the Bravery reward multi reaches this value.',
        group: 'Monuments'
      },
      bellRing: {
        label: 'Ring bell ready',
        help: 'Alerts when the Ring bell has at least this many uses ready.',
        unit: 'uses',
        group: 'Other caverns'
      },
      bellPing: {
        label: 'Ping bell ready',
        help: 'Alerts when the Ping bell has at least this many uses ready.',
        unit: 'uses',
        group: 'Other caverns'
      },
      bellClean: {
        label: 'Clean bell ready',
        help: 'Alerts when the Clean bell has at least this many uses ready.',
        unit: 'uses',
        group: 'Other caverns'
      },
      bellRenew: {
        label: 'Renew bell ready',
        help: 'Alerts when the Renew bell has at least this many uses ready.',
        unit: 'uses',
        group: 'Other caverns'
      },
      theHarp: {
        label: 'Harp power reached',
        help: 'Alerts when Harp power reaches this percent.',
        unit: '%',
        group: 'Other caverns'
      },
      theHive: { label: 'Hive layer ready to break', group: 'Resource caverns' },
      grotto: { label: 'Monarch ready to fight', group: 'Other caverns' },
      justice: {
        label: 'Justice story ready',
        help: 'Alerts when the Justice reward multi reaches this value.',
        group: 'Monuments'
      },
      villagersLevelUp: { label: 'Villagers ready to level up', group: 'Villagers and studies' },
      wisdom: {
        label: 'Wisdom game ready',
        help: 'Alerts when the Wisdom reward multi reaches this value.',
        group: 'Monuments'
      },
      jars: {
        label: 'Jars to break',
        help: 'Alerts when you have this many jars. The max is 120.',
        unit: 'jars',
        group: 'Other caverns'
      },
      studyLevelUp: { label: 'Studies ready to level up', group: 'Villagers and studies' },
      jarsFull: { label: 'Jar slots full', group: 'Other caverns' },
      lanterns: {
        label: 'Blinding Lanterns left today',
        help: 'Alerts when at least this many lantern uses remain today. The daily cap is 12.',
        group: 'Other caverns'
      }
    }
  },

  // Account: World 6
  'account.World 6.sneaking': {
    label: 'Sneaking',
    icon: 'data/ClassIcons58',
    options: {
      lastLooted: {
        label: 'Sneaking loot not collected',
        help: 'Alerts when this many minutes have passed since you last looted sneaking rewards.',
        unit: 'min'
      },
      remainingPristineRolls: { label: 'Pristine charm rolls left' },
      remainingSymbolRolls: { label: 'Symbol rolls left' }
    }
  },
  'account.World 6.beanstalk': {
    label: 'Beanstalk',
    icon: 'etc/beanstalk1',
    options: {
      readyToPlant: {
        label: 'Golden food ready to rank up',
        help: 'Alerts when you own enough of a golden food to rank it up on the beanstalk.'
      }
    }
  },
  'account.World 6.farming': {
    label: 'Farming',
    icon: 'data/FarmPlant1',
    options: {
      plots: {
        label: 'Plots at OG level',
        help: 'Alerts when a plot reaches this OG level: 1 is x2, 2 is x4, 3 is x8, 4 is x16. 0 alerts on any OG.'
      },
      finishedPlots: {
        label: 'Plots slow to double',
        help: 'How long you are willing to wait for a plot to double. Slower plots get flagged: collect them to start the doubling over.',
        unit: 'h'
      },
      totalCrops: { label: 'Crops ready to collect', help: 'Alerts when your plots hold this many crops in total.' },
      missingPlots: { label: 'Empty plots' },
      beanTrade: { label: 'Bean trade value reached', help: 'Alerts when your bean trade reaches this value.' },
      exoticPurchases: { label: 'Exotic market purchases left' }
    }
  },
  'account.World 6.summoning': {
    label: 'Summoning',
    icon: 'data/ClassIcons59',
    options: {
      familiar: {
        label: 'Familiar upgrade below level',
        help: 'Alerts while the familiar upgrade is below this level and not maxed.'
      },
      battleAttempts: { label: 'Battle attempts left' }
    }
  },
  'account.World 6.etc': {
    label: 'Emperor',
    icon: 'data/Boss6',
    inline: 'emperor',
    options: {
      emperor: {
        label: 'Emperor attempts stacked',
        help: 'Alerts at this number, or at your attempt cap if it is lower.',
        unit: 'attempts'
      }
    }
  },

  // Account: World 7
  'account.World 7.royalGuardian': {
    label: 'Royal Guardian',
    icon: 'data/UISkillIcon226',
    options: {
      idleOutposts: {
        label: 'Outposts on an empty resource',
        help: 'Alerts when an outpost is connected to an empty resource and another in range still has some.',
        group: 'Outposts'
      },
      unwiredOutposts: {
        label: 'Outposts with nothing connected',
        help: 'Alerts when an outpost has no resource connected, and one is in range.',
        group: 'Outposts'
      },
      idleSupportCamps: {
        label: 'Support camps boosting nothing',
        help: 'Alerts when a support camp is not boosting any outpost.',
        group: 'Outposts'
      },
      unspentPts: {
        label: 'Unspent PTS per outpost',
        help: 'Alerts when a single outpost holds this many unspent PTS or more.',
        unit: 'PTS',
        group: 'Outposts'
      },
      claimableMaps: {
        label: 'Maps ready to claim',
        help: 'Alerts when a map has met its kill requirement and an outpost can be claimed.',
        group: 'Outposts'
      },
      idleUnits: {
        label: 'Units on claimed maps',
        help: 'Alerts when units are clearing a map you have already claimed, or are not assigned anywhere, while their world still has a map left to clear.',
        group: 'Units'
      },
      overkillWorkers: {
        label: 'Spare Workers',
        help: 'Alerts when an outpost has more Workers than it needs to empty its resource within this many hours. Workers only add collection rate, so the spare ones could be Traders or Surveyors and earn rank EXP instead.',
        unit: 'h',
        group: 'Units'
      },
      overkillBeforeReset: {
        label: 'Measure against the daily reset',
        help: 'Uses the time left until the daily reset instead of the hours above. A resource only restocks and gains a level if it is already empty when the reset lands. Falls back to the hours above if your save is older than the reset.',
        dependsOn: 'overkillWorkers',
        group: 'Units'
      },
      strandedWorkers: {
        label: 'Workers on empty resources',
        help: 'Alerts when every resource of an outpost is empty and nothing better is in range, while Workers are still assigned to it. Traders or Surveyors would earn rank EXP instead.',
        group: 'Units'
      },
      idleGuards: {
        label: 'Guards with unneeded range',
        help: 'Alerts when an outpost has Guards whose range it does not need, so they could be Traders or Surveyors. Also lists Guards that only reach an empty resource: swapping them drops that connection, so rewire it after the daily reset.',
        group: 'Units'
      },
      sharedNodes: {
        label: 'Resources shared by two outposts',
        help: 'Alerts when two outposts share a resource and one of them empties it within this many hours on its own, so the other spends a connection slot for nothing. Only when that outpost has another resource in range to move the slot to.',
        unit: 'h',
        group: 'Outposts'
      },
      tradeRank: {
        label: 'Trade rank reached',
        help: 'Alerts when an outpost reaches this Trade rank while Traders are still assigned to it, so you can move them elsewhere.',
        unit: 'Traders',
        group: 'Rank caps'
      },
      intelRank: {
        label: 'Intel rank reached',
        help: 'Alerts when an outpost reaches this Intel rank while Surveyors are still assigned to it, so you can move them elsewhere.',
        unit: 'Surveyors',
        group: 'Rank caps'
      },
      commandRank: {
        label: 'Command rank reached',
        help: 'Alerts when an outpost reaches this Command rank while Commanders are still sent to it, so you can move them elsewhere.',
        unit: 'Commanders',
        group: 'Rank caps'
      },
      militaryRank: {
        label: 'Military rank reached',
        help: 'Alerts when an outpost reaches this Military rank while Knights are still sent to it, so you can move them elsewhere.',
        unit: 'Knights',
        group: 'Rank caps'
      },
      purityRank: {
        label: 'Purity rank reached',
        help: 'Alerts when an outpost reaches this Purity rank while Priests are still sent to it, so you can move them elsewhere.',
        unit: 'Priests',
        group: 'Rank caps'
      },
      restockLocked: {
        label: 'Resource Replenish not bought',
        help: 'Alerts until you buy Resource Replenish in the armory, the one-time upgrade that refills empty resources every day.',
        group: 'Outposts'
      }
    }
  },
  'account.World 7.gallery': {
    label: 'Gallery',
    icon: 'data/GalleryPodiumA3',
    options: {
      trophiesMissing: { label: 'Owned trophies not on display' },
      nametagsMissing: { label: 'Owned nametags not on display' }
    }
  },
  'account.World 7.spelunking': {
    label: 'Spelunking',
    icon: 'etc/Spelunking',
    options: {
      pageReads: { label: 'Page reads left today' },
      fullStaminaCharacters: {
        label: 'Characters at full stamina',
        help: 'Alerts when at least this many characters have full stamina.',
        unit: 'characters'
      },
      overstimLevel: { label: 'Overstim level reached', help: 'Alerts when your Overstim level reaches this value.' }
    }
  },
  'account.World 7.legendTalents': {
    label: 'Legend talents',
    icon: 'data/LegendTalentIcon0',
    options: {
      pointsLeftToSpend: { label: 'Unspent legend talent points' },
      cheaperMasterclassUpgrades: { label: 'Cheaper masterclass upgrades left' }
    }
  },
  'account.World 7.zenithMarket': {
    label: 'Zenith market',
    icon: 'etc/Cluster',
    options: {
      doubleCluster: { label: 'Double Clusters affordable' },
      clusterFarming: {
        label: 'Alert when Cluster Farming is',
        help: 'On turns statues into clusters, off keeps levelling statues. Pick the state you want to be reminded about.'
      }
    }
  },
  'account.World 7.construction': {
    label: 'Jeweled cogs',
    icon: 'data/CogCry0',
    options: {
      jeweledCogs: { label: 'Jeweled cog pulls left' }
    }
  },
  'account.World 7.minehead': {
    label: 'Minehead',
    icon: 'data/MineHead0',
    options: {
      dailyTries: { label: 'Daily attempts left' },
      currencyUpgrades: {
        label: 'Affordable currency upgrades',
        help: 'Alerts when you can afford a ticked mine currency upgrade.'
      }
    }
  },
  'account.World 7.research': {
    label: 'Research',
    icon: 'data/ClassIcons61',
    options: {
      insightLevel: {
        label: 'Observation insight level reached',
        help: 'Alerts when a found observation reaches this insight level.'
      },
      observationRollsLeft: { label: 'Observation rolls left today' }
    }
  },
  'account.World 7.sushiStation': {
    label: 'Sushi station',
    icon: 'data/Sushi6',
    options: {
      fuelFull: { label: 'Fuel full' },
      shakerUses: { label: 'Shakers with uses left', help: 'Alerts when a ticked shaker has uses available.' },
      knowledgeLevelUp: { label: 'Sushi ready for a knowledge level up' }
    }
  },
  'account.World 7.jellyOperator': {
    label: 'Jelly operator',
    icon: 'data/JellyUnit0',
    options: {
      operationsLeft: { label: 'Operations left today' },
      slotsToBuy: { label: 'Slots you can unlock' },
      emptySlots: { label: 'Open slots with no cell' },
      virusesUnplaced: { label: 'Viruses you can place' }
    }
  },
  'account.World 7.clamWork': {
    label: 'Clam work',
    icon: 'data/ClamPearl0',
    options: {
      promotionAffordable: {
        label: 'Promotion affordable',
        help: 'Pearls are spent even when the promotion fails, and a successful one resets your pearls and every clam upgrade.'
      }
    }
  },
  'account.World 7.theButton': {
    label: 'The Button',
    icon: 'etc/ButtonG',
    options: {
      instaSkipAvailable: { label: 'Insta-skip available' },
      taskReady: { label: 'Task ready' }
    }
  },

  // Characters
  'characters.cards': {
    label: 'Cards',
    icon: 'data/CardSet0',
    options: {
      cardSet: {
        label: 'Wrong card set',
        help: 'Alerts on a fighting set while skilling, a skilling set while fighting, or the Blunder Hills set past level 50.'
      },
      passiveCards: { label: 'Passive card equipped' }
    }
  },
  'characters.anvil': {
    label: 'Anvil',
    icon: 'data/ClassIcons43',
    options: {
      unspentPoints: {
        label: 'Unspent anvil points',
        help: 'Alerts when a character has at least this many unspent points.',
        unit: 'points'
      },
      missingHammers: { label: 'Missing hammers' },
      anvilOverdue: {
        label: 'Production almost full',
        help: 'Alerts this many minutes before an anvil product is full.',
        unit: 'min'
      }
    }
  },
  'characters.worship': {
    label: 'Worship',
    icon: 'data/ClassIcons50',
    options: {
      unendingEnergy: {
        label: 'Unending Energy past 10 hours',
        help: 'Alerts when a character with the Unending Energy prayer has been AFK for more than 10 hours.'
      },
      chargeOverdue: { label: 'Worship charge full', help: 'Alerts within 5% of max charge.' }
    }
  },
  'characters.traps': {
    label: 'Traps',
    icon: 'data/TrapBoxSet1',
    options: {
      missingTraps: { label: 'Trap slot unused' },
      trapsOverdue: { label: 'Traps ready to collect' }
    }
  },
  'characters.quests': {
    label: 'Quests',
    icon: 'etc/Picnic_Stowaway',
    options: {
      picnicDaily: {
        label: 'Picnic Stowaway daily not done',
        help: 'Alerts when a character has not completed any Picnic Stowaway daily quest today.'
      }
    }
  },
  'characters.alchemy': {
    label: 'Alchemy',
    icon: 'data/aJarB0',
    options: {
      missingBubbles: { label: 'Active bubble slot empty' },
      noActivity: { label: 'No alchemy activity' }
    }
  },
  'characters.obols': {
    label: 'Obols',
    icon: 'data/ObolLocked1',
    options: {
      missingObols: { label: 'Empty obol slots' }
    }
  },
  'characters.postOffice': {
    label: 'Post office',
    icon: 'data/UIboxUpg0',
    inline: 'unspentPoints',
    options: {
      unspentPoints: {
        label: 'Unspent box points',
        help: 'Alerts when a character has more unspent points than this and a box is not maxed.',
        unit: 'points'
      }
    }
  },
  'characters.starSigns': {
    label: 'Star signs',
    icon: 'data/SignStar1b',
    options: {
      missingStarSigns: { label: 'Empty star sign slots', help: 'Stops once every star sign is infinite.' }
    }
  },
  'characters.crystalCountdown': {
    label: 'Crystal Countdown',
    icon: 'data/UISkillIcon41',
    options: {
      showMaxed: { label: 'Show maxed skills' },
      showNonMaxed: { label: 'Show skills not maxed yet' },
      skills: { label: 'Skills to track', help: 'Maestro only.' }
    }
  },
  'characters.tools': {
    label: 'Better tool available',
    icon: 'data/EquipmentTools1',
    options: {}
  },
  'characters.divinityStyle': {
    label: 'Divinity style',
    icon: 'etc/Div_Style_7',
    options: {}
  },
  'characters.talents': {
    label: 'Talents',
    icon: 'data/TalentBook1',
    options: {
      talents: {
        label: 'Cooldown talents ready',
        help: 'Alerts when a ticked talent is off cooldown.',
        // Talent ids from relevantTalents (parsers/talents.ts); the game draws a talent as UISkillIcon<id>.
        itemIcons: {
          printerGoBrrr: 'data/UISkillIcon32', refineryThrottle: 'data/UISkillIcon130', craniumCooking: 'data/UISkillIcon490',
          'itsYourBirthday!': 'data/UISkillIcon25', voidTrialRerun: 'data/UISkillIcon45', arenaSpirit: 'data/UISkillIcon370',
          tasteTest: 'data/UISkillIcon145'
        }
      },
      alwaysShowTalents: {
        label: 'Show talents still on cooldown',
        help: 'Shows every ticked talent with its countdown, not only the ready ones.',
        dependsOn: 'talents'
      },
      superTalentLeftToSpend: { label: 'Unspent super talent points' },
      unmaxedTalents: {
        label: 'Talents below max level',
        help: 'Alerts when a class talent still has talent points left to spend before its max level.'
      },
      libraryUpgradableTalents: {
        label: 'Talents the library can raise',
        help: 'Alerts when a maxed class talent could still be raised by a Talent Book Library book.'
      }
    }
  },
  'characters.equipment': {
    label: 'Equipment',
    icon: 'data/EquipmentTransparent1',
    options: {
      availableUpgradesSlots: { label: 'Items with upgrade slots left' },
      emptyGearSlots: {
        label: 'Empty gear slots',
        help: 'Only the first equipment page is checked. Tools, food and the second page are ignored.'
      }
    }
  },
  'characters.bags': {
    label: 'Carry bags',
    icon: 'data/MaxCapBagM13',
    options: {
      unmaxedBags: { label: 'Carry bags below max tier' }
    }
  },
  'characters.classSpecific': {
    label: 'Class form items',
    icon: 'data/EquipmentWandsArc0',
    options: {
      wrongItems: {
        label: 'Form items used outside form',
        help: 'Alerts when Arcanist or Tempest form items are equipped while the form is off.'
      },
      betterWeapon: {
        label: 'Better form weapon in inventory',
        help: 'Alerts when there is a better form weapon for your class in your inventory.'
      },
      betterRing: {
        label: 'Better form ring in inventory',
        help: 'Compares rings of the same type, counting only the ticked stats. Wind Walker rings roll a single stat and are always compared on it.'
      }
    }
  },

  // Timers: General
  'timers.General.daily': { label: 'Daily reset', icon: 'etc/Daily', options: {} },
  'timers.General.weekly': { label: 'Weekly reset', icon: 'etc/Weekly', options: {} },
  'timers.General.serverWeekly': { label: 'Server weekly reset', icon: 'etc/Server', options: {} },
  'timers.General.companions': { label: 'Next free companion', icon: 'afk_targets/Dog', options: {} },
  'timers.General.syphonCharge': { label: 'Charge Syphon overflow', icon: 'data/UISkillIcon475', options: {} },
  'timers.General.closestFullWorship': { label: 'Closest full worship', icon: 'data/WorshipSkull3', options: {} },
  'timers.General.dungeonHappyHour': { label: 'Dungeon happy hour', icon: 'etc/Happy_Hour', options: {} },
  'timers.General.randomEvents': { label: 'Next random event', icon: 'etc/Mega_Grumblo', options: {} },
  'timers.General.sailingTrades': { label: 'Next sailing trade', icon: 'etc/Blob_Trade', options: {} },

  // Timers: Other
  'timers.Etc.library': { label: 'Library books', icon: 'data/Libz', options: {} },
  'timers.Etc.minibosses': { label: 'Boss and miniboss respawns', icon: 'monsters/poopBig/static', options: {} },
  'timers.Etc.bonusTimeLeft': { label: 'Vote bonus week', icon: 'etc/VoteBallot', options: {} },
  'timers.Etc.meritocracyTimeLeft': { label: 'Meritocracy vote week', icon: 'etc/VoteBallot', options: {} },

  // Timers: Clickers
  'timers.Clickers.featherRestart': { label: 'Feather Restart', icon: 'etc/Owl_4', unit: 'Orion', options: {} },
  'timers.Clickers.megaFeatherRestart': { label: 'Mega Feather Restart', icon: 'etc/Owl_8', unit: 'Orion', options: {} },
  'timers.Clickers.fisherooReset': { label: 'Fisheroo Reset', icon: 'etc/KUpga_6', unit: 'Poppy', options: {} },
  'timers.Clickers.greatestCatch': { label: 'Greatest Catch', icon: 'etc/KUpga_11', unit: 'Poppy', options: {} },
  'timers.Clickers.megaFleshRestart': { label: 'Mega Flesh Restart', icon: 'etc/Bubbo_Upgrade_8', unit: 'Bubba', options: {} },
  'timers.Clickers.smokerMax': { label: 'Smoker at max quality', icon: 'data/BubbaSmokedmeat4', unit: 'Bubba', options: {} },

  // Timers: World 3
  'timers.World 3.printer': { label: 'Next printer cycle', icon: 'data/ConTower0', options: {} },
  'timers.World 3.closestTrap': { label: 'Closest trap', icon: 'data/TrapBoxSet1', options: {} },
  'timers.World 3.closestFlag': { label: 'Closest flag', icon: 'data/CogFLflag', options: {} },
  'timers.World 3.closestBuilding': { label: 'Closest building', icon: 'data/ConTower7', options: {} },
  'timers.World 3.closestSalt': {
    label: 'Closest salt',
    icon: 'data/TaskSc6',
    options: {
      salts: { label: 'Salts to include', help: 'Only the ticked salts are considered when picking the closest one.' }
    }
  },
  'timers.World 3.equinox': { label: 'Equinox bar full', icon: 'data/Quest78', options: {} },

  // Timers: World 5
  'timers.World 5.bravery': { label: 'Bravery monument', icon: 'etc/Bravery_Statue', options: {} },
  'timers.World 5.justice': { label: 'Justice monument', icon: 'data/Justice_Monument_x1', options: {} },
  'timers.World 5.wisdom': { label: 'Wisdom monument', icon: 'data/Wisdom_Monument_x1', options: {} },
  'timers.World 5.villagers': {
    label: 'Villager level ups',
    icon: 'etc/Villager_0',
    options: {
      villagers: {
        label: 'Villagers to show',
        itemIcons: { explore: 'etc/Villager_0', engineer: 'etc/Villager_1', bonuses: 'etc/Villager_2', measure: 'etc/Villager_3', studies: 'etc/Villager_4' }
      }
    }
  },
  'timers.World 5.coinFill': { label: 'Fountain coin bar', icon: 'data/HoleFountainBar0', options: {} },
  'timers.World 5.marbleFill': { label: 'Fountain marble bar', icon: 'data/HoleFountainBar1', options: {} },

  // Timers: World 6
  'timers.World 6.cropsReady': { label: 'Next crop fully grown', icon: 'data/FarmPlant6', options: {} },

  // Timers: World 7
  'timers.World 7.researchLevelUp': { label: 'Research level up', icon: 'data/ClassIcons61', options: {} },
  'timers.World 7.sushiFuelFull': { label: 'Sushi fuel full', icon: 'etc/Fuel', options: {} },
  'timers.World 7.observationInsight': { label: 'Observation insight level ups', icon: 'data/ResMagni1', options: {} },
  'timers.World 7.royalNodeCap': { label: 'Next outpost resource empty', icon: 'data/UISkillIcon226', options: {} },
  'timers.World 7.overstim': { label: 'Overstim level up', icon: 'data/CaveShopUpg6', options: {} }
};
