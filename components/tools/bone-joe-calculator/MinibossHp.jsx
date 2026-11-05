import React from 'react';
import { Divider, FormControlLabel, IconButton, Stack, Switch } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import NumberField from '@components/common/NumberField';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getKillCredit, getMinibosses, getMinibossHp } from '@parsers/misc/boneJoeCalculator';
import { monsterSprite } from '@utility/spriteImages';

// One height for the row: the equip toggle sits inside its level field, so the pair is one control with one border.
const EQUIP_SX = { width: 32, height: 32, ml: -0.75, p: 0, '&[aria-pressed="true"]': { bgcolor: 'primary.soft' } };

const MinibossHp = ({
                      pickles,
                      setPickles,
                      maxPickles,
                      activePrayers,
                      levelsFromAccount,
                      setPrayerLevel,
                      togglePrayer,
                      curse,
                      hpMulti,
                      applyToCharacters,
                      setApplyToCharacters,
                      showTargetHits,
                      targetHits,
                      setTargetHits,
                      maxTargetHits
                    }) => {
  const minibosses = getMinibosses();
  const killCredit = getKillCredit(pickles);

  // The field settles the max on leave, so the level arrives inside it.
  const handlePrayerLevel = (name) => (next) => setPrayerLevel(name, next ?? 0);

  return <Panel title={'Miniboss HP'}>
    <Stack gap={2} sx={{ p: 2 }}>
      <Stack direction={'row'} columnGap={1.5} rowGap={1.5} flexWrap={'wrap'} alignItems={'flex-end'}>
        <NumberField
          label={'Pickles'}
          sx={{ flex: '1 1 120px', minWidth: 0 }}
          min={0}
          max={maxPickles}
          integer
          help={false}
          value={pickles}
          onChange={(next) => setPickles(next ?? 0)}
        />
        {activePrayers.map((prayer) => {
          const name = cleanUnderscore(prayer?.name);
          return <NumberField
            key={prayer?.name}
            label={name}
            value={prayer?.level}
            min={0}
            max={prayer?.maxLevel}
            integer
            help={false}
            onChange={handlePrayerLevel(prayer?.name)}
            sx={{
              flex: '1 1 170px',
              minWidth: 0,
              ...(prayer?.enabled ? {} : { '& .MuiInputBase-input': { color: 'text.muted' } })
            }}
            icon={levelsFromAccount ? <IconButton size={'small'} aria-label={`Equip ${name}`} aria-pressed={Boolean(prayer?.enabled)}
                                                  sx={EQUIP_SX} onClick={() => togglePrayer(prayer?.name)}>
              <GameIcon src={`data/Prayer${prayer?.prayerIndex}.png`} size={24} alt={''} status={prayer?.enabled ? undefined : 'missing'}/>
            </IconButton> : undefined}
            unit={levelsFromAccount && prayer?.level !== prayer?.accountLevel
              ? <IconButton size={'small'} edge={'end'} aria-label={`Reset ${name} to account level`}
                            onClick={() => setPrayerLevel(prayer?.name, prayer?.accountLevel)}>
                <RestartAltIcon fontSize={'small'}/>
              </IconButton>
              : undefined}
          />;
        })}
        {/* It only moves the characters' table, but it is one of this tool's inputs: they share one row */}
        {showTargetHits ? <NumberField
          label={'Target hits'}
          sx={{ flex: '1 1 120px', minWidth: 0 }}
          min={1}
          max={maxTargetHits}
          integer
          help={false}
          value={targetHits}
          onChange={(next) => setTargetHits(next ?? 1)}
        /> : null}
      </Stack>
      <FormControlLabel
        sx={{ width: 'fit-content' }}
        control={<Switch
          checked={applyToCharacters}
          onChange={({ target }) => setApplyToCharacters(target.checked)}
        />}
        label={'Apply to characters'}
      />
      <Divider/>
      <ItemCard.Facts rows={[
        ['Monster HP curse', formatNum(curse, 'pct', { signed: true })],
        ['Each kill counts as', `${formatNum(killCredit, 'whole')} Deathnote ${killCredit === 1 ? 'kill' : 'kills'}`]
      ]}/>
    </Stack>
    <DataTable
      columns={[
        {
          key: 'miniboss', label: 'Miniboss', value: ({ name }) => cleanUnderscore(name),
          icon: ({ name }) => <GameIcon src={monsterSprite(name)} size={24} alt={''}/>
        },
        // A phone keeps HP, the number the pickles change.
        { key: 'baseHp', label: 'Base HP', numeric: true, render: ({ baseHp }) => formatNum(baseHp) },
        { key: 'hp', label: 'HP', numeric: true, phone: true, render: ({ baseHp }) => formatNum(getMinibossHp(baseHp, hpMulti, pickles)) }
      ]}
      rows={minibosses}
      rowKey={'rawName'}
      rowLabel={({ name }) => cleanUnderscore(name)}
    />
  </Panel>;
};

export default MinibossHp;
