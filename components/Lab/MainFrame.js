import styled from 'styled-components'
import NumberTooltip from "../Common/Tooltips/NumberTooltip";
import { prefix } from "../../Utilities";
import JewelTooltip from "../Common/Tooltips/JewelTooltip";
import LabBonusTooltip from "../Common/Tooltips/LabBonusTooltip";
import CloseIcon from '@material-ui/icons/Close';

const MainFrame = ({ lab, characters }) => {
  return (
    <MainFrameStyle>
      <div className={'map'}>
        {lab?.playersCords?.map((playerCord, index) => {
          if (index > 8) return null;
          const isUploaded = characters?.[index]?.afkTarget === 'Laboratory';
          return <div className={'user-wrapper'} key={`${playerCord.x}${playerCord.y}-${index}`}>
            {!isUploaded ?
              <NotUploaded x={playerCord.x} y={playerCord.y}>
                <CloseIcon style={{ position: 'absolute', left: -5, top: -5 }} color='error'
                           fontSize={'large'}/></NotUploaded> : null}
            <NumberTooltip title={`${characters?.[index]?.name} - ${playerCord?.lineWidth}px (${playerCord.x}, ${playerCord.y})`}>
              <UserImage x={playerCord.x} y={playerCord.y} src={`${prefix}data/head.png`} alt={''}/>
            </NumberTooltip>
          </div>;
        })}
        {lab?.jewels?.map((jewel, index) => {
          return <JewelTooltip key={`${jewel?.name}-${index}`} {...jewel} >
            <img
              className={`jewel${jewel.acquired ? '' : ' unacquired'}${jewel.active ? ' active' : ''}`}
              style={{
                borderRadius: '50%',
                position: 'absolute', top: `calc(${jewel.y}vw / 20)`, left: `calc(${jewel.x}vw / 20)`
              }}
              src={`${prefix}data/${jewel?.rawName}.png`} alt=""/>
          </JewelTooltip>;
        })}
        {lab?.labBonuses?.map((labBonus, index) => {
          return <div key={`${labBonus?.name}-${index}`}>
            <img className={`lab-bonus-border${labBonus.active ? ' active' : ''}`}
                 style={{
                   position: 'absolute',
                   top: `calc(${labBonus.y - 3}vw / 20)`,
                   left: `calc(${labBonus.x - 3}vw / 20)`
                 }}
                 src={`${prefix}data/LabBonusB1.png`} alt=""/>
            <LabBonusTooltip {...labBonus}><img
              className={'lab-bonus'}
              style={{
                position: 'absolute',
                top: `calc(${labBonus.y}vw / 20)`,
                left: `calc(${labBonus.x}vw / 20)`
              }}
              src={`${prefix}data/LabBonus${labBonus?.index}.png`} alt=""/></LabBonusTooltip>
          </div>;
        })}
      </div>
      <div className={'lab-bonuses'}>
        {lab?.labBonuses?.map((labBonus, index) => {
          return <LabBonusTooltip {...labBonus} key={`bonus-${labBonus?.name}-${index}`}>
            <img className={`${labBonus.active ? 'active' : ''}`} src={`${prefix}data/LabBonus${labBonus?.index}.png`}
                 alt=""/>
          </LabBonusTooltip>
        })}
      </div>
      <div className={'jewels'}>
        {lab?.jewels?.map((jewel, index) => {
          return <JewelTooltip {...jewel} key={`${jewel?.name}-${index}`}>
            <img className={jewel.active ? 'active' : ''} style={{ borderRadius: "50%" }}
                 src={`${prefix}data/${jewel?.rawName}.png`} alt=""/>
          </JewelTooltip>
        })}
      </div>
    </MainFrameStyle>
  );
};

const NotUploaded = styled.div`
  z-index: 2;
  position: absolute;
  top: calc(${({ y }) => y}vw / 20);
  left: calc(${({ x }) => x}vw / 20);
  height: 25px;
  width: 25px;
  pointer-events: none;
`;
const UserImage = styled.img`
  position: absolute;
  top: calc(${({ y }) => y}vw / 20);
  left: calc(${({ x }) => x}vw / 20);
  height: 25px;
  width: 25px;
`;

const MainFrameStyle = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  position: relative;

  .map {
    position: relative;
    height: 30vw;
    width: 80vw;
    margin: 0 auto;

    .jewel {
      width: 35px;
      height: 35px;
    }

    .unacquired {
      filter: grayscale(1);
    }

    .lab-bonus {
      width: 35px;
      height: 35px;
    }

    .lab-bonus-border {
      width: 40px;
      height: 40px;
      border-radius: 10px;
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
  }

  .active {
    box-shadow: 0 0 10px 0 #93df59;
    border-radius: 10px;
  }
`;

export default MainFrame;
