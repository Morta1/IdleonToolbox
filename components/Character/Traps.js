import React from 'react';
import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';

const Traps = ({ traps }) => {
  return (
    <TrapsStyled>
      {[...traps]?.map(({ name, rawName }, index) => {
        return <img title={cleanUnderscore(name)} key={name + index}
                    src={`${prefix}data/${rawName}.png`} alt=""/>;
      })}
    </TrapsStyled>
  );
};

const TrapsStyled = styled.div`
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

export default Traps;
