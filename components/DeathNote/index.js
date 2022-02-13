import styled from 'styled-components'
import { cleanUnderscore, getDeathNoteRank, numberWithCommas, prefix, worlds } from "../../Utilities";
import Unavailable from "../Common/Unavailable";

const worldColor = ['#64b564', '#f1ac45', '#00bcd4']

const DeathNote = ({ deathNote }) => {
  return deathNote ? (
    <DeathNoteStyle>
      {Object.entries(deathNote)?.map(([worldIndex, { mobs, rank }], index) => {
        return <div className={'world'} key={worldIndex + ' ' + index}>
          <span className={'world-name'}
                style={{ color: worldColor?.[worldIndex] || 'white' }}>{worlds?.[worldIndex]}</span>
          <span className={'world-rank'}>Multikill Bonus: {rank}%</span>
          <div className="mobs">
            {mobs?.map((mob, innerIndex) => {
              const mobRank = getDeathNoteRank(mob.kills);
              const iconNumber = mobRank - 1 - Math.floor(mobRank / 7) - 2 * Math.floor(mobRank / 10);
              const skullName = iconNumber === -1 ? 'StatusSkull0' : `StatusSkull${iconNumber}`;
              return <div className={'mob'} key={mob?.rawName + ' ' + innerIndex}>
                <img className={'skull'} src={`${prefix}data/${skullName}.png`} alt=""/>
                <div className={'text'}>
                  <span>{cleanUnderscore(mob.displayName)}</span>
                  <span>{numberWithCommas(parseInt(mob.kills))}</span>
                </div>
              </div>
            })}
          </div>
        </div>
      })}
    </DeathNoteStyle>
  ) : <Unavailable/>;
};

const DeathNoteStyle = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 25px;

  .world {
    display: flex;
    flex-direction: column;

    .world-name {
      font-size: 24px;
      font-weight: bold;
    }

    .world-rank {
      margin-top: 10px;
      font-size: 16px;
      font-weight: bold;
    }
  }

  .mobs {
    margin-top: 15px;

    .mob {
      display: flex;
      align-items: baseline;
      height: 35px;
      gap: 10px;
      width: 400px;

      .skull-placeholder {
        height: 25px;
        width: 20px;
      }
    }

    .text {
      display: flex;
      gap: 15px;

      & span:nth-child(1) {
        width: 200px;
      }
    }
  }
`;

export default DeathNote;
