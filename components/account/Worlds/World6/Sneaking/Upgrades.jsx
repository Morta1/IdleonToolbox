import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { CardTitleAndValue } from '@components/common/styles';

const Upgrades = ({ upgrades, omnijade }) => {
  return (
    <>
      {omnijade?.owned > 0 ? <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={2}>
        <DoublerUsageCard title={'Omnijade'} doubler={omnijade} icon={DOUBLER_ICONS.omnijade} iconSize={22}/>
        {/* The game's "Omnijade gives +N LVs every day, all without raising Jade Cost!" */}
        <CardTitleAndValue title={'Omnijade daily levels'} icon={DOUBLER_ICONS.omnijade} imgStyle={{ width: 22, height: 22 }}
                           value={`+${omnijade?.dailyLevels ?? 1} LV per day`}/>
      </Stack> : null}
      <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
        {upgrades?.map(({
          level,
          name,
          description,
          modifier,
          value,
          isUnlocked,
          prerequisiteIndex,
          omnijadeLevels,
          omnijadePlaced
        }, index) => {
          const bonus = description?.includes('{')
            ? value ?? (level * modifier)
            : notateNumber(1 + (value ?? (level * modifier)) / 100, 'MultiplierInfo');
          const hasOmnijade = omnijadePlaced || omnijadeLevels > 0;
          return name !== 'Name' ? <Card
            key={'upgrade-' + index}
            sx={{
              width: 320,
              opacity: isUnlocked ? 1 : 0.5
            }}
          >
            <CardContent>
              <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
                <img width={32} src={`${prefix}data/NjUpgI${index}.png`} alt={''}/>
                {/* An Omnijade upgrade shows its level with the Omnijade levels added, like the game's gold level */}
                <Typography>{cleanUnderscore(name)} (Lv. {(level ?? 0) + (hasOmnijade ? omnijadeLevels : 0)})</Typography>
                {hasOmnijade ? <Stack direction={'row'} alignItems={'center'} gap={.5} sx={{ ml: 'auto' }}>
                  <img src={`${prefix}${DOUBLER_ICONS.omnijade}`} alt={''} width={18} height={18}/>
                  <Typography variant={'caption'} color={'info.light'}>Omnijade +{omnijadeLevels} LV</Typography>
                </Stack> : null}
              </Stack>
              <Typography>{cleanUnderscore(description.replace(/}|{/g, bonus))}</Typography>
              {prerequisiteIndex !== null && upgrades?.[prerequisiteIndex] && (
                <Typography variant={'caption'} sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                  Requires: {cleanUnderscore(upgrades[prerequisiteIndex].name)}
                </Typography>
              )}
            </CardContent>
          </Card> : null;
        })}
      </Stack>
    </>
  );
};

export default Upgrades;
