import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { cardsObject, prefix } from "../Utilities";
import { Chip, InputAdornment, TextField } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import CustomTooltip from "../components/CustomTooltip";
import NavBar from "../components/NavBar";
import { Wrapper } from "../components/common-styles";

export default function Home() {
  const [value, setValue] = useState("");
  const [localCardObject, setCardObject] = useState(cardsObject);
  const preConfiguredStats = [
    "Show All",
    "Choppin",
    "Mining",
    "Fishing",
    "Catching",
    "Trapping",
    "Accuracy",
    "Card Drop",
    "Monster Exp",
    "Skill Exp",
    "Damage",
    "Drop Rate",
    "STR",
    "AGI",
    "WIS",
    "LUK",
  ];
  useEffect(() => {
    const newCards = Object.keys(cardsObject).reduce((res, cardSet) => {
      const cardsArr = cardsObject[cardSet];
      const sortedCardArr = cardsArr.filter(({ effect, alsoEffect }) => {
        const isEffect = effect?.toLowerCase()?.includes(value.toLowerCase());
        const isAlsoEffect = alsoEffect?.some((anotherEffect) =>
          anotherEffect?.toLowerCase()?.includes(value.toLowerCase())
        );
        return isEffect || isAlsoEffect;
      });
      return { ...res, [cardSet]: sortedCardArr };
    }, {});
    setCardObject(newCards);
  }, [value]);

  return (
    <Wrapper>
      <NavBar/>
      <Main style={{ padding: 10 }}>
        <h1>Search Cards by Stats</h1>
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
            Object.keys(localCardObject).map((cardSet, cardSetIndex) => {
              const cardsArr = localCardObject[cardSet];
              if (!cardsArr || cardsArr?.length === 0) return null;
              return (
                <React.Fragment key={cardSet + "" + cardSetIndex}>
                  <img
                    className="card-banner"
                    src={`${prefix}banners/${cardSet}_Cardbanner.png`}
                    alt=""
                  />
                  <div>
                    {cardsArr.map(({ img, effect, base }, index) => {
                      return (
                        <React.Fragment key={effect + "" + index}>
                          <CustomTooltip
                            header={
                              img.replace(/_/g, " ").replace(/Card.png/, "") +
                              " - " +
                              effect
                            }
                            base={base}
                          >
                            <div className={'image-wrapper'}>
                              {effect}
                              {/*<img*/}
                              {/*  className="card"*/}
                              {/*  src={`${prefix}cards/${img}`}*/}
                              {/*  alt={effect}*/}
                              {/*  height={72}*/}
                              {/*  width={52}*/}
                              {/*/>*/}
                            </div>
                          </CustomTooltip>
                          {index === 7 ? <br/> : null}
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

    .card {
      margin: 5px 10px;
      @media only screen and (max-width: 600px) {
        margin: 5px 5px;
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
