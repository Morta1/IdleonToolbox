import { classColors, prefix } from "../../Utilities";
import Equipment from "./Equipment";
import styled from "styled-components";
import EquippedBubbles from "./EquippedBubbles";
import SkillsInfo from "./SkillsInfo";

const Character = ({
                     name: charName,
                     level,
                     class: charClassName,
                     equipment,
                     tools,
                     bubblesEquipped,
                     skillLevels,
                     strength, agility, wisdom, luck
                   }) => {
  return <CharacterStyle classColor={classColors?.[charClassName]}>
    <div className={'character-profile'}>
      <img src={`${prefix}classes/${charClassName}.png`} alt=""/>
      <div className="info">
        <div className="name">Name: {charName}</div>
        <div>Level: {level}</div>
        <div>Class: {charClassName}</div>
        <div>Str: {strength}</div>
        <div>Agi: {agility}</div>
        <div>Wis: {wisdom}</div>
        <div>Luk: {luck}</div>
      </div>
    </div>
    <div className={'row'}>
      <Equipment equipment={equipment}/>
      <Equipment equipment={tools}/>
      <SkillsInfo skills={skillLevels}/>
      <EquippedBubbles bubbles={bubblesEquipped}/>
    </div>
  </CharacterStyle>
};

const CharacterStyle = styled.div`
  margin-bottom: 15px;

  .list & {
    display: grid;
    place-content: center;
  }

  .character-profile {
    display: flex;
    align-items: center;
    margin: 15px 0;
    min-height: 110px;

    > img {
      margin-right: 10px;
    }

    @media (max-width: 750px) {
      justify-content: center;
    }
  }

  .name {
    font-weight: bold;
    color: ${({ classColor }) => classColor || 'white'};
  }

  .row {
    display: grid;
    grid-column-gap: 15px;
    grid-template-columns: 170px 170px 210px;
    grid-row-gap: 15px;

    @media (max-width: 1440px) {
      grid-column-gap: 15px;
      grid-template-columns: 170px 170px 210px;
    }

    @media (max-width: 750px) {
      grid-column-gap: 0;
      grid-template-columns: 170px 170px;
    }

    @media (max-width: 370px) {
      grid-column-gap: 0;
      grid-template-columns: 120px 120px;
      justify-content: center;
    }
  }
`;

export default Character;