import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import UpgradeCard, { IconValueRow, LabelValue } from '@components/common/UpgradeCard';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { LevelsAheadCaption } from './useMasterclassCostControls';

// Compass / Tesseract / Grimoire upgrade card. `frame` draws a sprite behind the icon (the compass shape).
const MasterclassUpgradeCard = ({
                                  name,
                                  icon,
                                  frame,
                                  helpIcon,
                                  level,
                                  maxLevel,
                                  description,
                                  nextLevelBonus,
                                  extraData,
                                  currencyIcon,
                                  owned,
                                  nextCost,
                                  targetLevel,
                                  targetCost,
                                  unlockText,
                                  unlocked
                                }) => {
  const isMaxed = level >= maxLevel;
  return <UpgradeCard width={340}
                      dimmed={!unlocked}
                      icon={<IconStack>
                        {frame ? <img src={`${prefix}data/${frame}.png`} alt={''}/> : null}
                        <img src={`${prefix}data/${icon}.png`} alt={''}/>
                      </IconStack>}
                      title={<>{cleanUpgradeName(name)}{helpIcon}</>}
                      subtitle={`Lv. ${commaNotation(level)} / ${commaNotation(maxLevel)}`}
                      footer={<>
                        <IconValueRow src={`data/${currencyIcon}.png`}>
                          {isMaxed ? 'Maxed' : <>{notateNumber(owned)} / {notateNumber(nextCost, 'Big')}</>}
                        </IconValueRow>
                        {targetLevel > level + 1
                          ? <LevelsAheadCaption targetLevel={targetLevel} targetCost={targetCost} owned={owned}/>
                          : null}
                        {unlockText ? <Typography variant={'body2'} color={'text.secondary'}>{unlockText}</Typography> : null}
                      </>}>
    <Typography variant={'body2'}>{cleanUnderscore(description)}</Typography>
    {!isMaxed && nextLevelBonus || extraData ? <Stack gap={.5}>
      {!isMaxed && nextLevelBonus ? <LabelValue label={'Next level bonus'}>{nextLevelBonus}</LabelValue> : null}
      {extraData ? <Typography variant={'body2'}>{extraData}</Typography> : null}
    </Stack> : null}
  </UpgradeCard>
};

// "1.25x (+0.05)" for multiplier upgrades, "125 (+5)" for flat ones
export const formatNextLevelBonus = ({ isMulti, smallNotation, nextLevelBonus, bonusDiff }) => {
  const value = isMulti
    ? notateNumber(1 + nextLevelBonus / 100, 'MultiplierInfo')
    : smallNotation ? notateNumber(nextLevelBonus, 'Small') : commaNotation(nextLevelBonus);
  return `${value} (+${bonusDiff?.toFixed?.(2)?.replace?.('.00', '')})`;
};

const IconStack = styled('div')`
  flex-shrink: 0;
  position: relative;
  width: 40px;
  height: 40px;

  & img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export default MasterclassUpgradeCard;
