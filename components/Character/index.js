import { classColors, prefix } from "../../Utilities";
import Equipment from "./Equipment";
import styled from "styled-components";
import EquippedBubbles from "./EquippedBubbles";
import SkillsInfo from "./SkillsInfo";
import Bags from "./Bags";

const Character = ({
                     name: charName,
                     level,
                     class: charClassName,
                     equipment,
                     tools,
                     bubblesEquipped,
                     skillLevels,
                     invBagsUsed,
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
      <Bags bags={invBagsUsed}/>
      <EquippedBubbles bubbles={bubblesEquipped}/>
    </div>
  </CharacterStyle>
};

const CharacterStyle = styled.div`
  margin-bottom: 15px;

  .list & {

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
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    justify-content: center;
    @media(max-width: 600px){
      grid-template-columns: 1fr;
    }
  }
`;

export default Character;