import React, { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import WorldQuest from "./WorldQuest";
import { prefix } from "../../../Utilities";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import FormatAlignCenterIcon from "@material-ui/icons/FormatAlignCenter";
import { AppContext } from "../../../components/context";

const Quests = ({ quests, characters }) => {
  const { questCharacters, setUserQuestCharacters } = useContext(AppContext);
  const [worldQuests, setworldQuests] = useState();
  const [filteredCharacters, setFilteredCharacters] = useState(questCharacters);

  useEffect(() => {
    if (!filteredCharacters) return;
    let filteredWorldQuests = {};
    for (const [world, worldQuests] of Object.entries(quests)) {
      const filteredQuests = worldQuests.map(({ npcQuests, ...rest }) => {
        let clonedNpcQuests = JSON.parse(JSON.stringify(npcQuests));
        let completedQuests = 0;
        let inprogressQuests = 0;
        for (const [questIndex, value] of Object.entries(clonedNpcQuests)) {
          const completed = filterArrByCharacters(value?.completed) || [];
          const progress = filterArrByCharacters(value?.progress) || [];
          clonedNpcQuests[questIndex] = {
            ...value,
            completed,
            progress,
          };
          if (completed.length === filteredCharacters.length) {
            completedQuests++;
          } else if (completed.length > 0) {
            completedQuests += 0.5;
          }
          if (
            progress.some(
              ({ charIndex, status }) =>
                filteredCharacters.indexOf(charIndex) !== -1 && status !== -1
            )
          ) {
            inprogressQuests++;
          }
        }
        let questsStatus;
        if (completedQuests === 0) {
          if (inprogressQuests > 0) {
            questsStatus = 0;
          } else {
            questsStatus = -1;
          }
        } else {
          questsStatus = completedQuests === npcQuests.length ? 1 : 0;
        }
        return {
          ...rest,
          npcQuests: clonedNpcQuests,
          questsStatus,
        };
      });
      filteredWorldQuests[world] = filteredQuests;
    }
    setworldQuests(filteredWorldQuests);
  }, [filteredCharacters]);

  const handleFilteredCharacters = (event, newCharacters) => {
    if (newCharacters.length) {
      setFilteredCharacters(newCharacters);
    }
  };

  const filterArrByCharacters = (arr) => {
    return arr?.filter(
      ({ charIndex }) => filteredCharacters.indexOf(charIndex) !== -1
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredCharacters.length === characters?.length;
    const chars = Array.from(
      Array(allSelected ? 1 : characters?.length).keys()
    );
    setFilteredCharacters(chars);
    setUserQuestCharacters(chars);
  };

  return (
    <QuestsStyle>
      {filteredCharacters ? (
        <>
          <div className='characters'>
            <ToggleButtonGroup
              value={filteredCharacters}
              onChange={handleFilteredCharacters}>
              {characters.map((character, index) => {
                return (
                  <ToggleButton
                    title={character?.name}
                    value={index}
                    key={character?.name + "" + index}>
                    <img
                      src={`${prefix}icons/${character?.class}_Icon.png`}
                      alt=''
                    />
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <ToggleButtonGroup>
              <ToggleButton
                onClick={handleSelectAll}
                title='Select all'
                value={"all"}>
                <FormatAlignCenterIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <div className='world-quests'>
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters.length}
              characters={characters}
              worldName={"Blunder_Hills"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters.length}
              characters={characters}
              worldName={"Yum-Yum_Desert"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters.length}
              characters={characters}
              worldName={"Frostbite_Tundra"}
            />
          </div>
        </>
      ) : null}
    </QuestsStyle>
  );
};

const QuestsStyle = styled.div`
  padding: 10px;
  margin-top: 15px;
  .characters {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .world-quests {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 25px;
  }
`;

export default Quests;
