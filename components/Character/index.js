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
import Talents from "./Talents";
import Prayers from "./Prayers";

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
                     obols,
                     talents,
                     afkTarget,
                     prayers,
                     fields
                   }) => {
  const { strength, agility, wisdom, luck } = stats || {};
  return <CharacterStyle classColor={classColors?.[charClassName]}>
    <div className={'character-information-container'}>
      <div className={'character-profile'}>
        {/*<img src={`${prefix}classes/${charClassName}.png`} alt=""/>*/}
        <div className="info">
          <div className="name">{charName}</div>
          <div>Level: {level}</div>
          <div>Class: {charClassName}</div>
          <div>Str: {strength}</div>
          <div>Agi: {agility}</div>
          <div>Wis: {wisdom}</div>
          <div>Luk: {luck}</div>
        </div>
        <div className={'activity'}>
          <h4>Activity</h4>
          <img width={64} height={64} src={`${prefix}afk_targets/${afkTarget}.png`} alt=""/>
        </div>
      </div>
      {!fields || fields?.Equipment ? <Equipment equipment={equipment} tools={tools} foods={food}/> : null}
      {!fields || fields?.Talents ? <Talents talents={talents}/> : null}
      {!fields || fields?.Skills ? <SkillsInfo skills={skillsInfo}/> : null}
      {!fields || fields?.Bags ? <Bags bags={invBagsUsed} capBags={carryCapBags}/> : null}
      {!fields || fields?.Obols ? <Obols obols={obols} type={'character'}/> : null}
      {!fields || fields?.Cards ? <EquippedCards cards={cards}/> : null}
      {!fields || fields?.['Star Sign'] ||
      fields?.['Anvil Products'] ||
      fields?.['Printer Products'] ||
      fields?.['Equipped Bubbles'] ||
      fields?.['Prayers'] ? <div className="small">
        {!fields || fields?.['Star Sign'] ? <StarSigns signs={starSigns}/> : null}
        {!fields || fields?.['Anvil Products'] ? <AnvilProducts products={anvil?.selected}/> : null}
        {!fields || fields?.['Printer Products'] ? <PrinterProducts products={printer?.selected}/> : null}
        {!fields || fields?.['Equipped Bubbles'] ? <EquippedBubbles bubbles={equippedBubbles}/> : null}
        {!fields || fields?.['Prayers'] ? <Prayers prayers={prayers}/> : null}
      </div> : null}
    </div>
  </CharacterStyle>
};

const CharacterStyle = styled.div`
  margin-bottom: 15px;

  .character-profile {
    display: grid;
    grid-auto-columns: min-content;
    grid-template-columns: repeat(2, 180px);
    margin: 15px 0;
    padding: 0 50px;

    > div {
      justify-self: center;
      align-items: flex-start;
    }

    .activity {
      > img {
        object-fit: contain;
      }
    }

    .list & {
      justify-content: center;
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
    margin-top: 15px;
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, 360px);
    justify-content: center;

    .small {
      display: grid;
      grid-template-rows: repeat(auto-fit, minmax(36px, 72px));
      row-gap: 30px;
    }

    @media (max-width: 785px) {
    }
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
`;

export default Character;