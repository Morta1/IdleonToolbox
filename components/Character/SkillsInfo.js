import React from 'react';
import styled from 'styled-components';
import { prefix } from "../../Utilities";

const SkillsInfo = ({ skills }) => {
  return (
    <SkillsInfoStyled>
      {Object.keys(skills)?.map((skillName, index) => {
        const skillLevel = skills[skillName];
        if (skillName === 'character') return null;
        return <Skill key={index}>
          <img title={skillName.capitalize()} src={`${prefix}icons/${skillName.capitalize()}_Icon.png`} alt=""/>
          <div>LV {skillLevel}</div>
        </Skill>;
      })}
    </SkillsInfoStyled>
  );
};

const SkillsInfoStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(45px, 70px));
  grid-template-rows: repeat(3, minmax(45px, 70px));
  grid-auto-flow: column;
  justify-content: center;  
`;

const Skill = styled.div`
  justify-self: center;
  margin-bottom: 5px;
  text-align: center;

  > div {
    font-size: 16px;
    @media (max-width: 370px) {
      font-size: 12px;
    }
  }

  > img {
    width: 38px;
    height: 36px;
    @media (max-width: 370px) {
      width: 24px;
      height: 24px;
    }
  }
`;

export default SkillsInfo;
