import styled from 'styled-components'
import WorldQuest from "./WorldQuest";


const Quests = ({ quests, characters }) => {
  return (
    <QuestsStyle>
      <WorldQuest quests={quests} characters={characters} worldName={'Blunder_Hills'}/>
      <WorldQuest quests={quests} characters={characters} worldName={'Yum-Yum_Desert'}/>
      <WorldQuest quests={quests} characters={characters} worldName={'Frostbite_Tundra'}/>
    </QuestsStyle>
  );
};


const QuestsStyle = styled.div`
  padding: 10px;
  margin-top: 15px;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
`;

export default Quests;
