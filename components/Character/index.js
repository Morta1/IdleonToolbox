import { classColors, prefix } from "../../Utilities";
import Equipment from "./Equipment";
import styled from "styled-components";
import EquippedBubbles from "./EquippedBubbles";
import SkillsInfo from "./SkillsInfo";
import Bags from "./Bags";
import AnvilProducts from "./AnvilProducts";
import PrinterProducts from "./PrinterProducts";
import StarSigns from "./StarSign";
import EquippedCards from "./EquippedCards";
import Obols from "./Obols";

const Character = ({
                     name: charName,
                     level,
                     class: charClassName,
                     equipment,
                     tools,
                     food,
                     equippedBubbles,
                     skillsInfo,
                     invBagsUsed,
                     carryCapBags,
                     anvil,
                     printer,
                     starSigns,
                     cards,
                     stats,
                     obols
                   }) => {
  const { strength, agility, wisdom, luck } = stats || {};
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
    <div className={'character-information-container'}>
      <Equipment equipment={equipment} tools={tools} foods={food}/>
      <SkillsInfo skills={skillsInfo}/>
      <Bags bags={invBagsUsed} capBags={carryCapBags}/>
      <Obols obols={obols} type={'character'}/>
      <EquippedCards cards={cards}/>
      <div className="small">
        <StarSigns signs={starSigns}/>
        <AnvilProducts products={anvil?.selected}/>
        <PrinterProducts products={printer?.selected}/>
        <EquippedBubbles bubbles={equippedBubbles}/>
      </div>
    </div>
  </CharacterStyle>
};

const CharacterStyle = styled.div`
  margin-bottom: 15px;

  .character-profile {
    display: flex;
    align-items: center;
    margin: 15px 0;
    min-height: 110px;

    .list & {
      justify-content: center;
    }

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

  .character-information-container {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    grid-template-rows: repeat(1, 465px);
    justify-content: center;

    .small {
      display: grid;
      grid-template-rows: repeat(4, minmax(36px, 72px));
      row-gap: 30px;
    }

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(1, 465px);
    }
  }
`;

export default Character;