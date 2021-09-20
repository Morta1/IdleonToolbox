import { classColors, cleanUnderscore, prefix } from "../../Utilities";
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
import Traps from "./Traps";

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
                     traps,
                     worshipCharge,
                     dataFilters
                   }) => {
  const { strength, agility, wisdom, luck } = stats || {};
  return <CharacterStyle classColor={classColors?.[charClassName]}>
    <div className={'character-information-container'}>
      <div className={'character-profile'}>
        <div className="info">
          <div className="name">{charName}</div>
          <div>Level: {level}</div>
          <div>Class: {charClassName}</div>
          <div>Str: {strength}</div>
          <div>Agi: {agility}</div>
          <div>Wis: {wisdom}</div>
          <div>Luk: {luck}</div>
          <div>Worship Charge: {worshipCharge}</div>
        </div>
        <div className={'activity'}>
          <h4>Activity</h4>
          <img title={cleanUnderscore(afkTarget)} width={64} height={64} src={`${prefix}afk_targets/${afkTarget}.png`}
               alt=""/>
        </div>
      </div>
      {!dataFilters || dataFilters?.Equipment ? <Equipment equipment={equipment} tools={tools} foods={food}/> : null}
      {!dataFilters || dataFilters?.Talents ? <Talents talents={talents}/> : null}
      {!dataFilters || dataFilters?.Skills ? <SkillsInfo skills={skillsInfo}/> : null}
      {!dataFilters || dataFilters?.['Star Sign'] ? <StarSigns signs={starSigns}/> : null}
      {!dataFilters || dataFilters?.Cards ? <EquippedCards cards={cards}/> : null}
      {!dataFilters || dataFilters?.['Printer Products'] ?
        <PrinterProducts selected={printer?.selected} stored={printer?.stored}/> : null}
      {!dataFilters || dataFilters?.['Traps'] ?
        <Traps traps={traps}/> : null}
      {!dataFilters ||
      dataFilters?.['Anvil Products'] ||
      dataFilters?.['Equipped Bubbles'] ||
      dataFilters?.['Prayers'] ? <div className="small">
        {!dataFilters || dataFilters?.['Anvil Products'] ? <AnvilProducts products={anvil?.selected}/> : null}
        {!dataFilters || dataFilters?.['Equipped Bubbles'] ? <EquippedBubbles bubbles={equippedBubbles}/> : null}
        {!dataFilters || dataFilters?.['Prayers'] ? <Prayers prayers={prayers}/> : null}
      </div> : null}
      {!dataFilters || dataFilters?.Obols ? <Obols obols={obols} type={'character'}/> : null}
      {!dataFilters || dataFilters?.Bags ? <Bags bags={invBagsUsed} capBags={carryCapBags}/> : null}
    </div>
  </CharacterStyle>
};

const CharacterStyle = styled.div`
  margin-bottom: 15px;

  .character-profile {
    display: flex;
    justify-content: space-around;
    margin: 15px 0;

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