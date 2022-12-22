import { quests } from "../data/website-data";
import { cloneObject } from "../utility/helpers";

export const getQuests = (characters) => {
  const questsKeys = Object.keys(quests);
  let mappedQuests = questsKeys?.reduce((res, npcName) => {
    const npcQuests = cloneObject(quests[npcName]);
    const worldName = worldNpcMap?.[npcName]?.world;
    const npcIndex = worldNpcMap?.[npcName]?.index;
    if (!worldName) return res;
    for (let i = 0; i < characters?.length; i++) {
      const rawQuest = cloneObject(characters?.[i]?.quests?.[npcName]) || {};
      const questIndices = Object.keys(rawQuest);
      let skip = false;
      for (let j = 0; j < questIndices?.length; j++) {
        const questIndex = questIndices[j];
        const questStatus = rawQuest[questIndex];
        if (!npcQuests[questIndex]) continue;
        if (npcQuests?.[questIndex - 1] && (!skip && (questStatus === 0 || questStatus === -1) || questStatus === 1)) {
          npcQuests[questIndex - 1].progress = npcQuests[questIndex - 1]?.progress?.filter(({ charIndex }) => charIndex !== i);
        }
        if (questStatus === 1) { // completed
          npcQuests[questIndex].completed = [...(npcQuests[questIndex]?.completed || []), {
            charIndex: i,
            status: questStatus
          }];
          npcQuests[questIndex].progress = [...(npcQuests[questIndex]?.progress || []), {
            charIndex: i,
            status: questStatus
          }];
        } else if (!skip && (questStatus === 0 || questStatus === -1)) {
          npcQuests[questIndex].progress = [...(npcQuests[questIndex]?.progress || []), {
            charIndex: i,
            status: questStatus
          }]
          skip = true;
        }
      }
    }
    return {
      ...res,
      [worldName]: [
        ...(res?.[worldName] || []),
        {
          name: npcName,
          index: npcIndex,
          npcQuests: Object.values(npcQuests)
        }
      ]
    };
  }, {});
  for (const mappedQuest in mappedQuests) {
    let val = mappedQuests[mappedQuest];
    val?.sort((a, b) => a?.index - b?.index);
  }
  return mappedQuests;
}

export const getPlayerQuests = (quests) => {
  return Object.keys(quests).reduce((res, key) => {
    let [npcName, questIndex] = key.split(/([0-9]+)/);
    if (key.includes('Fishpaste')) {
      npcName = 'Fishpaste97';
    }
    return { ...res, [npcName]: { ...(res?.[npcName] || {}), [questIndex]: quests[key] } }
  }, {});
}

export const worldNpcMap = {
  "Scripticus": {
    "world": "Blunder_Hills",
    index: 0
  },
  "Glumlee": {
    "world": "Blunder_Hills",
    index: 1
  },
  "Krunk": {
    "world": "Blunder_Hills",
    index: 2
  },
  "Mutton": {
    "world": "Blunder_Hills",
    index: 3
  },
  "Woodsman": {
    "world": "Blunder_Hills",
    index: 4
  },
  "Hamish": {
    "world": "Blunder_Hills",
    index: 5
  },
  "Toadstall": {
    "world": "Blunder_Hills",
    index: 5
  },
  "Picnic_Stowaway": {
    "world": "Blunder_Hills",
    index: 6
  },
  "Promotheus": {
    "world": "Blunder_Hills",
    index: 6,
  },
  "Typhoon": {
    "world": "Blunder_Hills",
    index: 7
  },
  "Sprout": {
    "world": "Blunder_Hills",
    index: 8
  },
  "Dazey": {
    "world": "Blunder_Hills",
    index: 9
  },
  "Telescope": {
    "world": "Blunder_Hills",
    index: 10
  },
  "Stiltzcho": {
    "world": "Blunder_Hills",
    index: 11
  },
  "Funguy": {
    "world": "Blunder_Hills",
    index: 12
  },
  "Tiki_Chief": {
    "world": "Blunder_Hills",
    index: 13
  },
  "Dog_Bone": {
    "world": "Blunder_Hills",
    index: 14
  },
  "Papua_Piggea": {
    "world": "Blunder_Hills",
    index: 15
  },
  "TP_Pete": {
    "world": "Blunder_Hills",
    index: 16
  },
  "Meel": {
    "world": "Blunder_Hills",
    index: 17
  },
  "Town_Marble": {
    "world": ""
  },
  "Mr_Pigibank": {
    "world": ""
  },
  "Secretkeeper": {
    "world": ""
  },
  "Bushlyte": {
    "world": ""
  },
  "Rocklyte": {
    "world": ""
  },
  "Cowbo_Jones": {
    "world": "Yum-Yum_Desert",
    index: 0
  },
  "Fishpaste97": {
    "world": "Yum-Yum_Desert",
    index: 1
  },
  "Scubidew": {
    "world": "Yum-Yum_Desert",
    index: 2
  },
  "Whattso": {
    "world": "Yum-Yum_Desert",
    index: 3
  },
  "Bandit_Bob": {
    "world": "Yum-Yum_Desert",
    index: 4
  },
  "Carpetiem": {
    "world": "Yum-Yum_Desert",
    index: 5
  },
  "Centurion": {
    "world": "Yum-Yum_Desert",
    index: 6
  },
  "Goldric": {
    "world": "Yum-Yum_Desert",
    index: 7
  },
  "Snake_Jar": {
    "world": "Yum-Yum_Desert",
    index: 8
  },
  "XxX_Cattleprod_XxX": {
    "world": "Yum-Yum_Desert",
    index: 9
  },
  "Loominadi": {
    "world": "Yum-Yum_Desert",
    index: 10
  },
  "Wellington": {
    "world": "Yum-Yum_Desert",
    index: 11
  },
  "Djonnut": {
    "world": "Yum-Yum_Desert",
    index: 12
  },
  "Walupiggy": {
    "world": "Yum-Yum_Desert",
    index: 13
  },
  "Gangster_Gus": {
    "world": "Yum-Yum_Desert",
    index: 14
  },
  "Builder_Bird": {
    "world": ""
  },
  "Speccius": {
    "world": ""
  },
  "Postboy_Pablob": {
    "world": ""
  },
  "Desert_Davey": {
    "world": ""
  },
  "Giftmas_Blobulyte": {
    "world": ""
  },
  "Loveulyte": {
    "world": ""
  },
  "Constructor_Crow": {
    "world": ""
  },
  "Iceland_Irwin": {
    "world": ""
  },
  "Egggulyte": {
    "world": ""
  },
  "Hoggindaz": {
    "world": "Frostbite_Tundra",
    index: 0
  },
  "Worldo": {
    "world": "Frostbite_Tundra",
    index: 0
  },
  "Lord_of_the_Hunt": {
    "world": "Frostbite_Tundra",
    index: 1
  },
  "Lonely_Hunter": {
    "world": "Frostbite_Tundra",
    index: 2
  },
  "Snouts": {
    "world": "Frostbite_Tundra",
    index: 3
  },
  "Shuvelle": {
    "world": "Frostbite_Tundra",
    index: 4
  },
  "Yondergreen": {
    "world": "Frostbite_Tundra",
    index: 5
  },
  "Crystalswine": {
    "world": "Frostbite_Tundra",
    index: 6
  },
  "Bill_Brr": {
    "world": "Frostbite_Tundra",
    index: 7
  },
  "Bellows": {
    "world": "Frostbite_Tundra",
    index: 8
  },
  "Cactolyte": {
    "world": ""
  },
  "Coastiolyte": {
    "world": ""
  },
  "Gobo": {
    world: "Hyperion_Nebula",
    index: 0
  },
  "Oinkin": {
    world: "Hyperion_Nebula",
    index: 1
  },
  "Capital_P": {
    world: "Hyperion_Nebula",
    index: 2
  },
  "Blobbo": {
    world: "Hyperion_Nebula",
    index: 3
  },
  "Muhmuguh": {
    world: "Smolderin'_Plateau",
    index: 1
  },
  "Slargon": {
    world: "Smolderin'_Plateau",
    index: 2
  },
  "Pirate_Porkchop": {
    world: "Smolderin'_Plateau",
    index: 3
  },
  "Poigu": {
    world: "Smolderin'_Plateau",
    index: 4
  },
};
