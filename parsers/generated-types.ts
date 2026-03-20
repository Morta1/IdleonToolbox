// Auto-generated
// Do not edit manually
//
// These types represent the PARSED output of serializeData / initializeCharacter,
// not the raw Firebase data (which is in IdleonData).

export interface Account {
  charactersLevels: {
      level: number;
      class: string;
    }[];
  accountCreateTime: number;
  companions: {
    totalBoxesOpened: number;
    currentCompanion: {
      name: string;
      rawName: string;
      effect: string;
      bonus: number;
      x: string;
      y: string;
      z: string;
      filler: string;
      tourPower: number;
    };
    list: {
        name: string;
        rawName: string;
        effect: string;
        bonus: number;
        x: string;
        y: string;
        z: string;
        filler: string;
        tourPower: number;
        acquired: boolean;
        copies: number;
        tradableCount: number;
        nonTradableCount: number;
      }[];
    lastFreeClaim: number;
    petCrystals: number;
    maxStorage: number;
  };
  bundles: {
      name: string;
      owned: boolean;
      price: number;
    }[];
  serverVars: Record<string, any>;
  accountOptions: (number | string)[];
  gemShopPurchases: number[];
  bribes: {
      name: string;
      desc: string;
      npc: string;
      price: number;
      effectName: string;
      value: number;
      done: boolean;
    }[];
  timeAway: {
    Arcade: number;
    GlobalTime: number;
    Player: number;
    Construction: number;
    Sailing: number;
    Printer: number;
    Cauldron: number;
    Cooking: number;
    DailyRewards: number;
    BookLib: number;
    Pets: number;
    ShopRestock: number;
    PostOfficeRefresh: number;
    Forge: number;
  };
  obols: {
    inventory: (string[])[];
    list: {
        displayName: string;
        rawName: string;
        shape: string;
        levelReq: number;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: number;
        UQ2txt: number | string;
        UQ2val: number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        Weapon_Power: number;
        SuperFunItemDisplayType?: string;
        changes: any[] | Record<string, any>[];
        rerolled: boolean;
      }[];
    stats: {
      STR: {
        familyBonus: number;
      };
      AGI: {
        familyBonus: number;
      };
      WIS: {
        familyBonus: number;
      };
      LUK: {
        familyBonus: number;
      };
      Defence: {
        familyBonus: number;
      };
      '%_DROP_RATE': {
        familyBonus: number;
      };
      Weapon_Power: {
        familyBonus: number;
      };
      '%_SKILL_EFFICIENCY': {
        familyBonus: number;
      };
      '%_ALL_STATS': {
        familyBonus: number;
      };
    };
  };
  looty: {
    slabItems: {
        name: string;
        rawName: string;
        obtained: boolean;
        unobtainable?: boolean;
      }[];
    lootyRaw: string[];
    lootedItems: number;
    missingItems: number;
    totalItems: number;
    rawLootedItems: number;
  };
  tasks: ((number[])[] | number[] | null)[];
  tasksDescriptions: ({
        name: string;
        description: string;
        filler1: string;
        x: string;
        filler2: string;
        breakpoints: string[];
        stat: number;
        level: number;
        meritReward: number;
      }[])[];
  meritsDescriptions: ({
        descLine1: string;
        descLine2: string;
        num1: number;
        num2: number;
        num3: number;
        totalLevels: number;
        meritCost: number | null;
        text1: string;
        text2: string;
        extraStr: string;
        icon: string;
        bonusPerLevel: number;
        level: number;
      }[])[];
  unlockedRecipes: number;
  taskUnlocks: {
    taskUnlocksList: ({
          unlocks: Record<string, any>[];
          unlocked: number;
        }[])[];
    unlockedRecipes: number;
    unlockPointsOwned: number;
    currentPoints: number;
    pointsReq: number;
  };
  postOfficeShipments: {
      index: number;
      totalShipments: number;
      streak: number;
      completedAnOrder: number;
      shield: number;
    }[];
  towers: {
    data: {
        index: number;
        desc: string;
        itemReq: Record<string, any>[];
        maxLevel: number;
        bonusInc: number;
        costInc: number[];
        name: string;
        level: number;
        nextLevel: boolean;
        progress: number;
        inProgress: boolean;
        slot: number;
      }[];
    buildMultiplier: string[];
    wizardOverLevels: number;
    totalLevels: number;
    totalWaves: number;
    towersTwo: number;
  };
  achievements: {
      name: string;
      rawName: string;
      quantity: number;
      desc: string;
      rewards: string[];
      misc: string;
      visualIndex: number;
      steamExclusive: boolean;
      secretAchievement: boolean;
      steamIndex?: number;
      completed: boolean;
      currentQuantity?: number;
    }[];
  rift: {
    list: {
        monsterName: string;
        task: string;
        icon: string;
        riftBonus?: string;
        riftBonusIcon?: string;
        riftDescription?: string;
      }[];
    currentRift: number;
    currentProgress: number;
    chars: string;
  };
  weeklyBossesRaw: Record<string, number>;
  constellations: {
      mapIndex: number;
      requiredPlayers: number;
      points: number;
      name: string;
      requirement: string;
      location: string;
      completedChars: string;
      done: boolean;
    }[];
  rawConstellationsDone: number;
  shopStock: ({
        amount: number;
        name: string;
        rawName: string;
        shopName: string;
      }[])[];
  traps: ({
        name: string;
        rawName: string;
        crittersQuantity: number;
        trapType: number;
        trapExp: number;
        timeLeft: number;
        trapData: {
          trapTime: number;
          quantity: number;
          exp: number;
          trapType: number;
        };
      }[])[];
  totems: {
      monsterRawName: string;
      monsterName: string;
      minEfficiency: number;
      skillReq: number;
      chargeReq: number;
      name?: string;
      maxWave: number;
      waveMulti: number;
      expReward: number;
      map: string;
    }[];
  adviceFish: {
    upgrades: {
        level: number;
        cost: number;
        bonus: number;
        name: string;
        description: string;
        x2: number;
        x3: number;
        filler: string;
      }[];
  };
  guild: {
    guildBonuses: {
        name: string;
        xPos: number;
        yPos: number;
        bonus: string;
        x1: number;
        x2: number;
        func: string;
        maxLevel: number;
        reqIndex: number;
        reqLevel: number;
        gpBaseCost: number;
        gpIncrease: number;
        level: number;
      }[];
    guildTasks: {
      daily: {
          task: string;
          requirement: number;
          gp: number;
          progress: number;
        }[];
      weekly: {
          task: string;
          requirement: number;
          gp: number;
          progress: number;
        }[];
    };
    members: {
        name: string;
        level: number;
        gpEarned: number;
        wantedBonus: {
          name: string;
          xPos: number;
          yPos: number;
          bonus: string;
          x1: number;
          x2: number;
          func: string;
          maxLevel: number;
          reqIndex: number;
          reqLevel: number;
          gpBaseCost: number;
          gpIncrease: number;
          level: number;
        } | number;
        rank: number;
      }[];
    maxMembers: number;
    level: number;
    levelReq: number;
    totalGp: number;
  };
  talentPoints: number[];
  tournamentServerData: null;
  alchemy: {
    p2w: {
      cauldrons: {
          name: string;
          speed: Record<string, any>;
          newBubble: Record<string, any>;
          boostReq: Record<string, any>;
        }[];
      liquids: {
          name: string;
          regen: Record<string, any>;
          capacity: Record<string, any>;
          players: Record<string, any>[] | any[];
        }[];
      vials: {
        attempts: number;
        rng: number;
      };
      player: {
        speedLv: number;
        speed: number;
        extraExpLv: number;
        extraExp: number;
      };
      sigils: {
          name: string;
          unlockCost: number;
          boostCost: number;
          jadeCost: number;
          unlockBonus: number;
          boostBonus: number;
          jadeBonus: number;
          etherealCost: number;
          etherealBonus: number;
          eclecticCost: number;
          eclecticBonus: number;
          filler: string;
          effect: string;
          unlocked: number;
          progress: number;
          bonus: number;
          characters: any[];
          index: number;
        }[];
      totalEtherealSigils: number;
      totalEclecticSigils: number;
      vialsAttempts: {
        current: number;
        max: number;
      };
    };
    bubbles: {
      power: {
          level: number;
          index: number;
          rawName: string;
          bubbleIndex: string;
          bubbleName: string;
          x1: number;
          x2: number;
          func: string;
          desc: string;
          stat: string;
          cauldron: string;
          itemReq: Record<string, any>[];
        }[];
      quicc: {
          level: number;
          index: number;
          rawName: string;
          bubbleIndex: string;
          bubbleName: string;
          x1: number;
          x2: number;
          func: string;
          desc: string;
          stat: string;
          cauldron: string;
          itemReq: Record<string, any>[];
        }[];
      'high-iq': {
          level: number;
          index: number;
          rawName: string;
          bubbleIndex: string;
          bubbleName: string;
          x1: number;
          x2: number;
          func: string;
          desc: string;
          stat: string;
          cauldron: string;
          itemReq: Record<string, any>[];
        }[];
      kazam: {
          level: number;
          index: number;
          rawName: string;
          bubbleIndex: string;
          bubbleName: string;
          x1: number;
          x2: number;
          func: string;
          desc: string;
          stat: string;
          cauldron: string;
          itemReq: Record<string, any>[];
        }[];
    };
    bubblesFlat: {
        level: number;
        index: number;
        rawName: string;
        bubbleIndex: string;
        bubbleName: string;
        x1: number;
        x2: number;
        func: string;
        desc: string;
        stat: string;
        cauldron: string;
        itemReq: Record<string, any>[];
      }[];
    vials: {
        name: string;
        mainItem: string;
        desc: string;
        func: string;
        stat: string;
        x1: number;
        x2: number;
        itemReq: Record<string, any>[];
        level: number;
        multiplier: number;
      }[];
    cauldrons: {
      power: {
        progress: number;
        req: number;
        players: any[];
        boosts: {
          speed: Record<string, any>;
          luck: Record<string, any>;
          cost: Record<string, any>;
          extra: Record<string, any>;
        };
      };
      quicc: {
        progress: number;
        req: number;
        players: any[];
        boosts: {
          speed: Record<string, any>;
          luck: Record<string, any>;
          cost: Record<string, any>;
          extra: Record<string, any>;
        };
      };
      'high-iq': {
        progress: number;
        req: number;
        players: any[];
        boosts: {
          speed: Record<string, any>;
          luck: Record<string, any>;
          cost: Record<string, any>;
          extra: Record<string, any>;
        };
      };
      kazam: {
        progress: number;
        req: number;
        players: any[];
        boosts: {
          speed: Record<string, any>;
          luck: Record<string, any>;
          cost: Record<string, any>;
          extra: Record<string, any>;
        };
      };
    };
    cauldronsInfo: (number[])[];
    multiplierArray: number[];
    liquids: number[];
    activities: {
        activity: number;
        index: number;
      }[];
    totalBubbleLevelsTill100: number;
    prismaFragments: number;
    prismaBubbles: string;
    liquidCauldrons: {
        isDragonic: boolean;
        maxLiquid: number;
        maxLiquidBreakdown: Record<string, any>[];
        decantCap: {
          level: number;
          progress: number;
          req: number;
        };
        decantRate: {
          level: number;
          progress: number;
          req: number;
        };
      }[];
  };
  armorSmithy: {
    sets: {
        setName: string;
        armors: string[];
        tools: string[] | any[];
        weapons: any[] | string[];
        requiredTools: number;
        requiredWeapon: number;
        bonusValue: number;
        description: string;
        description2: string;
        unlocked: boolean;
      }[];
    days: number;
    smithyUnlocked: number;
    unlockedSets: string[];
    isSmithyUnlocked: boolean;
  };
  equippedBubbles: ({
        level: number;
        index: number;
        rawName: string;
        bubbleIndex: string;
        bubbleName: string;
        x1: number;
        x2: number;
        func: string;
        desc: string;
        stat: string;
        cauldron: string;
        itemReq: Record<string, any>[];
      }[])[];
  storage: {
    list: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number | string;
        common: string;
        desc_line1?: string;
        desc_line2?: string;
        desc_line3?: string;
        desc_line4?: string;
        desc_line5?: string;
        desc_line6?: string;
        desc_line7?: string;
        desc_line8?: string;
        Effect?: string;
        Amount?: number;
        Trigger?: number;
        Cooldown?: number;
        consumable?: string;
        itemType: string;
        rawName: string;
        maxUpgradeSlots: number;
        owner: string;
        name: string;
        type: string;
        subType: string;
        amount: number;
        misc: string;
        description: string;
        lvReqToEquip?: number;
        Class?: string;
        Speed?: number;
        Reach?: number;
        Weapon_Power?: number;
        STR?: number;
        AGI?: number;
        WIS?: number;
        LUK?: number;
        Defence?: number;
        UQ1txt?: string;
        UQ1val?: number;
        UQ2txt?: string;
        UQ2val?: number;
        Upgrade_Slots_Left?: number;
        equip?: string;
        Power?: number;
        changes?: Record<string, any>[];
      }[];
    slots: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: number;
        categories: Record<string, any>[];
      };
    };
    storageChests: {
        rawName: string;
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: number;
        UQ1val: number;
        UQ2txt: number;
        UQ2val: number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        capacity: number;
        amount: number;
        unlocked: boolean;
      }[];
  };
  saltLick: {
      name: string;
      rawName: string;
      desc: string;
      baseCost: number;
      increment: number;
      baseBonus: number;
      maxLevel: number;
      totalAmount: number;
      level: number;
    }[];
  dungeons: {
    upgrades: {
        effect: string;
        x1: number;
        x2: number;
        func: string;
        bonusName: string;
        type: string;
        level: number;
      }[];
    insideUpgrades: {
        effect: string;
        x1: number;
        x2: number;
        func: string;
        bonusName: string;
        type: string;
        level: number;
      }[];
    credits: number;
    flurbos: number;
    boostedRuns: number;
    progress: number;
    rankReq: string;
    rank: number;
    rngItems: {
        name: string;
        bonus: string;
        increment: number;
        rarity: string;
        desc: string;
        levelText: string;
        baseValue: number;
        maxLevel: number;
        level: number;
      }[];
    statBoosts: {
        section: string;
        levelReq: number;
        bonuses: Record<string, any>[];
      }[];
  };
  prayers: {
      name: string;
      effect: string;
      curse: string;
      id: number;
      x1: number;
      x2: number;
      prayerIndex: number;
      soul: string;
      maxLevel: number;
      unlockZone: string;
      costMulti: number;
      unlockWave: number;
      totalAmount: number;
      level: number;
    }[];
  cards: Record<string, {
      rawName: string;
      displayName: string;
      cardIndex: string;
      visualIndex: number;
      effect: string;
      bonus: number;
      perTier: number;
      category: string;
      amount: number;
      stars: number;
      nextLevelReq: number;
    }>;
  currencies: {
    candies: {
      guaranteed: number;
      special: {
        min: number;
        max: number;
      };
    };
    WorldTeleports: number;
    KeysAll: {
        amount: number;
        name: string;
        rawName: string;
        amountPerDay: number;
        daysSincePickup?: number;
        totalAmount: number | null;
      }[];
    ColosseumTickets: {
      allTickets: {
          rawName: string;
          amountPerDay: number;
          daysSincePickup: number;
          amount: number;
          totalAmount: number;
        }[];
      totalAmount: number;
    };
    ObolFragments: number;
    SilverPens: number;
    GoldPens: number;
    DeliveryBoxComplete: number;
    DeliveryBoxStreak: number;
    DeliveryBoxMisc: number;
    minigamePlays: number;
    rawMoney: number;
    money: (number[])[];
    gems: number;
    penPals: number;
  };
  stamps: {
    combat: {
        displayName: string;
        rawName: string;
        func: string;
        x1: number;
        x2: number;
        reqItemMultiplicationLevel: number;
        baseMatCost: number;
        baseCoinCost: number;
        powCoinBase: number;
        powMatBase: number;
        skillIndex: number;
        effect: string;
        placeholderEffect: string;
        stat: string;
        itemReq: {
          name: string;
          rawName: string;
        };
        level: number;
        maxLevel: number;
        materials: any[];
        ownedMats: number;
        greenStackOwnedMats: number;
        category: string;
        multiplier: number;
        bestCharacter: {
          capacityPerSlot: number;
          maxCapacity: number;
          character: string;
          skillsInfoArray: Record<string, any>[];
        };
        goldCost: number;
        materialCost: number;
        enoughPlayerStorage: boolean;
        greenStackHasMaterials: boolean;
        hasMaterials: boolean;
        hasMoney: boolean;
        futureCosts: Record<string, any>[];
      }[];
    skills: {
        displayName: string;
        rawName: string;
        func: string;
        x1: number;
        x2: number;
        reqItemMultiplicationLevel: number;
        baseMatCost: number;
        baseCoinCost: number;
        powCoinBase: number;
        powMatBase: number;
        skillIndex: number;
        effect: string;
        placeholderEffect: string;
        stat: string;
        itemReq: {
          name: string;
          rawName: string;
        };
        level: number;
        maxLevel: number;
        materials: any[];
        ownedMats: number;
        greenStackOwnedMats: number;
        category: string;
        multiplier: number;
        bestCharacter: {
          capacityPerSlot: number;
          maxCapacity: number;
          character: string;
          skillsInfoArray: Record<string, any>[];
        };
        goldCost: number;
        materialCost: number;
        enoughPlayerStorage: boolean;
        greenStackHasMaterials: boolean;
        hasMaterials: boolean;
        hasMoney: boolean;
        futureCosts: Record<string, any>[];
      }[];
    misc: {
        displayName: string;
        rawName: string;
        func: string;
        x1: number;
        x2: number;
        reqItemMultiplicationLevel: number;
        baseMatCost: number;
        baseCoinCost: number;
        powCoinBase: number;
        powMatBase: number;
        skillIndex: number;
        effect: string;
        placeholderEffect: string;
        stat: string;
        itemReq: {
          name: string;
          rawName: string;
        };
        level: number;
        maxLevel: number;
        materials: any[];
        ownedMats: number;
        greenStackOwnedMats: number;
        category: string;
        bestCharacter: {
          capacityPerSlot: number;
          maxCapacity: number;
          character: string;
          skillsInfoArray: Record<string, any>[];
        };
        goldCost: number;
        materialCost: number | null;
        enoughPlayerStorage: boolean;
        greenStackHasMaterials: boolean;
        hasMaterials: boolean;
        hasMoney: boolean;
        futureCosts: Record<string, any>[];
      }[];
  };
  breeding: {
    rawFencePets: ((string | number)[])[];
    eggsPowerRange: {
        minPower: number;
        maxPower: number;
      }[];
    passivesTotals: Record<string, number>;
    storedPets: {
        name: string;
        level: string | number;
        power: number;
      }[];
    eggs: number[];
    genetics: number[];
    deadCells: number;
    speciesUnlocks: number[];
    fencePets: {
        monsterName: string;
        monsterRawName: string;
        passiveIndex: string;
        passive: string;
        icon: string;
        baseValue: number;
        gene: {
          name: string;
          abilityType: number;
          combatAbility: string;
          bonusAbility: string;
          index: number;
        };
        world: string;
        level: number;
        shinyLevel: number;
        shinyProgress: number;
        breedingProgress: number;
        shinyGoal: number;
        rawPassive: string;
        passiveValue: number;
        unlocked: boolean;
      }[];
    fencePetsObject: {
      mushG: {
        amount: number;
        shiny: number;
        breedability: number;
      };
    };
    maxArenaLevel: number;
    timeToNextEgg: number;
    petUpgrades: {
        name: string;
        filler: string;
        material: string;
        foodIndex: null | number;
        baseMatCost: number;
        costMatScale: number;
        baseCost: number;
        costScale: number;
        maxLevel: number;
        description: string;
        boostEffect: string;
        bonusQuantity: number;
        upgradeIndex: number;
        level: number;
      }[];
    arenaBonuses: {
        bonus: string;
        wave: number;
      }[];
    unlockedBreedingMulti: {
      second: boolean;
      third: boolean;
      fourth: boolean;
      fifth: boolean;
    };
    pets: ({
          monsterName: string;
          monsterRawName: string;
          passiveIndex: string;
          passive: string;
          icon: string;
          baseValue: number;
          gene: Record<string, any>;
          world: string;
          level: number;
          shinyLevel: number;
          shinyProgress: number;
          breedingProgress: number;
          shinyGoal: number;
          rawPassive: string;
          passiveValue: number;
          unlocked: boolean;
          breedingLevel: number;
          breedingGoal: number;
          breedingMultipliers: Record<string, any>;
        }[])[];
    territories: {
        territoryName: string;
        background: string;
        powerReq: number;
        fightPower: number;
        enemyAttack: number;
        battleName: string;
        f1: string;
        f2: string;
        f3: string;
        enemies: Record<string, any>[];
        team: Record<string, any>[];
        forageSpeed: number;
        reqProgress: number;
        currentProgress: number;
      }[];
    foragingRounds: number[];
    currentProgress: number[];
    totalShinyLevels: number;
    totalBreedabilityLv: number;
  };
  cooking: {
    meals: {
        index: number;
        level: number;
        amount: number;
        shinyMulti: number;
        levelCost: number;
        name: string;
        cookReq: number;
        rawName: string;
        baseStat: number;
        effect: string;
        description: string;
        stat: string;
        multiplier: number;
      }[];
    spices: {
      toClaim: {
          progress: number;
          amount: number;
          rawName: string;
          name: string;
        }[];
      available: {
          amount: number;
          toClaim: number;
          rawName: string;
          name: string;
        }[];
      numberOfClaims: number;
    };
    mealMaxLevel: number;
    kitchens: {
        status: number;
        meal: {
          name: string;
          cookReq: number;
          rawName: string;
          baseStat: number;
          effect: string;
          description: string;
          stat: string;
          index: number;
          level: number;
          amount: number;
          shinyMulti: number;
          levelCost: number;
          multiplier: number;
        };
        luckLv: number;
        fireLv: number;
        speedLv: number;
        currentProgress?: number;
        mealSpeed: number;
        mealSpeedBreakdown: {
          statName: string;
          totalValue: string;
          categories: Record<string, any>[];
        };
        mealLuck: number;
        fireSpeed: number;
        fireSpeedBreakdown: {
          statName: string;
          totalValue: string;
          categories: Record<string, any>[];
        };
        speedCost: number;
        fireCost: number;
        luckCost: number;
      }[];
  };
  divinity: {
    linkedDeities: number[];
    linkedStyles: number[];
    deities: {
        name: string;
        majorBonus: string;
        minorBonus: string;
        blessing: string;
        minorBonusMultiplier: number;
        godIndex: string;
        blessingMultiplier: number;
        x4: number;
        x5: number;
        x7: null;
        x8: number;
        x9: number;
        x10: number;
        x11: number;
        x12: number;
        rawName: string;
        level: number;
        blessingBonus: number;
        unlocked: boolean;
        maxLevel: number;
        cost: {
          cost: string;
        };
      }[];
    blessingLevels: number[];
    unlockedDeities: number;
    godRank: number;
  };
  sneaking: {
    totalNinjaUpgradeLevels: number;
    sneakingExpThing: number;
    jadeEmporium: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        filler1: string;
        filler2: string;
        description: string;
        originalIndex: number;
        index: number;
        unlocked: boolean;
        cost: number;
      }[];
    jadeCoins: number;
    upgrades: {
        x0: number;
        x1: number;
        x2: number;
        x3: number;
        name: string;
        modifier: number;
        description: string;
        x7: number;
        x8: number;
        x9: number;
        x10: number;
        x11: number;
        level: number;
        value: number;
        isUnlocked: boolean;
        isSpecialUpgrade: boolean;
        prerequisiteIndex: number | null;
        unlockOrder: null | number;
        position: {
          locked: Record<string, any>;
          unlocked: Record<string, any>;
        };
        size: {
          width: number;
          height: number;
        };
      }[];
    characterEquipments: ({
          rawName: string;
          type: number;
          subType: number;
          name: string;
          description: string;
          filler?: string;
          level: number;
          symbolBonus: number;
          symbolLevel: number;
          value: number | null;
          x3?: number;
          x5?: number;
        }[])[];
    inventory: {
        rawName: string;
        type: number;
        subType: number;
        x3: number;
        x5: number;
        name: string;
        description: string;
        level: number;
        symbolBonus: number;
        symbolLevel: number;
        value: number;
      }[];
    players: {
        equipment: Record<string, any>[];
        floor: number;
        activityInfo: number;
      }[];
    pristineCharms: {
        x1: number;
        x2: number;
        name: string;
        x3: number;
        description: string;
        bonus: string;
        unlocked: number;
        value: number;
        baseValue: number;
      }[];
    dropList: ({
          rawName: string;
          type: number;
          subType: number;
          name: string;
          description: string;
          filler?: string;
          dropChance: string;
          x3?: number;
          x5?: number;
        }[])[];
    doorsCurrentHp: number[];
    beanstalkData: number[];
    totalJadeEmporiumUnlocked: number;
    unlockedFloors: number;
    gemStones: {
        rawName: string;
        type: number;
        subType: number;
        x3: number;
        x5: number;
        name: string;
        description: string;
        unlocked: string;
        baseValue: number;
        bonus: number;
        notatedBonus: string;
      }[];
    lastLooted: number;
    ninjaMasteryBonuses: {
        index: number;
        description: string;
        bonus?: string;
      }[];
    ninjaMastery: number;
    itemsMaxLevel: {
        name: string;
        value: number;
      }[];
    dailyCharmRollCount: number;
  };
  farming: {
    plot: {
        seed: {
          name: string;
          seedId: number;
          cropIdMin: number;
          cropIdMax: number;
          lvlReq: number;
          nextCropChance: number;
          nextCropDecay: number;
        };
        index: number;
        rank: number;
        rankProgress: number;
        rankRequirement: number;
        seedType: number;
        baseCropType: number;
        cropType: number;
        cropQuantity: number;
        cropProgress: number;
        progress: number;
        growthReq: number;
        isLocked: number;
        currentOG: number;
        cropRawName: string;
        seedRawName: string;
        nextOGChance: number;
        growthRate: number;
        ogMulti: number;
        timeLeft: number;
        maxTimeLeft: number;
      }[];
    crop: Record<string, number>;
    market: {
        name: string;
        bonus: string;
        cropId: number;
        cropIdIncrement: number;
        cost: number;
        costExponent: number;
        cropReq: number;
        maxLvl: number;
        bonusPerLvl: number;
        level: number;
        type: number;
        nextUpgrades: any[] | Record<string, any>[];
        costToMax: number;
        baseValue: number;
        value: number;
      }[];
    exoticMarket: {
        name: string;
        bonus: string;
        x2: number;
        baseValue: number;
        type: number;
        x5: number;
        level: number;
        value: number;
        maxValue: number;
        percentOfCap: number;
        isCapped: boolean;
        thresholdLevel: number;
        thresholdMissingLevels: number;
        isAvailableThisWeek: boolean;
        displayText: string;
      }[];
    totalExoticLevels: number;
    cropsFound: number;
    cropsOnVine: number;
    instaGrow: number;
    beanTrade: number;
    ranks: {
        name: string;
        description: string;
        bonus: number;
        upgradeLevel: number;
        unlockAt: string;
      }[];
    totalPoints: number;
    usedPoints: number;
    hasLandRank: number;
    totalRanks: number;
    exoticMarkeMaxPurchases: number;
    pctExoticPurchasesFree: number;
    exoticMarketUpgradesPurchased: number;
    cropDepot: {
      damage: {
        name: string;
        value: number;
      };
      gamingEvo: {
        name: string;
        value: number;
      };
      jadeCoin: {
        name: string;
        value: number;
      };
      cookingSpeed: {
        name: string;
        value: number;
      };
      cash: {
        name: string;
        value: number;
      };
      shiny: {
        name: string;
        value: number;
      };
      critters: {
        name: string;
        value: number;
      };
      dropRate: {
        name: string;
        value: number;
      };
      spelunky: {
        name: string;
        value: number;
      };
      researchExp: {
        name: string;
        value: number;
      };
    };
    maxTimes: {
        value: number;
        breakdown: Record<string, any>[];
      }[];
    stickers: {
        name: string;
        description: string;
        count: number;
        bonus: number;
        odds: number;
        baseBonus: number;
      }[];
    totalStickers: number;
    dmgMulti: number;
    stickersUnlocked: number;
  };
  summoning: {
    upgrades: Record<string, any>;
    winnerBonuses: {
        bonusId: number;
        bonus: string;
        value: number;
        baseValue: number;
      }[];
    essences: number[];
    totalUpgradesLevels: number;
    familiarsOwned: number;
    allBattles: ({
          enemyId: string;
          xOff: number;
          yOff: number;
          width: number;
          territoryName: string;
          bonusId: number;
          bonus: Record<string, any>;
          bonusQty: number;
          difficulty: number;
          won: boolean;
          icon: string;
        }[])[];
    armyHealth: number;
    armyDamage: number;
    summoningStuff: number[];
    highestEndlessLevel: number;
    totalWins: number;
    summoningStones: {
        name: string;
        monsterIcon: string;
        stoneName: string;
        kills: number;
        index: number;
        bonus: string;
        bossHp: number;
        nextLevelHps: number[];
        mapName: string;
        mapMonsterName: string;
        mapMonsterIcon: string;
      }[];
    totalSummoningStonesKills: number;
  };
  statues: {
      index: number;
      name: string;
      effect: string;
      dk: number;
      bonus: number;
      rawName: string;
      level: number;
      progress: number;
      onyxStatue: boolean;
      zenithStatue: boolean;
      statueIndex: number;
      talentMulti: number;
      onyxMulti: number;
      zenithMulti: number;
      eventBonusMulti: number;
      meritocracyMulti: number;
      dragonMulti: number;
      upgradeVaultMulti: number;
    }[];
  hole: {
    villagers: {
        index: number;
        name: string;
        exp: string;
        expReq: string;
        readyToLevel: boolean;
        level: number;
        opalInvested: number;
        expRate: {
          value: number;
          breakdown: Record<string, any>;
        };
        timeLeft: number;
      }[];
    unlockedCaverns: number;
    charactersCavernLocation: number[];
    engineerBonuses: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number | string;
        description: string;
        unlocked: number;
        index: string;
        totalBonus: number;
        owned: number;
        cost: number;
      }[];
    unlockedSchematics: number;
    caverns: {
      theWell: {
        rockLayerIndex: number;
        sediments: (null | Record<string, any>)[];
        buckets: number[];
        fillRate: number;
        opalCost: string;
        expandWhenFull: number;
      };
      motherlode: {
        miningEff: string;
        layer: number;
        ores: {
          mined: string;
          required: string;
          maxed: boolean;
        };
      };
      theDen: {
        bestScore: string;
        nextOpalAt: number;
        ampMulti: number;
        amplifiers: Record<string, any>[];
        ownedAmps: number;
      };
      bravery: {
        damage: {
          min: number;
          max: number;
        };
        ownedSwords: number;
        maxRethrow: number;
        maxRetelling: number;
        opalChance: number;
        hps: Record<string, any>[];
        bonuses: Record<string, any>[];
        hours: number;
        timeForNextFight: number;
        rewardMulti: number;
        afkPercent: {
          value: number;
          breakdown: Record<string, any>;
          expression: string;
        };
        monumentAfkReq: null;
      };
      theBell: {
        bellMethodsOwned: number;
        newMethodChance: number;
        bells: Record<string, any>[];
        improvementMethods: Record<string, any>[];
        bellBonuses: Record<string, any>[];
        rings: number;
        pings: number;
      };
      theHarp: {
        stringSlots: number;
        stringTypes: number;
        newNoteCost: number;
        powerRate: number;
        power: number;
        harpExpGain: number;
        chords: Record<string, any>[];
        opalChance: number;
        notes: number[];
      };
      theLamp: {
        wishes: Record<string, any>[];
        wishPerDay: number;
        currentWishes: number;
      };
      theHive: {
        fishingEff: string;
        layer: number;
        bugs: {
          mined: string;
          required: string;
          maxed: boolean;
        };
      };
      grotto: {
        monarchHp: number;
        mushroomKillsLeft: number;
        mushroomKills: number;
        mushroomKillsReq: number;
        layer: number;
      };
      justice: {
        rewardMulti: number;
        hours: number;
        hoursRewards: string[];
        hoursBreakpoints: Record<string, any>[];
        bonuses: Record<string, any>[];
        timeForNextFight: number;
        coins: number;
        health: number;
        popularity: number;
        dismissals: number;
        opalChance: number;
        monumentAfkReq: null;
      };
      theJars: {
        unlockedSlots: number;
        opalChance: number;
        newJarCost: number;
        rupieValue: {
          value: number;
          breakdown: Record<string, any>;
        };
        jarAesthetic: number;
        activeSlots: Record<string, any>[];
        rupies: number[];
        perHour: number;
        jars: Record<string, any>[];
        totalJars: number;
        collectibles: Record<string, any>[];
      };
      evertree: {
        choppingEff: string;
        layer: number;
        logs: {
          chopped: string;
          required: string;
          maxed: boolean;
        };
      };
      wisdom: {
        rewardMulti: number;
        hours: number;
        hoursRewards: string[];
        hoursBreakpoints: Record<string, any>[];
        bonuses: Record<string, any>[];
        timeForNextFight: number;
        opalChance: number;
        afkPercent: {
          value: number;
          breakdown: Record<string, any>;
          expression: string;
        };
        attempts: number;
        attemptsGainPerRound: number;
        timePerMatch: number;
        instantMatches: number;
        monumentAfkReq: null;
      };
      gambit: {
        pointsMulti: number;
        basePoints: number;
        points: number;
        bonuses: Record<string, any>[];
        times: number[];
        totalTime: number;
        summoningDoublers: {
          appointed: number;
          total: number;
        };
      };
      theTemple: {
        bonuses: Record<string, any>[];
        layer: number;
        torches: number;
      };
    };
    totalResources: number;
    totalLayerResources: number;
    totalOpalsFound: number;
    totalVillagersLevels: number;
    holesObject: {
      charactersCavernLocation: number[];
      villagersLevels: number[];
      villagersExp: number[];
      opalsInvested: number[];
      holeMajiks: number[];
      villageMajiks: number[];
      idleonMajiks: number[];
      opalsPerCavern: number[];
      sedimentMulti: number[];
      wellSediment: number[];
      wellBuckets: number[];
      extraCalculations: number[];
      dawgDenAmplifierLevels: number[];
      engineerSchematics: number[];
      braveryMonument: number[];
      braveryBonuses: number[];
      bellImprovementMethods: number[];
      bellRingLevels: number[];
      bellRelated: number[];
      harpRelated: number[];
      wishesUsed: number[];
      measurementBuffLevels: number[];
      parallelVillagersGemShop: number[];
      jarStuff: number[];
      jarProgress: number[];
      studyStuff: number[];
      studyProgress: number[];
      gambitStuff: number[];
    };
    majiks: ({
          x0: number;
          x1: number;
          name: string;
          description: string;
          level: number;
          maxLevel: number;
          bonus: number;
          godsLinks: any[];
          hasDoot: boolean;
        }[])[];
    cosmoSchematics: number;
    godsLinks: any[];
    measurements: {
        description: string;
        baseBonus: number;
        totalBonus: number;
        multi: number;
        level: number;
        cost: number;
        owned: number;
        icon: string;
        measuredBy: {
          label: string;
          value: number;
        };
        measureIndex: number;
      }[];
    studies: {
      studyPerHour: number;
      studies: {
          name: string;
          description: string;
          listIndex: number;
          active: boolean;
          peripheralVisionActive: boolean;
          progress: number;
          req: number;
          location: string;
          bonus: number;
          level: number;
          readyToLevel: boolean;
        }[];
    };
    leastOpalInvestedVillager: number;
  };
  lab: {
    playersCords: {
        x: number;
        y: number;
        playerId: number;
        playerName: string;
        class: string;
        lineWidth: number;
        soupedUp: boolean;
      }[];
    playersChips: (({
          index: number;
          name: string;
          bonus: string;
          bool1: string;
          stat: string;
          baseVal: number;
          requirements: Record<string, any>[];
          description: string;
          extraDescription: string;
          rawName: string;
          chipIndex: number;
        } | number)[])[];
    connectedPlayers: {
        playerId: number;
        name: string;
        x: number;
        y: number;
        lineWidth: number;
      }[];
    jewels: {
        index: number;
        name: string;
        bonus: number;
        x: number;
        y: number;
        range: number;
        requirements: Record<string, any>[];
        effect: string;
        description: string;
        acquired: boolean;
        rawName: string;
        active: boolean;
        multiplier: number;
      }[];
    chips: {
        index: number;
        name: string;
        bonus: string;
        bool1: string;
        stat: string;
        baseVal: number;
        requirements: Record<string, any>[];
        description: string;
        extraDescription: string;
        rawName: string;
        repoAmount: number;
        amount: number;
      }[];
    labBonuses: {
        index: number;
        x: number;
        y: number;
        range: number;
        bonusOn: number;
        bonusOff: number;
        name: string;
        description: string;
        active?: boolean;
        extraData?: number | string;
        bonusDesc?: number;
      }[];
    totalRawChips: number;
    currentRotation: number[];
  };
  shrines: {
      mapId: number;
      shrineLevel: number;
      name: string;
      rawName: string;
      bonus: number;
      progress: number;
      desc: string;
      worldTour: boolean;
      crystalShrineBonus: number;
      shrineTowerValue: number;
    }[];
  zenith: {
    market: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        description: string;
        bonus: number;
        cost: number;
        level: number;
        costToMax: number;
      }[];
    clusters: number;
  };
  arcade: {
    shop: {
        effect: string;
        x1: number;
        x2: number;
        func: string;
        bonusName: string;
        level: number;
        active: boolean;
        rotationIndex: number;
        bonus: number;
        iconName: string;
      }[];
    balls: number;
    goldBalls: number;
    royalBalls: number;
    maxBalls: number;
    totalUpgradeLevels: number;
  };
  equinox: {
    currentCharge: number;
    chargeRequired: number;
    chargeRate: number;
    timeToFull: number;
    challenges: {
        label: string;
        goal: number;
        reward: string;
        current: number;
        active: boolean;
      }[];
    upgrades: {
        name: string;
        bonus: number;
        desc: string[];
        lvl: number;
        maxLvl: number;
        unlocked: boolean;
      }[];
    completedClouds: number;
    breakdown: {
        title?: string;
        name?: string;
        value?: number;
      }[];
    expression: string;
  };
  starSigns: {
      starName: string;
      cost: number;
      bonuses: {
          bonus: number;
          effect: string;
          rawName: string;
        }[] | null;
      tree: string;
      indexedStarName: string;
      unlocked: boolean;
      isInfiniteStar: boolean;
      description?: string;
    }[];
  grimoire: {
    totalUpgradeLevels: number;
    bones: number[];
    upgrades: {
        name: string;
        x1: number;
        x2: number;
        boneType: number;
        x4: number;
        x5: number;
        unlockLevel: number;
        x7: number;
        x8: number;
        description: string;
        index: number;
        level: number;
        cost: number;
        unlocked: boolean;
        bonus: number;
      }[];
    totalBonesCollected: number;
    monsterDrops: {
        Name: string;
        AFKtype: string;
        MonsterFace: number;
        MonsterOffsetX: number;
        MonsterOffsetY: number;
        HeightOfMonster: number;
        MonsterMoving: number;
        MovingFrame: number;
        DeathFrame: number;
        RespawnTime: number;
        MonsterHPTotal: number;
        Type: string;
        SpecialType: string;
        ExpGiven: number;
        ExpType: number;
        Defence: number;
        MoveSPEED: number;
        Damages: number[];
        mapIndex: number;
        worldIndex: number;
        sprite: string;
        spriteAcross: number;
        spriteDown: number;
        spriteNumFrames: number;
        rawName: string;
        mapName: string;
        boneType: number;
        boneQuantity: number;
      }[];
    ribbons: number[];
  };
  compass: {
    upgrades: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        x9: number;
        x10: number;
        description: string;
        level: number;
        shapeIcon: string;
        index: number;
        bonus: number;
        nextLevelBonus: number;
        bonusDiff: number;
        cost: number;
        isMulti: boolean;
        baseIconIndex?: number;
      }[];
    groupedUpgrades: {
        path: string;
        list: Record<string, any>[];
      }[];
    abominations: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        x9: number;
        x10: number;
        x11: number;
        x12: number;
        unlocked: number;
        hp: number;
        weakness: {
          name: string;
          index: number;
        };
        map: string;
        world: number;
      }[];
    medallions: {
        Name: string;
        AFKtype: string;
        MonsterFace: number;
        MonsterOffsetX: number;
        MonsterOffsetY: number;
        HeightOfMonster: number;
        MonsterMoving: number;
        MovingFrame: number;
        DeathFrame: number;
        RespawnTime: number;
        MonsterHPTotal: number;
        Type: string;
        SpecialType: string;
        ExpGiven: number;
        ExpType: number;
        Defence: number;
        MoveSPEED: number;
        Damages: number[];
        mapIndex?: number;
        worldIndex?: number;
        sprite?: string;
        spriteAcross?: number;
        spriteDown?: number;
        spriteNumFrames?: number;
        acquired: boolean;
        weakness: number;
        drops: Record<string, any>[] | any[];
        dustType: number;
        dustBaseQuantity: number;
        description?: string;
      }[];
    maps: {
        mapIndex: string;
        mapName: string;
        portals: Record<string, any>[];
        monster: {
          Name: string;
          AFKtype: string;
          MonsterFace: number;
          MonsterOffsetX: number;
          MonsterOffsetY: number;
          HeightOfMonster: number;
          MonsterMoving: number;
          MovingFrame: number;
          DeathFrame: number;
          RespawnTime: number;
          MonsterHPTotal: number;
          Type: string;
          SpecialType: string;
          ExpGiven: number;
          ExpType: number;
          Defence: number;
          MoveSPEED: number;
          Damages: number[];
          mapIndex: number;
          worldIndex: number;
          sprite: string;
          spriteAcross: number;
          spriteDown: number;
          spriteNumFrames: number;
        };
        unlocked: boolean;
      }[];
    totalAcquiredMedallions: number;
    totalKilledAbominations: number;
    dusts: {
        value: number;
        name: string;
      }[];
    exaltedStamps: {
      combat: Record<string, any>;
      skills: Record<string, any>;
      misc: Record<string, any>;
    };
    usedExaltedStamps: number;
    remainingExaltedStamps: number;
    totalUpgradeLevels: number;
    totalDustsCollected: number;
    topOfTheMorninKills: string;
  };
  tesseract: {
    upgrades: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        description: string;
        level: number;
        index: number;
        unlocked: boolean;
        bonus: number;
        nextLevelBonus: number;
        bonusDiff: number;
        cost: number;
      }[];
    tachyons: {
        value: number;
        name: string;
      }[];
    totalTachyons: number;
    totalUpgradeLevels: number;
    crystalChargeReq: number;
    weaponDropChance: number;
    weaponQuality: number;
    ringDropChance: number;
    ringQuality: number;
    unlockedPortals: Record<string, any>;
    mapBonusRaw: (number[])[];
  };
  finishedWorlds: {
    World1: boolean;
    World2: boolean;
    World3: boolean;
    World4: boolean;
    World5: boolean;
    World6: boolean;
    World7: boolean;
  };
  currentWorld: number;
  totalSkillsLevels: {
    character: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    mining: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    smithing: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    chopping: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    fishing: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    alchemy: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    catching: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    trapping: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    construction: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    worship: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    cooking: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    breeding: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    laboratory: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    sailing: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    divinity: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    gaming: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    farming: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    sneaking: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    summoning: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    spelunking: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
    research: {
      level: number;
      index: number;
      icon: string;
      rank: number;
      color: string;
    };
  };
  construction: {
    totalBuildRate: number;
    totalExpRate: number;
    totalFlaggyRate: number;
    totalPlayerExpRate: number;
    board: {
        currentAmount: number;
        requiredAmount: number;
        flagPlaced: boolean;
        cog: {
          name: string;
          stats: Record<string, any>;
          originalIndex: number;
        };
        affectedBy: number[];
        affects: number[] | any[];
      }[];
    baseBoard: {
        currentAmount: number;
        requiredAmount: number;
        flagPlaced: boolean;
        cog: {
          name: string;
          stats: Record<string, any>;
          originalIndex: number;
        };
      }[];
    playersBuildRate: number;
    leftColumn: {
        currentAmount: number;
        requiredAmount: number;
        flagPlaced: boolean;
        cog: {
          name: string;
          stats: Record<string, any>;
          originalIndex: number;
        };
        affectedBy: any[];
        affects: any[];
      }[];
    rightColumn: {
        currentAmount: number;
        requiredAmount: number;
        flagPlaced: boolean;
        cog: {
          name: string;
          stats: Record<string, any>;
          originalIndex: number;
        } | {
          name: string;
          stats: Record<string, never>;
          originalIndex: number;
        };
        affectedBy: any[];
        affects: any[];
      }[];
    cogstruction: {
      cogData: string;
      empties: string;
    };
  };
  atoms: {
    particles: number;
    atoms: {
        level: number;
        maxLevel: number;
        rawName: string;
        name: string;
        desc: string;
        baseBonus: number;
        x1: number;
        x2: number;
        x3: number;
        cost: number;
        nextLeveCost: number;
        costToMax: number;
        bonus?: number;
      }[];
    stampReducer: number;
  };
  spelunking: {
    sneakingSlots: number[];
    totalGrandDiscoveries: number;
    grandDiscoveriesChance: number;
    exaltedFragmentFound: number;
    prismaFragmentFound: number;
    highestSpelunkingLevelCharacter: number;
    totalUpgradeLevels: number;
    coralReefLevels: number[];
    biggestHaul: number;
    biggestHauls: number[];
    bestCaveLevels: number[];
    cavesUnlocked: number;
    totalBestCaveLevels: number;
    totalCharactersSpelunkingLevels: number;
    discoveriesCount: number;
    maxDiscoveries: number;
    discoveries: ({
          name: string;
          x1: number;
          x2: number;
          x3: number;
          x4: number;
          x5: number;
          x6: number;
          x7: number | null;
          index: number;
          hp: number;
          powerReq: number;
          powerReqFormatted: string;
          acquired: boolean;
          amount: number;
        }[])[];
    upgrades: {
        name: string;
        description: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        x9: number;
        x10: string;
        x11: string;
        level: number;
        originalIndex: number;
        baseBonus: number;
        bonus: number;
        cost: number;
      }[];
    chapters: ({
          name: string;
          x1: number;
          x2: number;
          func: string;
          x4: number;
          x5: number;
          x6: number;
          x7: number;
          level: number;
          bonus: number;
          requiredPages: number;
        }[])[];
    power: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: string;
        categories: Record<string, any>[];
      };
    };
    rawDancingCoral: number[];
    rawLoreThreshold: number;
    elixirs: {
        description: string;
        quantity: number;
        bonus: string;
        acquired: boolean;
        isInUse: boolean;
        timesUsed: number;
      }[];
    currentAmber: number;
    overstimLevel: number;
    overstimCurrent: number;
    overstimReq: number;
    overstimFillRate: number;
    overstimRate: number;
    charactersAtMaxStamina: number;
    loreBonuses: {
        name: string;
        description: string;
        isMulti: boolean;
        bonus: number;
        index: number;
      }[];
    amberGain: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: string;
        categories: Record<string, any>[];
      };
    };
    maxDailyPageReads: number;
    staminaRegenRate: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: string;
        categories: Record<string, any>[];
      };
    };
    loreBosses: {
        description: string;
        index: number;
        maxDiscoveries: number;
        discoveriesCount: number;
        discoveries: Record<string, any>[];
        defeated: boolean;
        biggestHaul: number;
        bestCaveLevel: number;
        foundAt: number;
      }[];
    ownedSlots: number;
    ownedElixirs: number;
    maxElixirDuplicates: number;
    talentSpelunkArrays: (number[])[];
    charactersStamina: {
        characterStamina: number;
        currentStamina: number;
        timeToFull: number;
      }[];
  };
  hatRack: {
    bonusMulti: number;
    hatBonuses: {
        name: string;
        value: number;
      }[];
    hatsUsed: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: number | string;
        UQ1val: number | string;
        UQ2txt: number;
        UQ2val: number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        rawName: string;
        hatIndex: number;
        hatMultiplier: number;
      }[];
    allPremiumHelmets: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: number | string;
        UQ1val: number | string;
        UQ2txt: number | string;
        UQ2val: number | string;
        Upgrade_Slots_Left: number;
        equip: string;
        rawName: string;
        itemType: string;
        hatMultiplier: number;
        isAcquired: boolean;
      }[];
    totalHats: number;
  };
  gaming: {
    palette: {
        x0: number;
        x1: number;
        x2: number;
        name: string;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        x9: number;
        description: string;
        level: number;
        bonus: number;
        active: boolean;
        chance: number;
      }[];
    paletteFinalBonus: number;
    paletteLuck: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: string;
        categories: Record<string, any>[];
      };
    };
    bestNugget: number;
    bits: number;
    envelopes: number;
    ratTokens: number;
    snailLevel: number;
    snailEncouragement: number;
    squirrelMulti: number;
    elegantShellRank: number;
    fertilizerUpgrades: {
        name: string;
        description: string;
        level: number;
        bonus: string;
        cost: number;
      }[];
    availableSprouts: number;
    availableDrops: number;
    sproutsCapacity: string;
    imports: {
        boxName: string;
        boxDescription: string;
        name: string;
        majorBonus: string;
        minorBonus: string;
        description: string;
        x1: number;
        x2: number;
        level: number;
        rawName: string;
        bonus?: number;
        cost: number;
        acquired: boolean;
        saveSprinklerChance?: number;
        maxNuggetValue?: number;
        acornShop?: Record<string, any>[];
      }[];
    lastShovelClicked: number;
    goldNuggets: number;
    lastAcornClicked: number;
    acorns: number;
    nuggetsBreakpoints: {
        time: number;
        amount: number;
      }[];
    acornsBreakpoints: {
        time: number;
        amount: number;
      }[];
    superbitsUpgrades: {
        description: string;
        index: number;
        x1: number;
        x2: number;
        name: string;
        originalIndex: number;
        unlocked: boolean;
        cost: number;
        isDuper: boolean;
        isZuper: boolean;
        bonus: number;
        totalBonus: number;
        additionalInfo?: string;
      }[];
    mutations: {
        name: string;
        index: number;
        description: string;
      }[];
    unlockedMutations: number;
    mutationCost: number;
    dna: number;
    newMutationChance: number;
    mutationChanceBreakpoints: {
        value: number;
        chance: number;
      }[];
    logBook: {
        rawName: string;
        unlocked: boolean;
        crowned: boolean;
      }[];
    poingHighscore: number;
    poingMulti: number;
    totalPlantsPicked: number;
    selectedSlots: number;
    ratKingCrownsClaimed: number;
    ratKing: {
      crownsCount: number;
      kingRatUnlocked: boolean;
      ratBitMulti: number;
      ratCurrencyGain: number;
      ratCrownOdds: number;
      shopUpgrades: {
          name: string;
          level: number;
          bonus: number;
          cost: number;
        }[];
    };
  };
  sailing: {
    maxChests: number;
    artifacts: {
        name: string;
        x1: string;
        baseFindChance: number;
        description: string;
        baseBonus: number;
        ancientFormDescription: string;
        ancientMultiplier: number;
        eldritchFormDescription: string;
        eldritchMultiplier: number;
        sovereignFormDescription: string;
        sovereignMultiplier: number;
        omnipotentFormDescription: string;
        omnipotentMultiplier: number;
        transcendentFormDescription: string;
        transcendentMultiplier: number;
        bonus: number;
        acquired: number;
        rawName: string;
        additionalData?: string;
      }[];
    lootPile: {
        amount: number;
        rawName: string;
      }[];
    chests: any[];
    rareTreasureChance: number;
    trades: {
        amount: number;
        rawName: string;
        date: string;
        moneyValue: number;
        lootItemCost: number;
      }[];
    timeToFullChests: number;
    captains: {
        captainIndex: string;
        captainType: number;
        level: number;
        firstBonusIndex: number;
        secondBonusIndex: number;
        firstBonusDescription: string;
        secondBonusDescription: string;
        firstBonusValue: number;
        secondBonusValue: number;
        exp: string;
        firstBonus: number;
        secondBonus: number;
        expReq: string;
      }[];
    boats: {
        rawName: string;
        level: number;
        artifactChance: {
          value: string;
          breakdown: Record<string, any>;
        };
        captainIndex: number;
        captainMappedIndex: string;
        lootLevel: number;
        speedLevel: number;
        boatIndex: number;
        island: {
          name: string;
          distance: number;
          unlockReq: number;
          cloudsUnlocked: number;
          xyPointer: string;
          expPerTrip: number;
          numberOfArtifacts: number;
        };
        islandIndex: number;
        distanceTraveled: number;
        resources: Record<string, any>[];
        breakpointResources: Record<string, any>[];
        loot: {
          value: number;
          nextLevelValue: number;
          nextBreakpointValue: number;
        };
        speed: {
          raw: number;
          value: number;
          nextLevelValue: number;
          nextBreakpointValue: number;
        } | {
          raw: number;
          value: number;
          nextLevelValue: number;
        };
        maxTime: number;
        timeLeft: number;
      }[];
    shopCaptains: {
        captainIndex: string;
        captainType: number;
        level: number;
        firstBonusIndex: number;
        secondBonusIndex: number;
        firstBonusDescription: string;
        secondBonusDescription?: string;
        firstBonusValue: number;
        secondBonusValue: number;
        exp: string;
        firstBonus: number;
        secondBonus: number;
        expReq: string;
        cost: number;
      }[];
    captainsOnBoats: {
      A: number;
      J: number;
      E: number;
      Q: number;
      R: number;
      S: number;
      B: number;
      P: number;
      C: number;
      T: number;
      N: number;
      O: number;
      D: number;
      H: number;
      I: number;
      K: number;
      L: number;
      M: number;
      G: number;
      F: number;
    };
    minimumTravelTime: number;
    minimumTravelTimeBreakdown: {
        name: string;
        value: number;
      }[];
  };
  accountLevel: number;
  highscores: {
    coloHighscores: {
        name: string;
        score: number;
      }[];
    minigameHighscores: {
        name: string;
        score: number;
        totalPoints?: number;
        upgrades?: Record<string, any>[];
      }[];
  };
  forge: {
    list: {
        isBrimestone: boolean;
        ore: {
          rawName: string;
          amount: number;
          quantity: number;
          timeTillEmpty: number;
          owner: string;
        };
        barrel: {
          rawName: string;
          amount: number;
          quantity: number;
          owner: string;
        };
        bar: {
          rawName: string;
          amount: number;
          quantity: number;
          owner: string;
        };
      }[];
    upgrades: {
        name: string;
        maxLevel: number;
        description: string;
        level: number;
        costMulti?: number;
      }[];
  };
  refinery: {
    salts: {
        saltName: string;
        cost: Record<string, any>[];
        rawName: string;
        powerCap: number;
        refined: number;
        rank: number;
        active: number;
        autoRefinePercentage: number;
      }[];
    refinerySaltTaskLevel: number;
    timePastCombustion: number;
    timePastSynthesis: number;
    timePastPolymerize: number;
    totalLevels: number;
    refineryStorage: {
        rawName: string;
        name: string;
        amount: number;
        owner: string;
      }[];
  };
  printer: ({
        item: string;
        value: number;
        active: boolean;
        boostedValue: number;
        breakdown: Record<string, any>[];
        expression: string;
      }[])[];
  quests: {
    Blunder_Hills: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    Yum_Yum_Desert: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    Frostbite_Tundra: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    Hyperion_Nebula: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    Spirited_Valley: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    'Smolderin\'_Plateau': {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
    Shimmerfin_Deep: {
        name: string;
        index: number;
        npcQuests: Record<string, any>[];
      }[];
  };
  islands: {
    islandsUnlocked: number;
    bottles: number;
    bottlesPerDay: number;
    trashPerDay: number;
    trashPerDaysAfk: number;
    numberOfDaysAfk: number;
    allShimmerBonus: number;
    list: {
        name: string;
        description: string;
        preUnlockCost: number;
        baseCost: number;
        unlocked: boolean;
        cost: null;
        trash?: number;
        learnMore?: boolean;
        shop?: Record<string, any>[];
        currentTrial?: string;
        bestDpsEver?: string;
        shimmerCurrency?: number;
        hoursAfk?: number;
      }[];
  };
  deathNote: Record<string, {
      rank: number;
      mobs: {
          rawName: string;
          displayName: string;
          kills: number;
        }[];
    }>;
  topKilledMonsters: {
      enemy: string;
      kills: number;
    }[];
  killroy: {
    list: {
        rawName: string;
        name: string;
        world: number;
        icon: string;
        killRoyKills?: number;
      }[];
    permanentUpgrades: {
        description: string;
        x1: number;
        x2: number;
        x3: number;
        bonusName: string;
        level: number;
        bonus: number;
      }[];
    totalKills: number;
    totalDamageMulti: number;
    rooms: number;
    killRoyClasses: any[];
    upgrades: {
        level: number;
        description: string;
        upgrade?: string;
      }[];
    skulls: number;
  };
  anvil: {
      anvilProduction: (number[])[];
      anvilStats: {
        availablePoints: number;
        pointsFromCoins: number;
        pointsFromMats: number;
        pointsFromAcme: number;
        xpPoints: number;
        speedPoints: number;
        capPoints: number;
      };
      anvilSelected: number[];
    }[];
  libraryTimes: {
    bookCount: number;
    next: number;
    breakdown: {
      statName: string;
      totalValue: number;
      categories: {
          name: string;
          sources: Record<string, any>[];
        }[];
    };
    breakpoints: {
        breakpoint: number;
        time: number;
      }[];
  };
  shrinesExpBonus: {
    total: number[];
    breakdown: Record<string, any>;
  };
  msaTotalizer: {
    damage: {
      name: string;
      value: number;
    };
    sailing: {
      name: string;
      value: number;
    };
    classExp: {
      name: string;
      value: number;
    };
    cookingSpeed: {
      name: string;
      value: number;
    };
    bit: {
      name: string;
      value: number;
    };
    skillExp: {
      name: string;
      value: number;
    };
    farmingExp: {
      name: string;
      value: number;
    };
    jadeCoin: {
      name: string;
      value: number;
    };
    essence: {
      name: string;
      value: number;
    };
    spelunkingPow: {
      name: string;
      value: number;
    };
    researchExp: {
      name: string;
      value: number;
    };
  };
  tome: {
    tome: {
        name: string;
        info: string;
        x1: number;
        x2: number;
        x3: number;
        x4: null;
        tomeLvReq: number;
        index: number;
        quantity: number;
        points: number;
        maxPoints: number;
        color: string;
        requiredQuantities: {
          silver: number;
          gold: number;
          blue: number;
        };
      }[];
    bonuses: {
        name: string;
        bonus: number;
        isMulti: boolean;
        icon?: string;
      }[];
    totalPoints: number;
    tops: number[];
    top: number;
  };
  owl: {
    upgrades: {
        name: string;
        desc: string;
        bonus: string;
        x1: number;
        x2: number;
        x3: number;
        cost: number;
        level: number;
        nextLvReq?: number;
        unlocked: boolean;
      }[];
    bonuses: {
        name: string;
        bonus: number;
        percentage?: boolean;
      }[];
    feathers: number;
    progress: number;
    nextLvReq: number;
    megaFeathers: {
        description: string;
        unlocked: boolean;
        amount?: number;
        totalBonus?: number;
      }[];
    featherRate: number;
    restartMulti: number;
  };
  kangaroo: {
    resetBonuses: {
        desc: string;
        level: number;
      }[];
    upgrades: {
        name: string;
        desc: string;
        bonus: string;
        x1: number;
        x2: number;
        x3: number;
        x6: number;
        cost: number;
        level: number;
        nextLvReq: number;
        unlocked: boolean;
      }[];
    bonuses: {
        name: string;
        bonus: number;
        percentage?: boolean;
      }[];
    fish: number;
    progress: number;
    megaFish: {
        description: string;
        unlocked: boolean;
      }[];
    fishRate: number;
    tarFishRate: number;
    tarFishOwned: number;
    totalMulti: string;
    allMultipliers: {
        multi: string;
        amount: string;
      }[];
    tarUpgrades: {
        name: string;
        desc: string;
        bonus: string;
        _: string;
        x1: number;
        x2: number;
        x6: number;
        cost: number;
        level: number;
        unlocked: boolean;
      }[];
    shinyProgress: number;
    shinyRate: number;
    shinyRatePercent: number;
  };
  voteBallot: {
    bonuses: {
        '0': string;
        '1': string;
        '2': string;
        icon: string;
        active: boolean;
        selected: boolean;
        percent: number;
        bonus: number;
      }[];
    meritocracyBonuses: {
        description: string;
        value: number;
        extra: number;
        icon: string;
        active: boolean;
        selected: boolean;
        percent: number;
        bonus: number;
      }[];
    voteMulti: number;
    meritocracyMult: number;
    selectedBonus: {
      '0': string;
      '1': string;
      '2': string;
      icon: string;
      active: boolean;
      selected: boolean;
      percent: number;
      bonus: number;
      index: number;
    };
    selectedMeritocracyBonus: {
      description: string;
      value: number;
      extra: number;
      icon: string;
      active: boolean;
      selected: boolean;
      percent: number;
      bonus: number;
      index: number;
    };
  };
  upgradeVault: {
    upgrades: {
        name: string;
        x1: number;
        x2: number;
        x3: number;
        maxLevel: number;
        x5: number;
        unlockLevel: number;
        x7: number;
        x8: number;
        description: string;
        level: number;
        unlocked: boolean;
        cost: number;
        costToMax: number;
        bonus: number;
      }[];
    totalUpgradeLevels: number;
    vaultTotalKills: number[];
  };
  emperor: {
    highestEmperorShowdown: number;
    bossHp: number[];
    bonuses: {
        bonus: string;
        totalBonus: number;
        rawIndex: number;
        icon: string;
        value: string;
        indexes: number[];
      }[];
    dailyAttempts: number;
    attempts: number;
    maxAttempts: number;
  };
  legendTalents: {
    talents: {
        name: string;
        x1: number;
        x2: number;
        bonus: number;
        description: string;
        originalIndex: number;
        level: number;
        index: number;
        maxLevel: number;
      }[];
    pointsLeftToSpend: number;
    pointsOwned: {
      value: number;
      breakdown: {
          name: string;
          value: number;
        }[];
    };
    pointsSpent: number;
    maxSpendable: number;
  };
  gallery: {
    bonusMulti: number;
    trophyBonuses: {
        name: string;
        value: number;
      }[];
    nametagBonuses: {
        name: string;
        value: number;
      }[];
    podiumsOwned: number;
    lv2PodiumsOwned: number;
    lv3PodiumsOwned: number;
    lv4PodiumsOwned: number;
    trophiesUsed: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: string;
        UQ2txt: string | number;
        UQ2val: string | number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        rawName: string;
        podiumLevel: number;
        podiumMultiplier: number;
      }[];
    nametagsUsed: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: string;
        UQ2txt: number | string;
        UQ2val: number | string;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        rawName: string;
        level: number;
        nametagMultiplier: number;
      }[];
    inventoryTrophies: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: string;
        UQ2txt: number;
        UQ2val: number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        rawName: string;
        inventoryIndex: number;
        inventoryMultiplier: number;
      }[];
    allTrophies: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: string;
        UQ2txt: number | string;
        UQ2val: number | string;
        Upgrade_Slots_Left: number;
        equip: string;
        rawName: string;
        itemType: string;
        podiumLevel?: number;
        podiumMultiplier?: number;
        isAcquired: boolean;
        inventoryMultiplier?: number;
      }[];
    allNametags: {
        displayName: string;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        Weapon_Power: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: string;
        UQ1val: string;
        UQ2txt: number | string;
        UQ2val: number | string;
        Upgrade_Slots_Left: number;
        equip: string;
        rawName: string;
        itemType: string;
        level: number;
        nametagMultiplier: number;
        isAcquired: boolean;
      }[];
  };
  coralReef: {
    coralKidUpgrades: {
        index: number;
        level: number;
        description: string;
        cost: number;
        bonus: number;
      }[];
    dancingCoral: {
        index: number;
        level: number;
        coralName: string;
        description: string;
        dropResource: string;
        cost: number;
        bonus: number;
        tower: {
          index: number;
          desc: string;
          itemReq: Record<string, any>[];
          maxLevel: number;
          bonusInc: number;
          costInc: number[];
          name: string;
          level: number;
          nextLevel: boolean;
          progress: number;
          inProgress: boolean;
          slot: number;
        };
      }[];
    reefUpgrades: {
        index: number;
        level: number;
        name: string;
        x1: number;
        x2: number;
        exponent: number;
        x4: number;
        x5: number;
        x6: number;
        x7: number;
        x8: number;
        x9: number;
        x10: number;
        x11: number;
        x12: number;
        description: string;
        cost: number;
        bonus: number;
        extraData?: Record<string, any>[];
      }[];
    grindTimeDaily: number;
    unlockedCorals: number;
    ownedCorals: number;
    reefDayGains: {
      value: number;
      breakdown: {
        statName: string;
        totalValue: string;
        categories: Record<string, any>[];
      };
    };
  };
  clamWork: {
    workerClass: number;
    promotionChance: number;
    promotionCost: string;
    clamHp: number;
    mobs: number;
    pearlValue: number;
    blackPearlValue: number;
    upgrades: {
        name: string;
        description: string;
        requiredPearls: number;
        bonus: number;
        cost: number;
        unlocked: boolean;
      }[];
    ownedPearls: number;
    compensations: {
        name: string;
        unlocked: number;
      }[];
    respawn: number;
  };
  minehead: {
    opponentsBeat: number;
    mineCurrency: number;
    bestHit: number;
    dailyTriesLeft: number;
    dailyTriesMax: number;
    maxHP_You: number;
    baseDMG: number;
    currencyGain: number;
    upgrades: {
        index: number;
        name: string;
        level: number;
        maxLevel: number;
        isMaxed: boolean;
        researchLvReq: number;
        isLocked: boolean;
        bonusPerLevel: number;
        upgradeQTY: number;
        cost: number;
        canAfford: boolean;
        description: string;
      }[];
    opponents: {
        index: number;
        name: string;
        ordinal: string;
        title: string;
        maxHP: number;
        minesCount: number;
        bonusValue: number;
        bonusDescription: string;
        beaten: boolean;
      }[];
    glimbo: {
        index: number;
        rawItemName: string;
        itemName: string;
        trades: number;
        cost: number;
        vaultIdx: number;
        upgradeName: string;
        baseMaxLevel: number;
        currentMaxLevel: number;
        nextMaxLevel: number;
        nextBonusGain: number;
        flag: boolean;
      }[];
    glimboTotalTrades: number;
  };
  tournament: {
    divisionIndex: number;
    playerName: null;
    divisionName: string;
    divisionScale: number;
    divisionNames: string[];
    playerRank: null;
    tournamentDay: number;
    matchDay: number;
    registrationCount: number;
    matches: any[];
    leaderboard: any[];
    global: null;
  };
  research: Record<string, any>;
  bubba: {
    upgrades: {
        name: string;
        description: string;
        x1: number;
        x2: number;
        x3: number;
        x4: number;
        x5: number;
        x6: number;
        level: number;
        prestige: number;
        realLV: number;
        cost: number;
        bonus: number;
        unlocked: boolean;
      }[];
    meatSlices: number;
    meatsliceRate: number;
    progress: number;
    progressReq: number;
    bonuses: {
      buildRate: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      critterGain: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      soulGain: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      totalDamage: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      allKills: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      expMulti: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
      atomCost: {
        name: string;
        bonus: number;
        isNegative: boolean;
      };
    };
    totalUpgTypesAvailable: number;
    megafleshOwned: number;
  };
  friendBonusStats: {
    slots: number;
    multiplier: number;
    bonuses: {
        statIndex: number;
        name: string;
        level: number;
        friendName: string;
        value: number;
      }[];
  };
  [key: string]: any;
}

export interface Character {
  playerId: number;
  name: string;
  classIndex: number;
  class: string;
  afkTime: number;
  afkTarget: string;
  afkType: string;
  targetMonster: string;
  mapIndex: number;
  currentMap: string;
  money: number;
  cooldowns: Record<string, number>;
  fishingKit: {
    bait: {
      name: string;
      depth1: number;
      depth2: number;
      depth3: number;
      depth4: number;
      exp: number;
      speed: number;
      pow: number;
    };
    line: {
      name: string;
      depth1: number;
      depth2: number;
      depth3: number;
      depth4: number;
      exp: number;
      speed: number;
      pow: number;
    };
  };
  stats: {
    strength: number;
    agility: number;
    wisdom: number;
    luck: number;
    level: number;
  };
  level: number;
  invBagsUsed: {
      displayName: string;
      sellPrice: number;
      typeGen: string;
      ID: number;
      Type: string;
      lvReqToCraft: number;
      common: string;
      lvReqToEquip: number;
      Class: string;
      Speed: number;
      Reach: number;
      Weapon_Power: number;
      STR: number;
      AGI: number;
      WIS: number;
      LUK: number;
      Defence: number;
      UQ1txt: number;
      UQ1val: number;
      UQ2txt: number;
      UQ2val: number;
      Upgrade_Slots_Left: number;
      equip: string;
      itemType: string;
      capacity: number;
      rawName: string;
      acquired: boolean;
    }[];
  maxCarryCap: {
    Souls: number;
    Chopping: number;
    Mining: number;
    Quests: number;
    fillerz: number;
    Fishing: number;
    Critters: number;
    Foods: number;
    bCraft: number;
    Statues: number;
    Bugs: number;
  };
  carryCapBags: {
      displayName: string;
      sellPrice: number;
      typeGen: string;
      ID: number;
      Type: string;
      lvReqToCraft: number;
      common: string;
      lvReqToEquip: number;
      Class: string;
      Speed: number;
      Reach: number;
      Weapon_Power: number;
      STR: number;
      AGI: number;
      WIS: number;
      LUK: number;
      Defence: number;
      UQ1txt: number;
      UQ1val: number;
      UQ2txt: number;
      UQ2val: number;
      Upgrade_Slots_Left: number;
      equip: string;
      itemType: string;
      capacity: number;
      rawName: string;
      capacityPerSlot: number;
      breakdown: {
          title?: string;
          name?: string;
          value?: number;
        }[];
      maxCapacity: number;
    }[];
  statues: (number[])[];
  equipment: {
      name: string;
      rawName: string;
      owner: string;
      displayName: string;
      sellPrice: number;
      typeGen: string;
      ID: number;
      Type: string;
      lvReqToCraft: number;
      common: string;
      lvReqToEquip: number;
      Class: string;
      Speed: number;
      Reach: number;
      Weapon_Power: number;
      STR: number;
      AGI: number;
      WIS: number;
      LUK: number;
      Defence: number;
      UQ1txt: string;
      UQ1val: number;
      UQ2txt: string | number;
      UQ2val: number;
      Upgrade_Slots_Left: number;
      equip: string;
      itemType: string;
      Power?: number;
      changes: any;
      maxUpgradeSlots: number;
      misc: string;
    }[];
  tools: {
      name?: string;
      rawName: string;
      owner: string;
      displayName?: string;
      sellPrice?: number;
      typeGen?: string;
      ID?: number;
      Type?: string;
      lvReqToCraft?: number;
      common?: string;
      lvReqToEquip?: number;
      Class?: string;
      Speed?: number;
      Reach?: number;
      Weapon_Power?: number;
      STR?: number;
      AGI?: number;
      WIS?: number;
      LUK?: number;
      Defence?: number;
      UQ1txt?: string | number;
      UQ1val?: number;
      UQ2txt?: string | number;
      UQ2val?: number;
      Upgrade_Slots_Left?: number;
      equip?: string;
      itemType?: string;
      Power?: number;
      changes?: {
          Upgrade_Slots_Left?: number;
          Weapon_Power?: number;
          STR?: number;
        }[] | any[] | {
          Upgrade_Slots_Left: number;
        }[];
      maxUpgradeSlots?: number;
      misc: string;
    }[];
  food: {
      name?: string;
      rawName: string;
      owner: string;
      amount: number;
      displayName?: string;
      sellPrice?: number;
      typeGen?: string;
      ID?: number;
      Type?: string;
      lvReqToCraft?: number;
      common?: string;
      desc_line1?: string;
      desc_line2?: string;
      desc_line3?: string;
      desc_line4?: string;
      desc_line5?: string;
      desc_line6?: string;
      desc_line7?: string;
      desc_line8?: string;
      Effect?: string;
      Amount?: number;
      Trigger?: number;
      Cooldown?: number;
      consumable?: string;
      itemType?: string;
    }[];
  inventory: {
      displayName: string;
      sellPrice: number;
      typeGen: string;
      ID: number;
      Type: string;
      lvReqToCraft: number;
      common: string;
      desc_line1?: string;
      desc_line2?: string;
      desc_line3?: string;
      desc_line4?: string;
      desc_line5?: string;
      desc_line6?: string;
      desc_line7?: string;
      desc_line8?: string;
      Effect?: string;
      Amount?: number;
      Trigger?: number;
      Cooldown?: number;
      consumable?: string;
      itemType: string;
      rawName: string;
      maxUpgradeSlots: number;
      owner: string;
      name: string;
      type: string;
      subType: string;
      amount: number;
      misc: string;
      description: string;
      lvReqToEquip?: number;
      Class?: string;
      Speed?: number;
      Reach?: number;
      Weapon_Power?: number;
      STR?: number;
      AGI?: number;
      WIS?: number;
      LUK?: number;
      Defence?: number;
      UQ1txt?: string | number;
      UQ1val?: number;
      UQ2txt?: string | number;
      UQ2val?: number;
      Upgrade_Slots_Left?: number;
      equip?: string;
      Power?: number;
      changes?: any;
    }[];
  inventorySlots: number;
  starSigns: {
      starName: string;
      cost: number;
      bonuses: {
          bonus: number;
          effect: string;
          rawName: string;
        }[];
      tree: string;
    }[];
  equippedBubbles: {
      level: number;
      index: number;
      rawName: string;
      bubbleIndex: string;
      bubbleName: string;
      x1: number;
      x2: number;
      func: string;
      desc: string;
      stat: string;
      cauldron: string;
      itemReq: {
          rawName: string;
          name?: string;
          baseCost: number;
        }[];
    }[];
  skillsInfo: {
    character: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    mining: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    smithing: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    chopping: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    fishing: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    alchemy: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    catching: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    trapping: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    construction: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    worship: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    cooking: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    breeding: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    laboratory: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    sailing: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    divinity: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    gaming: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    farming: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    sneaking: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    summoning: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    spelunking: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
    research: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      rank: number;
    };
  };
  skillsInfoArray: {
      level: number;
      exp: number;
      expReq: number;
      icon: string;
      index: number;
      skillName: string;
    }[];
  selectedTalentPreset: number;
  superTalentLeftToSpend: number;
  talentPreset: {
    talents: Record<string, {
        name: string;
        id: number;
        orderedTalents: Record<string, any>[];
      }>;
    flatTalents: Record<string, {
        name: string;
        id: number;
        orderedTalents: Record<string, any>[];
      }>;
    starTalents: {
      orderedTalents: {
          talentId: number;
          name: string;
          description: string;
          x1: number;
          x2: number;
          funcX: string;
          y1: null;
          y2: null;
          funcY: string;
          lvlUpText: string;
          skillIndex: number;
          level: number;
          maxLevel: number;
          K?: number;
          D?: number;
          s?: number;
          cooldown?: number;
          castTime?: number;
          manaCost?: number;
          inputReq?: number;
          AFKrange?: number;
          AFKtype?: string;
          AFKactivity?: number;
        }[];
    };
    flatStarTalents: {
        talentId: number;
        name: string;
        description: string;
        x1: number;
        x2: number;
        funcX: string;
        y1: null;
        y2: null;
        funcY: string;
        lvlUpText: string;
        skillIndex: number;
        level: number;
        maxLevel: number;
        K?: number;
        D?: number;
        s?: number;
        cooldown?: number;
        castTime?: number;
        manaCost?: number;
        inputReq?: number;
        AFKrange?: number;
        AFKtype?: string;
        AFKactivity?: number;
      }[];
    addedLevels: number;
    addedLevelsBreakdown: {
      statName: string;
      totalValue: number;
      categories: {
          name: string;
          sources: Record<string, any>[];
        }[];
    };
  };
  talents: Record<string, {
      name: string;
      id: number;
      orderedTalents: {
          talentId: number;
          name: string;
          description: string;
          x1: number;
          x2: number;
          funcX: string;
          y1: null;
          y2: null;
          funcY: string;
          lvlUpText: string;
          skillIndex: number;
          level: number;
          maxLevel: number;
          baseLevel: number;
          isSuperTalent: boolean;
        }[] | {
          talentId: number;
          name: string;
          description: string;
          x1: number;
          x2: number;
          funcX: string;
          y1: null | number;
          y2: null | number;
          funcY: string;
          lvlUpText: string;
          skillIndex: number;
          K?: number;
          D?: number;
          s?: number;
          cooldown?: number;
          castTime?: number;
          manaCost?: number;
          inputReq?: number;
          AFKrange?: number;
          AFKtype?: string;
          AFKactivity?: number;
          level: number;
          maxLevel: number;
          baseLevel: number;
          isSuperTalent: boolean;
        }[] | {
          talentId: number;
          name: string;
          description: string;
          x1: number;
          x2: number;
          funcX: string;
          y1: number | null;
          y2: number | null;
          funcY: string;
          lvlUpText: string;
          skillIndex: number;
          K?: number;
          D?: number;
          s?: number;
          cooldown?: number;
          castTime?: number;
          manaCost?: number;
          inputReq?: number;
          AFKrange?: number;
          AFKtype?: string;
          AFKactivity?: number;
          level: number;
          maxLevel: number;
          baseLevel: number;
          isSuperTalent: boolean;
        }[];
    }>;
  flatTalents: {
      talentId: number;
      name: string;
      description: string;
      x1: number;
      x2: number;
      funcX: string;
      y1: null | number;
      y2: null | number;
      funcY: string;
      lvlUpText: string;
      skillIndex: number;
      level: number;
      maxLevel: number;
      baseLevel: number;
      isSuperTalent: boolean;
      K?: number;
      D?: number;
      s?: number;
      cooldown?: number;
      castTime?: number;
      manaCost?: number;
      inputReq?: number;
      AFKrange?: number;
      AFKtype?: string;
      AFKactivity?: number;
    }[];
  starTalents: {
    orderedTalents: {
        talentId: number;
        name: string;
        description: string;
        x1: number;
        x2: number;
        funcX: string;
        y1: null;
        y2: null;
        funcY: string;
        lvlUpText: string;
        skillIndex: number;
        level: number;
        maxLevel: number;
        K?: number;
        D?: number;
        s?: number;
        cooldown?: number;
        castTime?: number;
        manaCost?: number;
        inputReq?: number;
        AFKrange?: number;
        AFKtype?: string;
        AFKactivity?: number;
      }[];
  };
  flatStarTalents: {
      talentId: number;
      name: string;
      description: string;
      x1: number;
      x2: number;
      funcX: string;
      y1: null;
      y2: null;
      funcY: string;
      lvlUpText: string;
      skillIndex: number;
      level: number;
      maxLevel: number;
      K?: number;
      D?: number;
      s?: number;
      cooldown?: number;
      castTime?: number;
      manaCost?: number;
      inputReq?: number;
      AFKrange?: number;
      AFKtype?: string;
      AFKactivity?: number;
    }[];
  activeBuffs: any[];
  activePrayers: {
      name: string;
      effect: string;
      curse: string;
      id: number;
      x1: number;
      x2: number;
      prayerIndex: number;
      soul: string;
      maxLevel: number;
      unlockZone: string;
      costMulti: number;
      unlockWave: number;
      totalAmount: number;
      level: number;
    }[];
  postOffice: {
    boxes: {
        name: string;
        upgradeLevels: number[];
        upgrades: Record<string, any>[];
        maxLevel: number;
        level: number;
      }[];
    totalOrders: number;
    totalPointsSpent: number;
    unspentPoints: number;
  };
  selectedCardPreset: number;
  cardPresets: ({
        cardName: string;
        rawName: string;
        displayName: string;
        cardIndex: string;
        visualIndex: number;
        effect: string;
        bonus: number;
        perTier: number;
        category: string;
        amount: number;
        stars: number;
        nextLevelReq: number;
      }[])[];
  cards: {
    cardSet: {
      name: string;
      effect: string;
      bonus: number;
      rawName: string;
      stars: number;
    };
    equippedCards: {
        cardName: string;
        rawName: string;
        displayName: string;
        cardIndex: string;
        visualIndex: number;
        effect: string;
        bonus: number;
        perTier: number;
        category: string;
        amount: number;
        stars: number;
        nextLevelReq: number;
        legendBonus: number;
      }[];
  };
  obols: {
    inventory: any[];
    list: {
        displayName: string;
        rawName: string;
        index: number;
        shape: string;
        levelReq: number;
        sellPrice: number;
        typeGen: string;
        ID: number;
        Type: string;
        lvReqToCraft: number;
        common: string;
        lvReqToEquip: number;
        Class: string;
        Speed: number;
        Reach: number;
        STR: number;
        AGI: number;
        WIS: number;
        LUK: number;
        Defence: number;
        UQ1txt: number | string;
        UQ1val: number;
        UQ2txt: number | string;
        UQ2val: number;
        Upgrade_Slots_Left: number;
        equip: string;
        itemType: string;
        Fishing_Power?: number;
        Weapon_Power: number;
        changes: any[] | Record<string, any>[];
        rerolled: boolean;
        SuperFunItemDisplayType?: string;
      }[];
    stats: {
      STR: {
        personalBonus: number;
        familyBonus: number;
      };
      AGI: {
        personalBonus: number;
        familyBonus: number;
      };
      WIS: {
        personalBonus: number;
        familyBonus: number;
      };
      LUK: {
        personalBonus: number;
        familyBonus: number;
      };
      Defence: {
        personalBonus: number;
        familyBonus: number;
      };
      Weapon_Power: {
        personalBonus: number;
        familyBonus: number;
      };
      '%_FISHIN_EFFICINCY': {
        personalBonus: number;
      };
      '%_ALL_STATS': {
        personalBonus: number;
        familyBonus: number;
      };
      '%_SKILL_EFFICIENCY': {
        personalBonus: number;
        familyBonus: number;
      };
      '%_DROP_RATE': {
        familyBonus: number;
      };
    };
  };
  worship: {
    maxCharge: number;
    chargeRate: number;
    currentCharge: number;
  };
  quests: Record<string, {
      '1': number;
      '2'?: number;
      '3'?: number;
      '4'?: number;
    }>;
  nonConsumeChance: number;
  kills: number[];
  nextPortal: {
    goal: number;
    current: number;
    currentIcon: string;
  };
  zow: {
    finished: number[];
    list: {
        mapName: string;
        afkTarget: string;
        kills: number;
        monsterFace: number;
        name: string;
        afkType: string;
        done: boolean[];
      }[];
  };
  chow: {
    finished: number[];
    list: {
        mapName: string;
        afkTarget: string;
        kills: number;
        monsterFace: number;
        name: string;
        afkType: string;
        done: boolean[];
      }[];
  };
  wow: {
    finished: number[];
    list: {
        mapName: string;
        afkTarget: string;
        kills: number;
        monsterFace: number;
        name: string;
        afkType: string;
        done: boolean[];
      }[];
  };
  linkedDeity: number;
  deityMinorBonus: number;
  divStyle: {
    name: string;
    description: string;
    index: number;
    divPerHour: number;
  };
  addedLevelsBreakdown: {
    statName: string;
    totalValue: number;
    categories: {
        name: string;
        sources: Record<string, any>[];
      }[];
  };
  addedLevels: number;
  talentsLoadout: {
      talentId: number;
      name: string;
      description: string;
      x1: number;
      x2: number;
      funcX: string;
      y1: number | null;
      y2: number | null;
      funcY: string;
      lvlUpText: string;
      skillIndex: number;
      K: number;
      D: number;
      s: number;
      cooldown: number;
      castTime: number;
      manaCost: number;
      inputReq: number;
      AFKrange: number;
      AFKtype: string;
      AFKactivity: number;
      level: number;
      maxLevel: number;
      baseLevel?: number;
      isSuperTalent?: boolean;
    }[];
  npcDialog: Record<string, number>;
  questComplete: Record<string, number>;
  questCompleted: number;
  printerSample: number;
  anvil: {
    anvilProduction: (number[])[];
    anvilStats: {
      availablePoints: number;
      pointsFromCoins: number;
      pointsFromMats: number;
      pointsFromAcme: number;
      xpPoints: number;
      speedPoints: number;
      capPoints: number;
    };
    anvilSelected: number[];
  };
  crystalSpawnChance: {
    breakdown: {
      statName: string;
      totalValue: string;
      categories: {
          name: string;
          sources: Record<string, any>[];
        }[];
    };
    value: number;
    expression: string;
  };
  constructionSpeed: number;
  constructionExpPerHour: number;
  [key: string]: any;
}
