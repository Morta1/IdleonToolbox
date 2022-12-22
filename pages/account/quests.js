import React, { useContext, useEffect, useState } from "react";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import WorldQuest from "components/account/Misc/WorldQuest";
import { prefix } from "utility/helpers";
import { AppContext } from "components/common/context/AppProvider";

const Quests = () => {
  const { state } = useContext(AppContext);
  const [worldQuests, setWorldQuests] = useState();
  const [filteredCharacters, setFilteredCharacters] = useState([0]);

  useEffect(() => {
    if (!filteredCharacters) return;
    let filteredWorldQuests = {};
    for (const [world, worldQuests] of Object.entries(state?.account?.quests)) {
      filteredWorldQuests[world] = worldQuests.map(({ npcQuests, ...rest }) => {
        let clonedNpcQuests = JSON.parse(JSON.stringify(npcQuests));
        let completedQuests = 0;
        let inProgressQuests = 0;
        for (const [questIndex, value] of Object.entries(clonedNpcQuests)) {
          const completed = filterArrByCharacters(value?.completed) || [];
          const progress = filterArrByCharacters(value?.progress) || [];
          clonedNpcQuests[questIndex] = {
            ...value,
            completed,
            progress,
          };
          if (completed.length === filteredCharacters?.length) {
            completedQuests++;
          } else if (completed.length > 0) {
            completedQuests += 0.5;
          }
          if (
            progress.some(
              ({ charIndex, status }) =>
                filteredCharacters?.indexOf(charIndex) !== -1 && status !== -1
            )
          ) {
            inProgressQuests++;
          }
        }
        let questsStatus;
        if (completedQuests === 0) {
          if (inProgressQuests > 0) {
            questsStatus = 0;
          } else {
            questsStatus = -1;
          }
        } else {
          questsStatus = completedQuests === npcQuests?.length ? 1 : 0;
        }
        return {
          ...rest,
          npcQuests: clonedNpcQuests,
          questsStatus,
        };
      });
    }
    setWorldQuests(filteredWorldQuests);
  }, [filteredCharacters]);

  const handleFilteredCharacters = (event, newCharacters) => {
    if (newCharacters.length) {
      setFilteredCharacters(newCharacters);
    }
  };

  const filterArrByCharacters = (arr) => {
    return arr?.filter(
      ({ charIndex }) => filteredCharacters?.indexOf(charIndex) !== -1
    );
  };

  const handleSelectAll = () => {
    const allSelected = filteredCharacters?.length === state?.characters?.length;
    const chars = Array.from(
      Array(allSelected ? 1 : state?.characters?.length).keys()
    );
    setFilteredCharacters(chars);
  };

  return (
    <>
      {filteredCharacters ? (
        <>
          <Stack direction={'row'} my={2} justifyContent={'center'} flexWrap={'wrap'}>
            <ToggleButtonGroup
              size={'small'}
              sx={{ display: 'flex', flexWrap: 'wrap' }}
              value={filteredCharacters}
              onChange={handleFilteredCharacters}>
              {state?.characters?.map((character, index) => {
                return (
                  <ToggleButton
                    title={character?.name}
                    value={index}
                    key={character?.name + "" + index}>
                    <img
                      src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                      alt=''
                    />
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <ToggleButtonGroup sx={{ display: 'flex', flexWrap: 'wrap' }}
                               size={'small'}>
              <ToggleButton
                onClick={handleSelectAll}
                title='Select all'
                value={"all"}>
                <FormatAlignCenterIcon/>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction={'row'} justifyContent={'center'} flexWrap={'wrap'} gap={4}>
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={"Blunder_Hills"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={"Yum-Yum_Desert"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={"Frostbite_Tundra"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={"Hyperion_Nebula"}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={"Smolderin'_Plateau"}
            />
          </Stack>
        </>
      ) : null}
    </>
  );
};

export default Quests;
