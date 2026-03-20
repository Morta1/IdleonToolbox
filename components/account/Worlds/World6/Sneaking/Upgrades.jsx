import { Card, CardContent, Stack, Typography, Chip } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades }) => {
  return (
    (<Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {upgrades?.map(({
        level,
        name,
        description,
        modifier,
        value,
        cost,
        isUnlocked,
        prerequisiteIndex
      }, index) => {
        const bonus = description?.includes('{')
          ? value ?? (level * modifier)
          : notateNumber(1 + (value ?? (level * modifier)) / 100, 'MultiplierInfo')
        return name !== 'Name' ? <Card
          key={'upgrade-' + index}
          sx={{
            width: 320,
            opacity: isUnlocked ? 1 : 0.5
          }}
        >
          <CardContent>
            <Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
              <img width={32} src={`${prefix}data/NjUpgI${index}.png`} alt={''} />
              <Typography>{cleanUnderscore(name)} (Lv. {level ?? 0})</Typography>
            </Stack>
            <Typography>{cleanUnderscore(description.replace(/}|{/g, bonus))}</Typography>
            {prerequisiteIndex !== 0 && prerequisiteIndex !== null && prerequisiteIndex !== undefined && upgrades?.[prerequisiteIndex] && (
              <Typography variant={'caption'} sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                Requires: {cleanUnderscore(upgrades[prerequisiteIndex].name)}
              </Typography>
            )}
          </CardContent>
        </Card> : null;
      })}
    </Stack>)
  );
};

export default Upgrades;
