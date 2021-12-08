import styled from 'styled-components'
import { numberWithCommas, prefix } from "../../Utilities";

const ColosseumHighscores = ({ scores }) => {
  return (
    <ColosseumHighscoresStyle>
      <span className={'title'}>Colosseum Highscores</span>
      {scores?.map((score, index) => {
        return <div className={'colo-container'} key={score + "" + index}>
          <img title={`Colo${index + 1}`} src={`${prefix}data/Colo${index + 1}.png`} alt={''}/>
          <span className={'colo-score'}>{numberWithCommas(score)}</span>
        </div>
      })}
    </ColosseumHighscoresStyle>
  );
};

const ColosseumHighscoresStyle = styled.div`
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

  .colo-container {
    width: 220px;
    display: flex;
    align-items: center;

    & img {
      height: 17px;
      width: 17px;
    }

    .colo-score {
      margin-left: 10px;
    }
  }
`;

export default ColosseumHighscores;
