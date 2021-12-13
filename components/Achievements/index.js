import styled from 'styled-components'
import { prefix } from "../../Utilities";
import { useEffect, useState } from "react";
import AchievementTooltip from "../Common/Tooltips/AchievementTooltip";

const achievementsPerWorld = 70;

const Achievements = ({ userData }) => {
  const [achievements, setAchievements] = useState(userData?.account?.achievements);
  const [world, setWorld] = useState(0);

  useEffect(() => {
    setAchievements(getWorldAchievements(0, achievementsPerWorld));
  }, [])

  const handleWorldChange = (world) => {
    setAchievements(getWorldAchievements(world * achievementsPerWorld, world * achievementsPerWorld + achievementsPerWorld));
    setWorld(world);
  }

  const getWorldAchievements = (start, end) => {
    const achievements = userData?.account?.achievements.slice(start, end);
    achievements?.sort((a, b) => a?.visualIndex - b?.visualIndex);
    return achievements;
  }

  return (
    <AchievementsStyle>
      <div className={'tabs'}>
        <div className={`${world === 0 ? 'active' : ''}`} onClick={() => handleWorldChange(0)}>World 1</div>
        <div className={`${world === 1 ? 'active' : ''}`} onClick={() => handleWorldChange(1)}>World 2</div>
        <div className={`${world === 2 ? 'active' : ''}`} onClick={() => handleWorldChange(2)}>World 3</div>
      </div>
      {achievements?.length && <div className={'achievements'}>
        {achievements?.map((achievement, index) => {
          const { name, rawName, completed, visualIndex, currentQuantity, quantity } = achievement;
          return (visualIndex !== -1 && !name.includes('FILLER')) &&
            <div className={'achievement-wrapper'} key={`${name}-${index}`}>
              <div className={'achievement-icon'}>
                <AchievementBorder src={`${prefix}data/TaskAchBorder${world + 1}.png`}/>
                <AchievementTooltip {...achievement}>
                  <Achievement completed={completed} src={`${prefix}data/${rawName}.png`} alt=""/>
                </AchievementTooltip>
              </div>
              {currentQuantity ? <div>
                {currentQuantity} / {quantity}
              </div> : null}
            </div>
        })}
      </div>}
    </AchievementsStyle>
  );
};

const AchievementsStyle = styled.div`
  margin-top: 25px;
  margin-left: 35px;


  .tabs {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 30px;

    > div {
      cursor: pointer;
    }

    .active {
      font-weight: bold;
      border-bottom: 2px solid white;
    }

    & img {
      height: 100px;
      width: 100px;
      object-fit: contain;
    }
  }

  .achievements {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(100% / 14), 1fr));
    gap: 30px;

    @media (max-width: 1280px) {
      grid-template-columns: repeat(auto-fit, minmax(calc(100% / 6), 1fr));
    }

    .achievement-wrapper {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .achievement-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      & img {

      }
    }

  }
`;

const Achievement = styled.img`
  filter: ${({ completed }) => completed ? 'grayscale(0)' : 'grayscale(1)'};
  opacity: ${({ completed }) => completed ? '1' : '0.3'};
  margin-left: -4px;
`

const AchievementBorder = styled.img`
  position: absolute;
  z-index: 1;
  pointer-events: none;
`

export default Achievements;
