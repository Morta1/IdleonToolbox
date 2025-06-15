import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { cashFormatter, cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import DataLoadingWrapper from '@components/common/DataLoadingWrapper';
import Autocomplete from '@mui/material/Autocomplete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCashMulti, getClassExpMulti, getDropRate, getRespawnRate } from '@parsers/character';
import Highlighter from '@components/common/Highlighter';
import { getCropEvolution } from '@parsers/world-6/farming';
import { getPrinterMulti } from '@parsers/printer';
import { getBitsMulti } from '@parsers/gaming';
import { getGoldenFoodMulti } from '@parsers/misc';
import { NextSeo } from 'next-seo';

const Formulas = () => {
  const { state } = useContext(AppContext);
  const [selectedChar, setSelectedChar] = useState(state?.characters?.[0] || {});
  const [selectedFormula, setSelectedFormula] = useState(null);

  const formulas = useMemo(() => {
    const respawnRate = getRespawnRate(selectedChar, state?.account);
    const cashMulti = getCashMulti(selectedChar, state?.account, state?.characters);
    const expMulti = getClassExpMulti(selectedChar, state?.account, state?.characters);
    const dropRate = getDropRate(selectedChar, state?.account, state?.characters);
    const cropEvo = getCropEvolution(state?.account, selectedChar, state?.account?.farming?.plot?.[0])
    const printerMulti = getPrinterMulti(state?.account, state?.characters);
    const bitMulti = getBitsMulti(state?.account, state?.characters);
    const goldenFoodMulti = getGoldenFoodMulti(selectedChar, state?.account, state?.characters);
    return [
      {
        id: 'crystalChance',
        name: 'Crystal Chance',
        formula: selectedChar?.crystalSpawnChance?.expression,
        value: selectedChar?.crystalSpawnChance?.value,
        renderValue: (value) => `1 in ${Math.floor(1 / value)} (${notateNumber(value * 100, 'MultiplierInfo')?.replace('.00', '')}%)`,
        description: 'How often a crystal mob is spawned'
      },
      {
        id: 'respawnRate',
        name: 'Respawn Rate',
        formula: respawnRate?.expression,
        value: respawnRate?.respawnRate,
        renderValue: (value) => `${notateNumber(value, 'MultiplierInfo')}%`,
        description: 'How often a mob is spawned'
      },
      {
        id: 'cashMulti',
        name: 'Cash Multiplier',
        formula: cashMulti?.expression,
        value: cashMulti?.cashMulti,
        renderValue: (value) => `${cashFormatter(value, 2)}x`,
        description: 'Coin bonuses from all sources'
      },
      {
        id: 'expMulti',
        name: 'Exp Multiplier',
        formula: expMulti?.expression,
        value: expMulti?.value,
        renderValue: (value) => `${cashFormatter(value, 2)}x`,
        description: 'Exp bonuses from all sources'
      },
      {
        id: 'dropRate',
        name: 'Drop Rate',
        formula: dropRate?.expression,
        value: dropRate?.dropRate,
        renderValue: (value) => `${notateNumber(value, 'MultiplierInfo')}x`,
        description: 'Drop rate bonuses from all sources'
      },
      {
        id: 'monumentAfkBonus',
        name: 'Monument Afk Bonus',
        formula: state?.account?.hole?.caverns?.bravery?.afkPercent?.expression,
        value: state?.account?.hole?.caverns?.bravery?.afkPercent?.value,
        renderValue: (value) => `${value.toFixed(2)}%`,
        description: 'Monument Afk Bonuses from all sources'
      },
      {
        id: 'equinox',
        name: 'Equinox',
        formula: state?.account?.equinox?.expression,
        value: state?.account?.equinox?.chargeRate,
        renderValue: (value) => `${value}/hr`,
        description: 'Equinox Bonuses from all sources'
      },
      {
        id: 'cropEvo',
        name: 'Crop Evolution',
        formula: cropEvo?.expression,
        value: cropEvo?.value,
        renderValue: (value) => `${value}%`,
        description: 'Crop evolution chance'
      },
      {
        id: 'printerMulti',
        name: 'Printer Multiplier',
        formula: printerMulti?.expression,
        value: printerMulti?.value,
        renderValue: (value) => `${value.toFixed(2)}%`,
        description: 'Printer multi bonuses from all sources'
      },
      {
        id: 'bitMulti',
        name: 'Bit Multiplier',
        formula: bitMulti?.expression,
        value: bitMulti?.value,
        renderValue: (value) => `${notateNumber(value)}%`,
        description: 'Bit multi bonuses from all sources'
      },
      {
        id: 'goldenFoodMulti',
        name: 'Golden Food Multiplier',
        formula: goldenFoodMulti?.expression,
        value: goldenFoodMulti?.value,
        renderValue: (value) => `${Math.floor(value * 100) / 100}x`,
        description: 'Golden Food multi bonuses from all sources'
      }
    ];
  }, [selectedChar]);

  const filteredFormulas = useMemo(() => {
    if (!selectedFormula) return formulas;
    return formulas.filter(formula => formula.name === selectedFormula);
  }, [formulas, selectedFormula]);

  const handleCharChange = (e) => {
    setSelectedChar(state?.characters?.[e.target.value]);
  };

  if (!state?.characters) {
    return <DataLoadingWrapper/>
  }

  return <>
    <NextSeo
      title="Formulas | Idleon Toolbox"
      description="A list of formulas of varius game mechanics"
    />
    <Stack gap={2} mt={2}>
      <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
        <Autocomplete
          sx={{ width: 300 }}
          options={formulas.map((formula) => formula.name)}
          getOptionLabel={(option) => cleanUnderscore(option.toLowerCase().capitalizeAll()) || ''}
          value={selectedFormula}
          onChange={(_, newValue) => setSelectedFormula(newValue)}
          renderInput={(params) => <TextField {...params} label="Formulas" variant="outlined" fullWidth/>}
        />
        <Divider orientation={'vertical'} flexItem sx={{ mx: 2, display: { xs: 'none', sm: 'block' } }}/>
        <Select
          size={'small'}
          sx={{ width: 230 }}
          value={selectedChar?.playerId}
          onChange={handleCharChange}
        >
          {state?.characters?.map((character, index) => (
            <MenuItem
              key={character?.name + index}
              value={character?.playerId}
              selected={selectedChar === character?.playerId}
            >
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img
                  src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                  alt=""
                  width={24}
                  height={24}
                />
                <Typography>{character?.name}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack spacing={1}>
        {filteredFormulas.map((formula) => (
          <Accordion key={formula.id}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon/>}
              aria-controls={`${formula.id}-content`}
              id={`${formula.id}-header`}
            >
              <Stack>
                <Stack direction="row" alignItems="center" gap={2}>
                  <Typography variant="subtitle1" fontWeight="bold" component={'span'}>
                    {formula.name}
                  </Typography>
                  <Typography variant={'caption'}>
                    {formula.renderValue ? formula.renderValue(formula.value) : formula.value}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" mt={0.5}>
                  {formula.description}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Formula
                </Typography>
                <Box sx={{
                  borderRadius: '12px',
                  padding: '1.5rem',
                  margin: '1.5rem 0',
                  borderLeft: '4px solid #667eea',
                  background: 'linear-gradient(135deg, #2c3e50, #34495e)'

                }}>
                  <Highlighter>
                    {formula.formula}
                  </Highlighter>
                </Box>
                <Typography variant="subtitle2" color="text.secondary" mt={1}>
                  Result
                </Typography>
                <Typography>
                  {formula.renderValue ? formula.renderValue(formula.value) : formula.value}
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>

    </Stack>
  </>
};

export default Formulas;
