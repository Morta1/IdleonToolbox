import styled from 'styled-components'
import { numberWithCommas, prefix } from "../../Utilities";

const MinigameHighscores = ({ scores }) => {
  return (
    <MinigameHighscoresStyle>
      <span className={'title'}>Minigame Highscores</span>
      {scores?.map(({ minigame, score }, index) => {
        return <div className={'minigame-container'} key={minigame + "" + index}>
          <img className='up' src={`${prefix}data/up.png`} alt={''}/>
          <img title={minigame} src={`${prefix}data/Minigame${index}.png`} alt={''}/>
          <span className={'minigame-score'}>{minigame}: {numberWithCommas(score)}</span>
        </div>
      })}
    </MinigameHighscoresStyle>
  );
};

const MinigameHighscoresStyle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 10px;

  & .title {
    display: inline-block;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .minigame-container {
    width: 220px;
    position: relative;
    display: flex;
    align-items: center;

    & img.up {
      position: absolute;
      height: 16px;
      top: -5px;
      left: 20px;
    }

    .minigame-score {
      text-transform: capitalize;
      margin-left: 10px;
    }
  }
`;

export default MinigameHighscores;
