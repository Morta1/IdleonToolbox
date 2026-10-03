import React, { useContext, useEffect, useState } from 'react';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import {
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import WorldQuest from 'components/account/Misc/WorldQuest';
import { numberWithCommas, prefix } from 'utility/helpers';
import { AppContext } from 'components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import HtmlTooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const Quests = () => {
  const { state } = useContext(AppContext);
  const [worldQuests, setWorldQuests] = useState();
  const [filteredCharacters, setFilteredCharacters] = useState([0]);
  const [hideCompleted, setHideCompleted] = useState(false);
  // Counts a quest as done once any selected character finished it, to find quests nobody did yet
  const [completedByAny, setCompletedByAny] = useState(false);
  const totalQuestsCompleted = state?.account?.totalQuestsCompleted ?? 0;

  useEffect(() => {
    if (!filteredCharacters) return;
    let filteredWorldQuests = {};
    for (const [world, worldQuests] of Object.entries(state?.account?.quests)) {
      filteredWorldQuests[world] = worldQuests.map(({ npcQuests, ...rest }) => {
        let clonedNpcQuests = structuredClone((npcQuests));
        let completedQuests = 0;
        let inProgressQuests = 0;
        for (const [questIndex, value] of Object.entries(clonedNpcQuests)) {
          const completed = filterArrByCharacters(value?.completed) || [];
          const progress = filterArrByCharacters(value?.progress) || [];
          clonedNpcQuests[questIndex] = {
            ...value,
            completed,
            progress
          };
          if (completedByAny ? completed.length > 0 : completed.length === filteredCharacters?.length) {
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
        // Every selected character finished the final quest, so there's nothing left to do here
        // even if an earlier quest went unfinished - some are unreachable once you've moved past
        // them, and would otherwise hold the npc at "in progress" forever.
        const lastQuest = clonedNpcQuests[clonedNpcQuests.length - 1];
        const charactersAtTheEnd = (lastQuest?.progress || [])
          .filter(({ status }) => status === 1)
          .map(({ charIndex }) => charIndex);
        const everyoneFinished = !completedByAny && filteredCharacters?.length > 0
          && filteredCharacters.every((charIndex) => charactersAtTheEnd.includes(charIndex));

        let questsStatus;
        if (everyoneFinished) {
          questsStatus = 1;
        } else if (completedQuests === 0) {
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
          questsStatus
        };
      });
    }
    setWorldQuests(filteredWorldQuests);
  }, [filteredCharacters, state, completedByAny]);

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
      <NextSeo
        title="Quests | Idleon Toolbox"
        description="Track quest completion progress across all NPCs and characters in Legends of Idleon"
      />
      {filteredCharacters ? (
        <>
          <Stack direction={'row'} mt={2} justifyContent={'center'} flexWrap={'wrap'} gap={2}>
            <CardTitleAndValue title={'Unique quests completed'}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Typography>{numberWithCommas(totalQuestsCompleted)}</Typography>
                <HtmlTooltip
                  title={'Every quest counts once, no matter how many characters finished it. This is the number the QUEST KAPOW! and QUEST CHUNGUS star talents scale off.'}>
                  <InfoIcon sx={{ fontSize: 16, cursor: 'pointer' }}/>
                </HtmlTooltip>
              </Stack>
            </CardTitleAndValue>
          </Stack>
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
                    sx={{ height: 'auto', p: '4px' }}
                    value={index}
                    key={character?.name + '' + index}>
                    <img
                      width={32}
                      height={32}
                      style={{ objectFit: 'contain' }}
                      src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                      alt=""
                    />
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <ToggleButtonGroup sx={{ display: 'flex', flexWrap: 'wrap' }}
                               size={'small'}>
              <ToggleButton
                onClick={handleSelectAll}
                title="Select all"
                sx={{ height: '100%' }}
                value={'all'}>
                <FormatAlignCenterIcon/>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack direction={'row'} mb={2} justifyContent={'center'} alignItems={'center'} flexWrap={'wrap'}
                 columnGap={3} rowGap={1}>
            <FormControlLabel
              sx={{ mr: 0 }}
              control={<Checkbox checked={hideCompleted}
                                 onChange={(e) => setHideCompleted(e.target.checked)}/>}
              label={'Hide completed'}/>
            <Stack direction={'row'} alignItems={'center'}>
              <FormControlLabel
                sx={{ mr: 0.5 }}
                control={<Checkbox checked={completedByAny}
                                   onChange={(e) => setCompletedByAny(e.target.checked)}/>}
                label={'Completed at least once'}/>
              <HtmlTooltip
                title={'A quest counts as completed once any of the selected characters finished it, instead of all of them. Select all characters to find the quests no one has done yet.'}>
                <InfoIcon sx={{ fontSize: 16, cursor: 'pointer' }}/>
              </HtmlTooltip>
            </Stack>
          </Stack>
          <Stack mt={6} direction={'row'} justifyContent={'center'} flexWrap={'wrap'} gap={4}>
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Blunder_Hills'}
              worldIndex={0}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Yum_Yum_Desert'}
              worldIndex={1}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Frostbite_Tundra'}
              worldIndex={2}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Hyperion_Nebula'}
              worldIndex={3}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Smolderin\'_Plateau'}
              worldIndex={4}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Spirited_Valley'}
              worldIndex={5}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
            <WorldQuest
              quests={worldQuests}
              totalCharacters={filteredCharacters?.length}
              characters={state?.characters}
              worldName={'Shimmerfin_Deep'}
              worldIndex={6}
              hideCompleted={hideCompleted}
              completedByAny={completedByAny}
            />
          </Stack>
        </>
      ) : null}
    </>
  );
};

export default Quests;
