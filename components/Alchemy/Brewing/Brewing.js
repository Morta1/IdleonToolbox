import styled from 'styled-components'
import { Checkbox, FormControlLabel, Grid, TextField } from "@material-ui/core";
import { cleanUnderscore, pascalCase, prefix } from "../../../Utilities";
import React, { useContext, useMemo, useState } from "react";
import { calcBubbleMatCost, cauldrons } from "../../General/calculationHelper";
import { AppContext } from "../../Common/context";
import Bubbles from "./Bubbles";
import "../../Common/Tooltips/NumberTooltip";
import NumberTooltip from "../../Common/Tooltips/NumberTooltip";

const Brewing = ({ account }) => {
  const { alchemy, achievements } = account;
  const { accountDisplay, alchemyGoals, setUserAlchemyGoals, setUserAccountDisplay } = useContext(AppContext);
  const [classDiscount, setClassDiscount] = useState(false);
  const [bubble, setBubble] = useState(accountDisplay?.subView || 'power');

  const [bargainTag, setBargainTag] = useState(0);

  const calculateMaterialCost = (bubbleLv, baseCost, isLiquid, cauldronName) => {
    const cauldronCostLvl = alchemy?.cauldrons?.[cauldronName]?.cost || 0;
    const undevelopedBubbleLv = alchemy?.bubbles?.kazam?.[6].level || 0;
    const barleyBrewLvl = alchemy?.vials?.[9]?.level || 0;
    const lastBubbleLvl = alchemy?.bubbles?.[cauldronName]?.[14].level || 0;
    const classMultiplierLvl = classDiscount ? (alchemy?.bubbles?.[cauldronName]?.[1].level || 0) : 0;
    const shopBargainBought = bargainTag || 0;
    const smrtAchievement = achievements[108].completed;
    return calcBubbleMatCost(bubbleLv, baseCost, isLiquid, cauldronCostLvl,
      undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
      shopBargainBought, smrtAchievement);
  }

  const handleGoalUpdate = (cauldronName, levels) => {
    setUserAlchemyGoals(cauldronName, levels);
  };

  const calculateBargainTag = () => {
    return parseFloat((25 * (Math.pow(0.75, bargainTag) - 1) / (0.75 - 1)).toFixed(1));
  }

  const handleBubbleChange = (clickedBubble) => {
    setUserAccountDisplay({ view: 'bubbles', subView: clickedBubble });
    setBubble(clickedBubble);
  }

  const getUpgradeableBubbles = (acc) => {
    const noBubbleLeftBehind = acc?.lab?.labBonuses?.find((bonus) => bonus.name === 'No_Bubble_Left_Behind')?.active;
    if (!noBubbleLeftBehind) return null;
    const allBubbles = Object.values(acc?.alchemy?.bubbles).flatMap((bubbles) => bubbles);
    const found = allBubbles.filter(({ level, index }) => level >= 5 && index < 15).sort((a, b) => a.level - b.level);
    const upgradeableBubblesAmount = acc?.lab?.jewels?.find(jewel => jewel.name === "Pyrite_Rhinestone")?.active ? 4 : 3;
    return found.slice(0, upgradeableBubblesAmount);
  }

  const upgradeableBubbles = useMemo(() => getUpgradeableBubbles(account), [account]);

  return (
    <BubblesStyle>
      {upgradeableBubbles ? <div className={'upgradeable-bubbles'}>
        <div>Next Bubble Upgrades:</div>
        <div className={'wrapper'}>
          {upgradeableBubbles?.map(({ rawName, bubbleName, level }, index) => {
            return <div className={'bubble'} key={`${rawName}-${index}`}>
              <NumberTooltip title={pascalCase(cleanUnderscore(bubbleName))}>
                <img width={48} height={48} src={`${prefix}data/${rawName}.png`}
                     alt={''}/>
              </NumberTooltip>
              <div className="level">{level}</div>
            </div>
          })}
        </div>
      </div> : null}
      <div className={'tabs'}>
        <div className={`${bubble === 'power' ? 'active' : ''}`} onClick={() => handleBubbleChange('power')}>Power
        </div>
        <div className={`${bubble === 'quicc' ? 'active' : ''}`} onClick={() => handleBubbleChange('quicc')}>Quicc</div>
        <div className={`${bubble === 'high-iq' ? 'active' : ''}`} onClick={() => handleBubbleChange('high-iq')}>High-IQ
        </div>
        <div className={`${bubble === 'kazam' ? 'active' : ''}`} onClick={() => handleBubbleChange('kazam')}>Kazam
        </div>
      </div>
      <Grid className={'header'} container spacing={1} alignItems="center" justifyContent={'center'}>
        <Grid item>
          <img width={48} height={48} src={`${prefix}data/aShopItems10.png`} alt=""/>
        </Grid>
        <Grid item>
          <StyledTextField
            variant={'outlined'}
            helperText={<span>{calculateBargainTag()}%</span>}
            type={'number'}
            value={bargainTag}
            onChange={(e) => setBargainTag(e?.target?.value)}
            inputProps={{
              min: 0,
              max: 8
            }} label="Bargain Tag Level"/>
        </Grid>
        {accountDisplay?.subView !== 'kazam' ? <Grid item style={{ marginLeft: 10 }}>
          <FormControlLabel
            control={<StyledCheckbox color='default'
                                     checked={classDiscount} onChange={() => setClassDiscount(!classDiscount)}
                                     name="classDiscount"/>}
            label="Class Discount (Bubble II)"
          />
        </Grid> : null}
      </Grid>
      {cauldrons?.map((cauldronName, index) => {
        return bubble === cauldronName ?
          <Bubbles
            onGoalUpdate={handleGoalUpdate} key={'alchemy-calc-' + cauldronName + index}
            goals={alchemyGoals?.[cauldronName]}
            bubbleCost={calculateMaterialCost}
            cauldronName={cauldronName}
            cauldron={alchemy?.bubbles?.[cauldronName]}/> : null
      })}
    </BubblesStyle>
  );
};

const StyledTextField = styled(TextField)`
  && {
    width: 200px;
  }

  && label.Mui-focused {
    color: white;
  }
`;

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

const BubblesStyle = styled.div`
  .upgradeable-bubbles {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    margin: 15px 0;

    .wrapper {
      position: relative;
      display: flex;

      .bubble {
        position: relative;

        .level {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          font-weight: bold;
          background: #000000eb;
          font-size: 13px;
          padding: 0 5px;
        }
      }
    }
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 30px;

    > div {
      cursor: pointer;
    }

    .active {
      font-weight: bold;
      border-bottom: 2px solid white;
    }

    & img {
      height: 100px;
      width: 100px;
      object-fit: contain;
    }
  }

  .header {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
    width: 100%;
  }
`;

export default Brewing;
