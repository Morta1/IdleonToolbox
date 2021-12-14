import React from 'react';
import styled from 'styled-components';
import { prefix } from "../../Utilities";

const SkillsInfo = ({ skills }) => {
  return (
    <SkillsInfoStyled>
      {Object.keys(skills)?.map((skillName, index) => {
        const { level, rank } = skills[skillName];
        if (skillName === 'character') return null;
        return <Skill key={index} highest={rank}>
          <img title={skillName.capitalize()} src={`${prefix}icons/${skillName.capitalize()}_Icon.png`} alt=""/>
          <div>LV {level}</div>
          <div className={'rank'}>Rank: {rank}</div>
        </Skill>;
      })}
    </SkillsInfoStyled>
  );
};

const SkillsInfoStyled = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(45px, 100px));
  grid-template-rows: repeat(3, minmax(45px, 100px));
  grid-auto-flow: column;
  justify-content: center;
`;

const Skill = styled.div`
  position: relative;
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

  .rank {
    color: ${({ highest }) => {
      switch (highest) {
        case 1:
          return '#98f700';
        case 2:
          return '#f1ac2efc';
        case 3:
          return '#ffeb00f2';
        default:
          return 'white'
      }
    }};
    font-weight: ${({ highest }) => highest === 1 || highest === 2 || highest === 3 ? 'bold' : 'normal'};
  }
`;

export default SkillsInfo;
