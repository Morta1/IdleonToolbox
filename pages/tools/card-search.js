import React, { useContext, useEffect, useMemo, useState } from "react";
import { Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { cleanUnderscore, prefix } from "utility/helpers";
import { cards, cardSets, stats } from "data/website-data";
import ClearIcon from '@mui/icons-material/Clear';
import styled from "@emotion/styled";
import { AppContext } from "components/common/context/AppProvider";
import { CardAndBorder } from "components/common/styles";
import { calculateAmountToNextLevel } from "../../parsers/cards";

const categoriesOrder = ["Card Sets", "Blunder_Hills", "Yum_Yum_Desert", "Easy_Resources",
  "Medium_Resources", "Frostbite_Tundra", "Hard_Resources", 'Hyperion_Nebula', "Smolderin'_Plateau", "Dungeons", "Bosses", "Events"];

const additionalEffects = {
  choppin: [stats.BaseWIS, stats.SkillAFKgainrate],
  catching: [stats.BaseAGI, stats.SkillAFKgainrate],
  mining: [stats.BaseSTR, stats.SkillAFKgainrate, stats.BaseHP, stats.BoostFoodEffect],
  fishing: [stats.BaseSTR, stats.SkillAFKgainrate, stats.BaseHP, stats.BoostFoodEffect],
  trapping: [stats.BaseAGI, stats.SkillAFKgainrate, stats.ShinyCritterChance],
  damage: [stats.WeaponPower, stats.CriticalChance],
  'drop rate': [stats.BaseLUK],
  'card drop': [stats.BaseLUK, stats.TotalDropRate],
  'monster exp': [stats.EXPfrommonsters],
  dungeon: [stats.BlockChance, stats.RNGitemrarity, stats.tostartwithRNGitem],
  worship: [stats.StartingPtsinWorship, stats.ChargeRate, stats.MaxCharge, stats.SkillEXP]
}

export default function CardSearch() {
  const { state } = useContext(AppContext);
  const [value, setValue] = useState("");
  const mapCards = (cardsArray, cardSets) => {
    const cards = Object.entries(cardsArray)?.reduce((res, [, cardDetails]) => {
      const { category } = cardDetails;
      return { ...res, [category]: [...(res?.[category] || []), cardDetails] };
    }, {});
    const cardSetArr = Object.entries(cardSets).map(([, cardSetValue]) => {
      return cardSetValue
    }, []);
    return { ...cards, ['Card Sets']: cardSetArr };
  }
  const cardsObject = useMemo(() => mapCards(cards, cardSets), [cards]);
  const [localCardObject, setLocalCardObject] = useState(cardsObject);
  const preConfiguredStats = [
    "Show All",
    'Afk',
    "Choppin",
    "Mining",
    "Fishing",
    "Catching",
    "Trapping",
    "Worship",
    "Accuracy",
    "Card Drop",
    "Drop Rate",
    "Monster Exp",
    "Skill Exp",
    "Damage",
    "Dungeon",
    "STR",
    "AGI",
    "WIS",
    "LUK",
  ];

  useEffect(() => {
    const newCards = Object.keys(cardsObject).reduce((res, cardSet) => {
      const cardsArr = cardsObject[cardSet];
      const sortedCardArr = cardsArr.filter(({ effect }) => {
        const cleanEffect = effect.replace(/[+%{]+_/, '').replace(/_/g, ' ');
        const isEffect = cleanEffect?.toLowerCase()?.includes(value.toLowerCase())
        const additionalEffect = additionalEffects[value.toLowerCase()]?.includes(cleanUnderscore(cleanEffect));
        return isEffect || additionalEffect;
      });
      return { ...res, [cardSet]: sortedCardArr };
    }, {});
    setLocalCardObject(newCards);
  }, [value]);

  return (
    <>
      <Main style={{ padding: 10 }}>
        <StyledTextField
          InputProps={{
            endAdornment: (
              <StyledInputAdornment onClick={() => setValue("")} position="end">
                <ClearIcon/>
              </StyledInputAdornment>
            ),
          }}
          label="Enter Card stat.."
          type="text"
          value={value}
          onChange={({ target }) => setValue(target?.value)}
        />

        <Stack direction={'row'} my={2} gap={1} flexWrap={'wrap'}>
          {preConfiguredStats.map((stat, index) => (
            <Chip
              sx={{
                borderRadius: '8px',
                height: 24,
                minWidth: 60,
                maxWidth: 150,
                border: '1px solid gray'
              }}
              key={stat + "" + index}
              size="small"
              variant="outlined"
              label={stat}
              onClick={() => {
                setValue(stat === "Show All" ? "" : stat);
              }}
            />
          ))}
        </Stack>

        <div className="cards">
          {Object.keys(localCardObject)?.length > 0 ? (
            categoriesOrder.map((cardSet, cardSetIndex) => {
              const cardsArr = localCardObject[cardSet];
              if (!cardsArr || cardsArr?.length === 0) return null;
              const isCardSets = cardSet === 'Card Sets';
              return (
                <React.Fragment key={cardSet + "" + cardSetIndex}>
                  {isCardSets ? <Typography my={1} variant={'h4'}>Card Sets</Typography> :
                    <img src={`${prefix}etc/${cardSet}_Card_Header.png`}
                         style={{ margin: '15px 0 10px 0' }}
                         alt=""
                    />}
                  <Stack direction={'row'} flexWrap={'wrap'} gap={2} sx={{ maxWidth: 600 }}>
                    {cardsArr.map((card, index) => {
                      const { displayName } = card;
                      const { stars, amount, perTier } = state?.account?.cards?.[displayName] || {};
                      const nextLevelReq = calculateAmountToNextLevel(perTier, amount);
                      return (
                        <div style={{ position: 'relative' }} key={displayName + "" + index}>
                          <CardAndBorder nextLevelReq={nextLevelReq} amount={amount}
                                         variant={isCardSets ? 'cardSet' : ''} showInfo
                                         {...{ ...card, ...(isCardSets ? {} : { stars }) }}
                          />
                        </div>
                      );
                    })}
                  </Stack>
                </React.Fragment>
              );
            })
          ) : (
            <div className="not-found">Please try another phrase</div>
          )}
        </div>
      </Main>
    </>
  );
}

const StyledTextField = styled(TextField)`
  && label.Mui-focused {
    color: rgba(255, 255, 255, 0.7);
  }

  & .MuiInput-underline:after {
    border-bottom-color: green;
  }
`;

const StyledInputAdornment = styled(InputAdornment)`
  cursor: pointer;
`;

const Main = styled.main`
  color: white;

  .chips {
    margin: 20px 0;

    .chip {
      margin-right: 10px;
      margin-top: 8px;
    }
  }

  .cards {
    min-height: 600px;

    .category-wrapper {


    }

    .card-banner {
      margin: 10px;
      display: block;
    }

    .not-found {
      margin: 20px;
      font-size: 30px;
    }

    .image-wrapper {
      display: inline-block;
    }
  }
`;
