import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { useContext, useMemo, useState } from 'react';
import { getCharacterByHighestSkillLevel } from '../../../../../parsers/misc';
import { AppContext } from '../../../../common/context/AppProvider';
import { CardTitleAndValue } from '../../../../common/styles';
import { notateNumber } from '../../../../../utility/helpers';

const CogStatCalculator = () => {
  const { state } = useContext(AppContext);
  const [cogType, setCogType] = useState(5);
  const highestDK = useMemo(() => getCharacterByHighestSkillLevel(state?.characters, 'Divine_Knight', 'construction'), [state?.characters]);
  const highestConstruction = highestDK?.skillsInfo?.construction?.level;
  const mainConstructionValue = Math.pow((((highestConstruction) / 3) + 0.7), (1.3 + (0.05 * cogType))) / 4 + Math.pow(3, cogType - 2);
  const constructionMin = mainConstructionValue * .4;
  const constructionMax = mainConstructionValue * 3;
  const handleChange = (event) => {
    setCogType(event.target.value);
  };

  return (
    <Stack alignItems={'center'}>
      <CardTitleAndValue title={'Highest Cons level'} value={highestDK?.skillsInfo?.construction?.level || 0}/>
      <FormControl>
        <FormLabel id="demo-row-radio-buttons-group-label">Cog type</FormLabel>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={cogType}
          onChange={handleChange}
        >
          <FormControlLabel value={2} control={<Radio/>} label="Nooby"/>
          <FormControlLabel value={3} control={<Radio/>} label="Decent"/>
          <FormControlLabel value={4} control={<Radio/>} label="Superb"/>
          <FormControlLabel
            value={5}
            control={<Radio/>}
            label="Ultimate"
          />
        </RadioGroup>
      </FormControl>

      <Stack direction={'row'} gap={3} flexWrap={'wrap'}>
        <Section title={'Construction Value'} main={mainConstructionValue} min={constructionMin}
                 max={constructionMax}/>
        <Section title={'Build rate'} min={Math.floor(constructionMin)}
                 max={Math.floor(constructionMax)}/>
        <Section title={'Flag rate'} min={Math.round(Math.pow(constructionMin, .8))}
                 max={Math.round(Math.pow(constructionMax, .8))}/>
        <Section title={'Exp'}
                 min={Math.max(Math.floor((Math.pow(constructionMin, 0.4) + Math.log10(constructionMin) * 10) - 5), 2)}
                 max={Math.max(Math.floor((Math.pow(constructionMax, 0.4) + Math.log10(constructionMax) * 10) - 5), 2)}/>
      </Stack>
    </Stack>
  )
};

const Section = ({ title, main, min, max }) => {
  return <CardTitleAndValue title={title}>
    <Stack>
      {main ? <Stack alignItems={'center'} direction={'row'} gap={1}>
        <Typography sx={{ fontSize: 14 }} color="text.secondary">main</Typography>
        <Typography>{notateNumber(main, 'MultiplierInfo')}</Typography>
      </Stack> : null}
      <Stack alignItems={'center'} direction={'row'}
             gap={1}>
        <Typography sx={{ fontSize: 14 }} color="text.secondary">min</Typography>
        <Typography>{notateNumber(min, 'MultiplierInfo')}</Typography>
      </Stack>
      <Stack alignItems={'center'} direction={'row'}
             gap={1}>
        <Typography sx={{ fontSize: 14 }} color="text.secondary">max</Typography>
        <Typography>{notateNumber(max, 'MultiplierInfo')}</Typography>
      </Stack>
    </Stack>
  </CardTitleAndValue>
}

export default CogStatCalculator;
