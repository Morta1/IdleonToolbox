import React from 'react';
import { cleanUnderscore, pascalCase, prefix } from "../../Utilities";
import styled from 'styled-components';

const EquippedBubbles = ({ bubbles }) => {
  return (
    <EquippedBubblesStyled>
      {bubbles?.map(({ bubbleName }, index) => {
        const alteredBubbleName = bubbleName === 'BUG]' ? 'Bug2' : bubbleName;
        return <img title={cleanUnderscore(alteredBubbleName)} key={alteredBubbleName + index}
                    src={`${prefix}alchemy/${pascalCase(alteredBubbleName)}.png`} alt=""/>;
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
