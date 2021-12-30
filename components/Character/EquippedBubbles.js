import React from 'react';
import { pascalCase, prefix } from "../../Utilities";
import styled from 'styled-components';
import { growth } from "../General/calculationHelper";
import EffectTooltip from "../Common/Tooltips/EffectTooltip";

const EquippedBubbles = ({ bubbles }) => {
  return (
    <EquippedBubblesStyled>
      {bubbles?.map((bubble, index) => {
        const { bubbleName, func, level, x1, x2 } = bubble;
        const effect = growth(func, level, x1, x2);
        const alteredBubbleName = bubbleName === 'BUG]' ? 'Bug2' : bubbleName;
        return <EffectTooltip key={alteredBubbleName + index} type={'bubble'} {...{ name: bubbleName, ...bubble }}
                              effect={effect}><img
          src={`${prefix}alchemy/${pascalCase(alteredBubbleName)}.png`}
          alt=""/>
        </EffectTooltip>;
      })}
    </EquippedBubblesStyled>
  );
};

const EquippedBubblesStyled = styled.div`
  justify-self: center;
  @media (max-width: 750px) {
    img {
      width: 48px;
      height: 48px;
    }
  }

  @media (max-width: 370px) {
    img {
      width: 36px;
      height: 36px;
    }
  }
`;

export default EquippedBubbles;
