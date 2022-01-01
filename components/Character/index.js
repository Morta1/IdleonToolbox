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
import PostOffice from "./PostOffice";
import CoinDisplay from "../General/CoinDisplay";
import { LinearProgressWithLabel } from "../Common/commonStyles";

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
                     starTalents,
                     afkTarget,
                     prayers,
                     traps,
                     worship,
                     postOffice,
                     dataFilters,
                     money,
                     crystalSpawnChance,
                     afkTime
                   }) => {
  const { strength, agility, wisdom, luck } = stats || {};

  const isOvertime = () => {
    const hasUnendingEnergy = prayers?.find(({ name }) => name === 'Unending_Energy');
    const hours = afkTime?.match(/([0-9]+)h:/g)?.[0].match(/[0-9]+/)[0];
    return hasUnendingEnergy && parseInt(hours) > 10;
  }

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
          <div className={isOvertime() ? 'overtime' : ''}>Afk Time: {afkTime ? afkTime : 'Active'}</div>
          <div style={{ marginTop: 10 }}>Crystal Spawn Chance:</div>
          <div style={{ marginBottom: 10 }}> 1 in {Math.floor(1 / crystalSpawnChance)}</div>
          <div>Worship Charge: {Math.round(worship?.chargeRate * 24)}%/day</div>
          <div>Current Charge: {worship?.currentCharge}</div>
          <div>Max Charge: {worship?.maxCharge}</div>
          <LinearProgressWithLabel barcolor={'#903dd3'} barbgcolor={'#dddddd'}
                                   value={worship?.currentCharge / (worship?.maxCharge || worship?.currentCharge) * 100}/>
          <div style={{ margin: '10px 0' }}><CoinDisplay money={money}/></div>
        </div>
        {!dataFilters || dataFilters?.Activity ? <div className={'activity'}>
          <h4>Activity</h4>
          {afkTarget && afkTarget !== '_' ?
            <img title={cleanUnderscore(afkTarget)} width={64} height={64} src={`${prefix}afk_targets/${afkTarget}.png`}
                 alt=""/> : <div>
              <img title={'Nothing'} width={64} height={64} src={`${prefix}data/Afkz5.png`}
                   alt=""/>
              <div>Nothing</div>
            </div>}
        </div> : null}
      </div>
      {!dataFilters || dataFilters?.Equipment ? <Equipment equipment={equipment} tools={tools} foods={food}/> : null}
      {!dataFilters || dataFilters?.Talents ? <Talents talents={talents} starTalents={starTalents}/> : null}
      {!dataFilters || dataFilters?.Skills ? <SkillsInfo skills={skillsInfo} charName={charName}/> : null}
      {!dataFilters || dataFilters?.['Star Sign'] ? <StarSigns signs={starSigns}/> : null}
      {!dataFilters || dataFilters?.Cards ? <EquippedCards cards={cards}/> : null}
      {!dataFilters || dataFilters?.['Printer Products'] ?
        <PrinterProducts selected={printer?.selected} stored={printer?.stored}/> : null}
      {!dataFilters || dataFilters?.['Traps'] ?
        <Traps trap={tools?.[4]} traps={traps}/> : null}
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
      {!dataFilters || dataFilters?.['Post Office'] ? <PostOffice postOffice={postOffice}/> : null}
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

  .overtime {
    font-weight: bold;
    color: #f91d1d;
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