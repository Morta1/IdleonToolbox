import styled from 'styled-components'
import { Checkbox, FormControlLabel, Grid, TextField } from "@material-ui/core";
import { prefix } from "../../../Utilities";
import React, { useContext, useState } from "react";
import { calcBubbleMatCost, cauldrons } from "../../General/calculationHelper";
import { AppContext } from "../../Common/context";
import Bubbles from "./Bubbles";

const Brewing = ({ alchemy }) => {
  const { accountDisplay, alchemyGoals, setUserAlchemyGoals } = useContext(AppContext);
  const [classDiscount, setClassDiscount] = useState(false);

  const [bargainTag, setBargainTag] = useState(0);

  const calculateMaterialCost = (bubbleLv, baseCost, isLiquid, cauldronName) => {
    const cauldronCostLvl = alchemy?.cauldrons?.[cauldronName]?.cost || 0;
    const undevelopedBubbleLv = alchemy?.bubbles?.kazam?.[6].level || 0;
    const barleyBrewLvl = alchemy?.vials?.[9]?.level || 0;
    const lastBubbleLvl = alchemy?.bubbles?.[cauldronName]?.[14].level || 0;
    const classMultiplierLvl = classDiscount ? (alchemy?.bubbles?.[cauldronName]?.[1].level || 0) : 0;
    const shopBargainBought = bargainTag || 0;
    return calcBubbleMatCost(bubbleLv, baseCost, isLiquid, cauldronCostLvl,
      undevelopedBubbleLv, barleyBrewLvl, lastBubbleLvl, classMultiplierLvl,
      shopBargainBought);
  }

  const handleGoalUpdate = (cauldronName, levels) => {
    setUserAlchemyGoals(cauldronName, levels);
  };

  const calculateBargainTag = () => {
    return parseFloat((25 * (Math.pow(0.75, bargainTag) - 1) / (0.75 - 1)).toFixed(1));
  }

  return (
    <BubblesStyle>
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
        <Grid item style={{ marginLeft: 10 }}>
          <FormControlLabel
            control={<StyledCheckbox color='default'
                                     checked={classDiscount} onChange={() => setClassDiscount(!classDiscount)}
                                     name="classDiscount"/>}
            label="Class Discount (Bubble II)"
          />
        </Grid>
      </Grid>
      {cauldrons?.map((cauldronName, index) => {
        return accountDisplay?.subView === cauldronName ?
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
  .header {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;
    width: 100%;
  }
`;

export default Brewing;
