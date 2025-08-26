import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix, tryToParse } from '../../utility/helpers';
import { getBubbleBonus } from '../../parsers/alchemy';
import { NextSeo } from 'next-seo';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { MissingData } from '@components/common/styles';
import Tooltip from '../../components/Tooltip';
import { gods } from '../../data/website-data';

const GodPlanner = () => {
  const { dispatch, state } = useContext(AppContext);
  const { characters, account } = state;
  const [build, setBuild] = useState([]);
  const [bigP, setBigP] = useState(true);

  useEffect(() => {
    if (state?.godPlanner) {
      setBuild(tryToParse(state?.godPlanner));
    }
  }, []);

  const handleClick = ({ charName, playerId, godName }) => {
    const buildCopy = [...build];
    const playerObject = { charName, playerId, godName };
    const charExists = buildCopy?.findIndex((player) => player?.charName === charName);
    if (charExists !== -1) {
      buildCopy.splice(charExists, 1, playerObject)
    } else {
      buildCopy.push(playerObject);
    }
    buildCopy.sort((a, b) => a?.playerId - b?.playerId);
    dispatch({ type: 'godPlanner', data: buildCopy })
    setBuild(buildCopy);
  }

  const handleDelete = (index) => {
    const buildCopy = [...build]?.filter((_, ind) => ind !== index);
    dispatch({ type: 'godPlanner', data: buildCopy });
    setBuild(buildCopy)
  }

  if (!state?.account?.divinity) return <MissingData name={'divinity'}/>;
  return <>
    <NextSeo
      title="God Planner | Idleon Toolbox"
      description="Watch all of your character's gods minor bonuses"
    />
    <Typography variant={'h2'} mb={3}>God Planner</Typography>
    <Typography variant={'caption'} component={'div'}>* Click on a god to add it to the build</Typography>
    <FormControlLabel
      control={<Checkbox name={'mini'} checked={bigP}
                         size={'small'}
                         onChange={() => setBigP(!bigP)}/>}
      label={'Apply big p bubble'}/>
    <Stack direction={'row'} sx={{ gap: { xs: 1, sm: 2 }, minHeight: 80 }} my={2} flexWrap={'wrap'}>
      {build?.map(({ charName, godName }, index) => {
        return <Card key={charName + godName + index} sx={{ overflow: 'visible', position: 'relative', minWidth: 150 }}>
          <CardContent>
            <IconButton sx={{ position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -50%)' }}
                        size={"small"}
                        onClick={() => handleDelete(index)}>
              <CloseIcon/>
            </IconButton>
            <Stack key={charName} alignItems={'center'} justifyContent={'center'}>
              <img width={24} height={24} src={`${prefix}data/${godName}.png`} alt="god-icon"/>
              <Typography>{charName}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Stack gap={1} sx={{ width: 'fit-content' }}>
      {characters?.map(({
                          classIndex, name: charName, deityMinorBonus = 0, divStyle,
                          secondLinkedDeityIndex, secondDeityMinorBonus = 0,
                          playerId,
                          skillsInfo
                        }, charIndex) => {
        const bubbleBonus = getBubbleBonus(account, 'BIG_P', false);
        const divinityLevel = skillsInfo?.divinity?.level
        const classIcon = classIndex !== undefined ? `data/ClassIcons${classIndex}.png` : 'afk_targets/Nothing.png'
        return (
          (<Card key={charName}>
            <CardContent>
              <Stack direction={'row'} gap={2} alignItems={'center'} flexWrap={'wrap'}>
                <Stack sx={{ width: 130 }} direction={'column'} alignItems={'center'}>
                  <img src={`${prefix}${classIcon}`}
                       alt="player-icon"/>
                  <Typography>{charName}</Typography>
                </Stack>
                {account?.divinity?.deities?.map(({
                                                    name,
                                                    rawName,
                                                    majorBonus,
                                                    minorBonus,
                                                    blessing,
                                                    blessingMultiplier,
                                                    blessingBonus,
                                                    minorBonusMultiplier
                                                  }, godIndex) => {
                  const isLinked = account?.divinity?.linkedDeities?.[charIndex] === godIndex;
                  const isSecondLinked = secondLinkedDeityIndex === godIndex;
                  const realGodIndex = gods?.[godIndex]?.godIndex;
                  const multiplier = gods?.[realGodIndex]?.minorBonusMultiplier;
                  const bonus = (divinityLevel / (60 + divinityLevel)) * Math.max(1, (bigP && bubbleBonus)) * multiplier;
                  const bonusDesc = minorBonus.replace(/{/g, bonus.toFixed(2));
                  return <Tooltip key={rawName} title={<CharDeityDetails name={name} bonus={bonusDesc}/>}>
                    <Card variant={'outlined'}
                          onClick={() => handleClick({ charName, playerId, godName: rawName })}
                          sx={{
                            width: 80,
                            cursor: 'pointer',
                            border: isLinked || isSecondLinked ? "1px solid #81c784" : "",
                          }}>
                      <CardContent sx={{ '&:last-child': { padding: 1 } }}>
                        <Stack alignItems={'center'} justifyContent={'center'}>
                          <img width={24} height={24} src={`${prefix}data/${rawName}.png`} alt="god-icon"/>
                          {bonus.toFixed(2)}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Tooltip>
                })}
              </Stack>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>;
};

const CharDeityDetails = ({ name, bonus }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
    <Typography>{cleanUnderscore(bonus)}</Typography>
  </>
}

export default GodPlanner;
