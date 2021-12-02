import React from 'react';
import styled from 'styled-components';
import { cleanUnderscore } from "../../Utilities";

const StarSigns = ({ signs }) => {
  return (
    <StarSignsStyled>
      <span className={'title'}>Star Signs</span>
      <div className={'star-signs-wrapper'}>
        {signs?.map(({ starName, bonuses }, index) => {
          return name !== "None" ? <div key={name + index}>
            <span>{cleanUnderscore(name)}</span>
            <span>{cleanUnderscore(bonuses?.join(','))}</span>
          </div> : null;
        })}
      </div>

    </StarSignsStyled>
  );
};

const StarSignsStyled = styled.div`
  text-align: center;


  .title {
    color: #8181de;
    font-weight: bold;
  }

  .star-signs-wrapper {
    display: flex;
    justify-content: center;

    > div {
      text-align: center;
      max-width: 250px;

      > span {
        margin: 0 5px;
        display: block;

        :nth-child(1) {
          color: #3d85d0;
          font-weight: bold;
        }
      }
    }
  }
`;

export default StarSigns;
