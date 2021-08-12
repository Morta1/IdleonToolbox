import React from 'react';
import styled from "styled-components";
import { prefix } from "../../Utilities";

const Equipment = ({ equipment }) => {
  return (
    <EquipmentStyle>
      {equipment?.map(({ name: equipName }, equipIndex) => {
        if (equipIndex > 7) return null;
        return (
          <Box title={equipName.replace(/_/g, " ")} key={equipName + equipIndex} img={equipName}/>
        );
      })}
    </EquipmentStyle>
  );
};

const EquipmentStyle = styled.div`
  display: grid;
  grid-template-columns: 85px 85px;
  grid-template-rows: 85px 85px;

  @media (max-width: 1440px) {
    grid-template-columns: 85px 85px;
    grid-template-rows: 85px 85px;
  }
  
  @media (max-width: 370px) {
    grid-template-columns: 60px 60px;
    grid-template-rows: 60px 60px;
  }
`;

const Box = styled.div`
  width: 85px;
  height: 85px;
  border: 1px solid white;
  background: url(${({ img }) => img !== 'None' ? `${prefix}/materials/${img}.png` : ''}) no-repeat;
  background-size: contain;

  @media (max-width: 1440px) {
    width: 85px;
    height: 85px;
  }
  
  @media (max-width: 370px) {
    width: 60px;
    height: 60px;
  }
  
  @media (max-width: 370px) {
    width: 60px;
    height: 60px;
  }
`;

export default Equipment;
