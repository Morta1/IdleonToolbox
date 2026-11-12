import { Box, Button, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React, { useState } from 'react';
import { getEndlessBattles, SUMMONING_COLOURS } from '@parsers/world-6/summoning';
import StatTile from '@components/common/cards/StatTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const COLOR_MAP = { ...SUMMONING_COLOURS, 9: 'Endless' };
const BATTLES_TOOLBAR = { show: 'open' };
// The endless list runs 200 battles ahead: the next few show, the rest a click away
const ENDLESS_STEP = 10;

const Battles = ({ battles, armyHealth, armyDamage, armyHealthBreakdown, armyDamageBreakdown, highestEndlessLevel, winnerBonuses }) => {
  const damageText = formatGame(armyDamage, 'Summoning.UnitDMG');
  const healthText = formatGame(armyHealth, 'Summoning.UnitHP');
  // The endless battles join the colours' as the tenth list, without writing into the parsed account
  const allBattles = [...(battles ?? []).slice(0, 9), getEndlessBattles(200, highestEndlessLevel, winnerBonuses)];
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('summoning-battles', BATTLES_TOOLBAR);
  const [endlessShown, setEndlessShown] = useState(ENDLESS_STEP);
  const hide = toolbar?.show === 'open';
  const total = allBattles.reduce((sum, list) => sum + (list?.length ?? 0), 0);
  const open = allBattles.reduce((sum, list) => sum + (list?.filter(({ won }) => !won).length ?? 0), 0);

  return <>
    {/* A row that wraps, so a long number never breaks mid-word on a phone */}
    <Stack mb={1} direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile icon={'data/SumUpgIc3.png'} label={'Army damage'} value={damageText}
                breakdown={armyDamageBreakdown ? { ...armyDamageBreakdown, totalValue: damageText } : undefined}/>
      <StatTile icon={'data/SumUpgIc1.png'} label={'Army health'} value={healthText}
                breakdown={armyHealthBreakdown ? { ...armyHealthBreakdown, totalValue: healthText } : undefined}/>
    </Stack>

    <Box>
      <Toolbar state={toolbar} defaults={BATTLES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={total} shown={hide ? open : total} noun={'battles'}>
        <Toolbar.Show options={[['open', 'Battles to win', open], ['all', 'All battles', total]]}/>
      </Toolbar>
      <Stack gap={3} sx={{ mt: 1 }}>
        {allBattles.map((colorBattles, colorBattleIndex) => {
          if (!colorBattles?.length) return null;
          const wonBattles = colorBattles.reduce((sum, { won }) => sum + (won ? 1 : 0), 0);
          const wonAll = wonBattles >= colorBattles.length;
          if (hide && wonAll) return null;
          const isEndless = colorBattleIndex === 9;
          const visible = colorBattles.filter(({ won }) => !(hide && won));
          const cards = isEndless ? visible.slice(0, endlessShown) : visible;
          return <Stack key={'color-battle-' + colorBattleIndex} gap={1}>
            <Typography variant={'sectionTitle'} component={'h2'}>
              {COLOR_MAP[colorBattleIndex]} ({wonBattles}/{colorBattles?.length})
            </Typography>
            <CardGrid size={'s'}>
              {cards.map(({ territoryName, difficulty, won, icon, bonus, battle }, index) => {
                return <ItemCard key={'battle-' + index} icon={icon} title={cleanUnderscore(territoryName)}
                                 meta={isEndless ? `Battle ${battle}` : undefined}
                                 status={won ? 'done' : undefined} statusLabel={'Won'}>
                  {bonus?.bonus ? <ItemCard.Desc text={bonus?.bonus}/> : null}
                  {difficulty?.name ? <ItemCard.Section label={cleanUnderscore(difficulty?.name)}>
                    <ItemCard.Desc text={difficulty?.sentence}/>
                  </ItemCard.Section> : null}
                </ItemCard>;
              })}
            </CardGrid>
            {isEndless && visible.length > endlessShown ? <Box>
              <Button size={'small'} onClick={() => setEndlessShown(endlessShown + ENDLESS_STEP)}>
                {`Show ${Math.min(ENDLESS_STEP, visible.length - endlessShown)} more`}
              </Button>
            </Box> : null}
          </Stack>
        })}
      </Stack>
    </Box>
  </>
};

export default Battles;
