import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Chip, InputAdornment, TextField } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import { cards, stats } from "../data/website-data";
import { cleanUnderscore, prefix } from "../Utilities";
import CustomTooltip from "../components/Common/Tooltips/CustomTooltip";
import { Wrapper } from "./Common/commonStyles";
import { calcCardBonus } from "../parser/parserUtils";

const categoriesOrder = ["Blunder_Hills", "Yum_Yum_Desert", "Easy_Resources",
  "Medium_Resources", "Frostbite_Tundra", "Hard_Resources", 'Hyperion_Nebula', "Dungeons", "Bosses", "Events"];

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

export default function CardSearch({ userData }) {
  const [value, setValue] = useState("");
  const mapCards = (cardsArray) => {
    return Object.entries(cardsArray)?.reduce((res, [, cardDetails]) => {
      const { category } = cardDetails;
      return { ...res, [category]: [...(res?.[category] || []), cardDetails] };
    }, {});
  }
  const cardsObject = useMemo(() => mapCards(cards), [cards]);
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
    "Monster Exp",
    "Skill Exp",
    "Damage",
    "Drop Rate",
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
        const cleanEffect = effect.replace(/[+]?[%]?_/, '').replace(/_/g, ' ');
        const isEffect = cleanEffect?.toLowerCase()?.includes(value.toLowerCase())
        const additionalEffect = additionalEffects[value.toLowerCase()]?.includes(cleanUnderscore(cleanEffect));
        return isEffect || additionalEffect;
      });
      return { ...res, [cardSet]: sortedCardArr };
    }, {});
    setLocalCardObject(newCards);
  }, [value]);

  return (
    <Wrapper>
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

        <div className="chips">
          {preConfiguredStats.map((stat, index) => (
            <Chip
              key={stat + "" + index}
              className="chip"
              size="small"
              variant="outlined"
              label={stat}
              onClick={() => {
                setValue(stat === "Show All" ? "" : stat);
              }}
            />
          ))}
        </div>

        <div className="cards">
          {Object.keys(localCardObject)?.length > 0 ? (
            categoriesOrder.map((cardSet, cardSetIndex) => {
              const cardsArr = localCardObject[cardSet];
              if (!cardsArr || cardsArr?.length === 0) return null;
              return (
                <React.Fragment key={cardSet + "" + cardSetIndex}>
                  <img
                    className="card-banner"
                    src={`${prefix}banners/${cardSet}_Cardbanner.png`}
                    alt=""
                  />
                  <div className={'category-wrapper'}>
                    {cardsArr.map(({ rawName, displayName, cardIndex, effect, bonus }, index) => {
                      const { stars } = userData?.account?.cards?.[displayName] || {};
                      return (
                        <React.Fragment key={effect + "" + index}>
                          <CustomTooltip
                            cardName={cleanUnderscore(displayName)}
                            effect={cleanUnderscore(effect)}
                            bonus={calcCardBonus({ bonus, stars })}
                          >
                            <div className={'card-wrapper'}>
                              {stars > 0 ?
                                <img className="border" src={`${prefix}data/CardEquipBorder${stars}.png`} alt=""/> : null}
                              <img
                                className="card"
                                src={`${prefix}data/2Cards${cardIndex}.png`}
                                alt={effect}
                                height={76}
                                width={58}
                              />
                            </div>
                          </CustomTooltip>
                          {index === 7 || index === 15 || index === 23 ? <br/> : null}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="not-found">Please try another phrase</div>
          )}
        </div>
      </Main>
    </Wrapper>
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

    .card-wrapper {
      position: relative;
      display: inline-block;

      .card {
        margin: 5px 10px;
      }

      .border {
        position: absolute;
        left: 5px;
        top: 5px;
      }

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

  h1 {
    color: white;
  }


`;
