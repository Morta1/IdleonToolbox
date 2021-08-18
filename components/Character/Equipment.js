import React from 'react';
import styled from "styled-components";
import { cleanUnderscore, prefix } from "../../Utilities";

const Equipment = ({ equipment }) => {
  return (
    <EquipmentStyle>
      {equipment?.map(({ name: equipName }, equipIndex) => {
        if (equipIndex > 7) return null;
        return (
          <Box aria-label={equipName} role="img" title={cleanUnderscore(equipName)} key={equipName + equipIndex}
               img={equipName}/>
        );
      })}
    </EquipmentStyle>
  );
};

const EquipmentStyle = styled.div`
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(2, max-content);
  grid-template-rows: repeat(4, 85px);
`;

const Box = styled.div`
  width: 85px;
  height: 85px;
  border: 1px solid #7b7b7b8c;
  background: url(${({ img }) => img !== 'None' ? `${prefix}materials/${img}.png` : ''}) no-repeat;
  background-size: contain;

  //@media (max-width: 1440px) {
  //  width: 85px;
  //  height: 85px;
  //}
  //
  //@media (max-width: 370px) {
  //  width: 60px;
  //  height: 60px;
  //}
  //
  //@media (max-width: 370px) {
  //  width: 60px;
  //  height: 60px;
  //}
`;

export default Equipment;
