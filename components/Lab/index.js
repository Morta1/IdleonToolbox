import styled from 'styled-components'
import { prefix } from "../../Utilities";
import JewelTooltip from "../Common/Tooltips/JewelTooltip";
import LabBonusTooltip from "../Common/Tooltips/LabBonusTooltip";
import "../Common/Tooltips/NumberTooltip";
import NumberTooltip from "../Common/Tooltips/NumberTooltip";
import ChipTooltip from "../Common/Tooltips/ChipTooltip";

const Lab = ({ lab, characters }) => {
  return (
    <LabStyle>
      <div className={'map'}>
        {lab?.playersCords?.map((playerCord, index) => {
          if (index > 8) return null;
          return <NumberTooltip key={`${playerCord.x}${playerCord.y}-${index}`} title={characters?.[index]?.name}>
            <img className={'user'} src={`${prefix}data/head.png`}

                 style={{
                   position: 'absolute',
                   top: `calc(${playerCord.y}vw / 20)`,
                   left: `calc(${playerCord.x}vw / 20)`
                 }} alt={''}/></NumberTooltip>;
        })}
        {lab?.jewels?.map((jewel, index) => {
          return <JewelTooltip key={`${jewel?.name}-${index}`} {...jewel} >
            <img
              className={'jewel'}
              style={{ position: 'absolute', top: `calc(${jewel.y}vw / 20)`, left: `calc(${jewel.x}vw / 20)` }}

              src={`${prefix}data/${jewel?.rawName}.png`} alt=""/>
          </JewelTooltip>;
        })}
        {lab?.labBonuses?.map((labBonus, index) => {
          return <div key={`${labBonus?.name}-${index}`}>
            <img className={'lab-bonus-border'}
                 style={{
                   position: 'absolute',
                   top: `calc(${labBonus.y - 3}vw / 20)`,
                   left: `calc(${labBonus.x - 3}vw / 20)`
                 }}
                 src={`${prefix}data/LabBonusB1.png`} alt=""/>
            <LabBonusTooltip {...labBonus}><img
              className={'lab-bonus'}
              style={{ position: 'absolute', top: `calc(${labBonus.y}vw / 20)`, left: `calc(${labBonus.x}vw / 20)` }}
              src={`${prefix}data/LabBonus${labBonus?.index}.png`} alt=""/></LabBonusTooltip>
          </div>;
        })}
      </div>
      <div className={'lab-bonuses'}>
        {lab?.labBonuses?.map((labBonus, index) => {
          return <LabBonusTooltip {...labBonus} key={`bonus-${labBonus?.name}-${index}`}>
            <img src={`${prefix}data/LabBonus${labBonus?.index}.png`} alt=""/>
          </LabBonusTooltip>
        })}
      </div>
      <div className={'jewels'}>
        {lab?.jewels?.map((jewel, index) => {
          return <JewelTooltip {...jewel} key={`${jewel?.name}-${index}`}>
            <img className={jewel.acquired ? '' : 'unacquired'} src={`${prefix}data/${jewel?.rawName}.png`} alt=""/>
          </JewelTooltip>
        })}
      </div>
      <div className={'chips'}>
        {lab?.chips?.map((chip, index) => {
          return <ChipTooltip {...chip} key={`${chip?.name}-${index}`}>
            <img src={`${prefix}data/ConsoleChip${index}.png`} alt=""/>
          </ChipTooltip>
        })}
      </div>
    </LabStyle>
  );
};

const LabStyle = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  position: relative;

  .map {
    position: relative;
    height: 30vw;
    width: 80vw;
    margin: 0 auto;

    .circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: red;
    }

    .user {
      width: 25px;
      height: 25px;
    }

    .jewel {
      width: 35px;
      height: 35px;
    }

    .lab-bonus {
      width: 35px;
      height: 35px;
    }

    .lab-bonus-border {
      width: 40px;
      height: 40px;
    }
  }


  .lab-bonuses {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    margin-bottom: 50px;
  }

  .jewels {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 50px;

    .unacquired {
      filter: grayscale(.9);
    }
  }


  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    margin-bottom: 50px;
  }
`;

export default Lab;
