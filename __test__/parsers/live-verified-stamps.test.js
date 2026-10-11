import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getExaltedStampBonus, getStampsBonusByStat, getStampsPerDay } from '@parsers/world-1/stamps';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // 5 * bun_s + 3 * EventShopOwned(1) + WinBonus(20), and Windwalker("StampDoubler")
  stampsPerDay: 12,
  exaltedStampBonus: 262.8281818181818,
  // StampBonusOfTypeX(stat) for every stat in CustomLists.StampBonusIndex, rebuilt with an empty
  // StampBonuses_Map_Of_Val cache. ShopQty is left out: Vendor Stamp gained 12 levels after the export.
  // Level_Exemption is unlocked on this account, so no stamp is held back by the skill level here.
  stampBonus: {
    BaseDmg: 323759.9993963636, PctDmg: 765.171366348932, BaseHP: 51064.00000000001, BaseMP: 3085,
    BaseAcc: 24596, BaseDef: 8309.6, PctMoveSpd: 11.046511627906977, CritDmg: 65.30907272727273,
    BaseSTR: 5635, PctSTR: 0, BaseAGI: 1260, PctAGI: 0, BaseWIS: 4800, PctWIS: 0, BaseLUK: 1970, PctLUK: 0,
    BaseAllStat: 3365.2313863636364, BossDmg: 43.212669683257914, DropRate: 153.17843473646977,
    AllStatPct: 10.141509433962263, classxp: 0,
    BaseMinEff: 3312.5, BaseChopEff: 3597.5, AnvilPAspd: 1125, MinCap: 3646.4232272727268,
    DoubleMin: 34.23913043478261, ChopCap: 3537.574772727273, DoubleChop: 33.088235294117645,
    MatCap: 4408.362409090909, MinExp: 1195, ChopExp: 1042.5, SmithExp: 0, AlchSpd: 650, AlchExp: 937.5,
    LiquidSpd: 3555.7161818181817, LiquidCap: 3283.5950454545455, BaseFishEff: 1750, FishExp: 875,
    BaseCatchEff: 2225, CatchExp: 767.5, FishCap: 4245.089727272727, DoubleFish: 45.525727069351234,
    CatchCap: 3664.5646363636365, DoubleCatch: 44.117647058823536, TrappingEff: 2160, ShinyChance: 902.5,
    TrappingExp: 570, CogProd: 0, SampleRate: 20.89853609288238, ConstructionExp: 2993.3325000000004,
    WorshipEff: 0, WorshipCharge: 995, WorshipMax: 0, WorshipPTS: 735, MealCook: 9796.360909090909,
    RecipeCook: 2475, CookingEff: 107034.31363636364, BreedExp: 1005, NewPet: 4489.99875, LabExp: 955,
    SailSpd: 1132.5, GamingExp: 1105, DivineExp: 3192.888, BaseAllEff: 0, FishEffPerLv: 0.4735449735449736,
    CropEvo: 5575, SneakExp: 89.35361216730038, JadeCoin: 412.5, SummonExp: 239.6035162950257,
    WhiteEss: 800, '123Ess': 972.5, '456Ess': 640, spelunkamb: 0, spelunkxp: 51.181102362204726, spelunkeff: 0,
    QuestExp: 62.290748898678416, AllCarryCap: 1375.118809090909, CrySpawn: 355.7293695652174,
    BFood: 1396.8885, HFood: 0, CardDrop: 1458.5692909090908, Talent1: 0, Talent2: 370, Talent3: 362,
    Talent4: 482, Talent5: 0, TalentS: 326, GFood: 1335.207709090909, Overkill: 1197.333,
    BookSpd: 1356.9774, ArcadeTimeMax: 39.96080249066002, ArcadeBallz: 0, GoldBallz: 121.72300293255131,
    DNAsplice: 329, RefinerySpd: 1447.6844454545455, AtomCost: 59.60748701298701,
    ForgeCap: 254.58243189368773, SigilCharge: 29.01098901098901, CavernRes: 44.93392070484582,
    VillageStudy: 70.23259483975005, krukd: 399.111, corale: 0
  },
  // The same rebuild with Ninja("EmporiumBonus", 5) hooked to 0, so StampOverLevel holds skill stamps
  // back by the character's skill level. Only the stats that moved are listed.
  stampBonusWithoutLevelExemption: {
    BaseMinEff: 317.5, BaseChopEff: 410, AnvilPAspd: 310, MinCap: 380.96959090909087,
    DoubleMin: 14.423076923076923, ChopCap: 471.67663636363636, DoubleChop: 15.76086956521739,
    MatCap: 1932.060068181818, MinExp: 62.5, ChopExp: 77.5, AlchExp: 270, BaseFishEff: 105, FishExp: 52.5,
    BaseCatchEff: 130, CatchExp: 60, FishCap: 290.26254545454543, DoubleFish: 17.21311475409836,
    CatchCap: 326.5453636363636, DoubleCatch: 18.253968253968253, TrappingEff: 610, ShinyChance: 172.5,
    TrappingExp: 105, WorshipCharge: 87.5, WorshipPTS: 187.5
  },
  // Lv0[2] at the reading; the save is one smithing level behind
  smithingLevel: 160
};

const { account, characters } = parseFixture(latest);
const loggedIn = characters.find(({ name }) => name === 'IAmTheHunterrr');

describe('stamps verified against the live game', () => {
  it('No Stamp Left Behind and the Exalted multi', () => {
    expect(getStampsPerDay(account).value).toBe(GAME.stampsPerDay);
    within(getExaltedStampBonus(account).value, GAME.exaltedStampBonus);
  });

  it.each(Object.entries(GAME.stampBonus))('StampBonusOfTypeX(%s)', (stat, value) => {
    within(getStampsBonusByStat(account, stat, loggedIn), value);
  });

  describe('held back by the skill level without Level Exemption', () => {
    const lockedAccount = {
      ...account,
      sneaking: {
        ...account.sneaking,
        jadeEmporium: account.sneaking.jadeEmporium.map((bonus) => bonus.name === 'Level_Exemption'
          ? { ...bonus, unlocked: false }
          : bonus)
      }
    };
    const liveCharacter = {
      ...loggedIn,
      skillsInfoArray: loggedIn.skillsInfoArray.map((skill, index) => index === 2
        ? { ...skill, level: GAME.smithingLevel }
        : skill)
    };

    it.each(Object.entries(GAME.stampBonusWithoutLevelExemption))('StampBonusOfTypeX(%s)', (stat, value) => {
      within(getStampsBonusByStat(lockedAccount, stat, liveCharacter), value);
    });
  });
});
