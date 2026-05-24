import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { artifactTierColor } from './sailing.consts';
import styled from '@emotion/styled';
import Tooltip from '../../../../Tooltip';
import { TitleAndValue } from '../../../../common/styles';
import processString from 'react-process-string';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const TIERS = [
  { level: 1, short: 'Base', full: 'Base' },
  { level: 2, short: 'Anc', full: 'Ancient' },
  { level: 3, short: 'Eld', full: 'Eldritch' },
  { level: 4, short: 'Sov', full: 'Sovereign' },
  { level: 5, short: 'Omn', full: 'Omnipotent' },
  { level: 6, short: 'Tra', full: 'Transcendent' }
];

const getTierDescription = (artifact, tier) => {
  switch (tier) {
    case 1: return artifact.description;
    case 2: return artifact.ancientFormDescription;
    case 3: return artifact.eldritchFormDescription;
    case 4: return artifact.sovereignFormDescription;
    case 5: return artifact.omnipotentFormDescription;
    case 6: return artifact.transcendentFormDescription;
    default: return '';
  }
};

const Artifacts = ({ artifacts }) => {
  return (
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {artifacts?.map((artifact, index) => {
        const { name, description, rawName, acquired, additionalData } = artifact;
        const currentTier = acquired ?? 0;
        const bonusDescription = currentTier >= 2 ? getTierDescription(artifact, currentTier) : '';
        const color = artifactTierColor(currentTier);
        return (
          <Card key={name + index} variant={acquired ? 'elevation' : 'outlined'}
                sx={{ opacity: currentTier === 0 ? .5 : 1 }}>
            <CardContent>
              <Stack sx={{ width: 220 }}>
                <Stack direction={'row'} gap={1} alignItems={'center'}>
                  <ArtifactImg src={`${prefix}data/${rawName}.png`} alt=""/>
                  <Typography>{cleanUnderscore(name)}</Typography>
                  {Array.isArray(additionalData) ? <Tooltip title={getTooltip(name, additionalData)}>
                    <IconInfoCircleFilled style={{ marginLeft: 'auto' }} size={18}/>
                  </Tooltip> : null}
                </Stack>
                <TierTrack currentTier={currentTier} artifact={artifact}/>
                <Typography sx={{ fontSize: 11, mt: 0.75, textAlign: 'center', opacity: 0.7 }}>
                  {currentTier === 0
                    ? 'Not Acquired'
                    : `Tier ${currentTier}/6 · ${TIERS[currentTier - 1].full}`}
                </Typography>
                <Divider sx={{ my: 2 }}/>
                <Stack flexWrap={'wrap'}>
                  <Typography sx={{ minHeight: 150 }} component={'div'}>{processString([{
                    regex: /Total bonus.*/gi,
                    fn: (key, result) => {
                      return <div key={key} style={{ marginTop: 15 }}>{result[0]}</div>
                    }
                  }])(cleanUnderscore(description))}</Typography>
                  <Divider flexItem color={color} sx={{ my: 2 }}/>
                  <Typography
                    sx={{
                      opacity: currentTier >= 2 ? 1 : .5,
                      color: color
                    }}>{cleanUnderscore(bonusDescription)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

const TierTrack = ({ currentTier, artifact }) => {
  return (
    <Stack direction={'row'} gap={0.5} sx={{ mt: 1.5 }}>
      {TIERS.map(({ level, full }) => {
        const color = artifactTierColor(level);
        const reached = currentTier >= level;
        const isCurrent = currentTier === level;
        const tierDescription = getTierDescription(artifact, level);
        return (
          <Tooltip key={level} title={
            <>
              <Typography sx={{ color, fontWeight: 'bold' }}>Tier {level}: {full}</Typography>
              {tierDescription ? (
                <Typography sx={{ mt: 0.5 }}>{cleanUnderscore(tierDescription)}</Typography>
              ) : null}
            </>
          }>
            <Box
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 0.5,
                backgroundColor: reached ? color : 'rgba(255,255,255,0.08)',
                opacity: reached ? (isCurrent ? 1 : 0.55) : 1,
                cursor: 'help',
                transition: 'opacity 0.15s'
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
};

const getTooltip = (name, additionalData) => {
  const map = {
    Crystal_Steak: <StatsTooltip additionalData={additionalData}/>,
    Socrates: <AllStatsTooltip additionalData={additionalData}/>
  }
  return map[name] || <></>;
}

const StatsTooltip = ({ additionalData }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }} mb={1} variant={'subtitle1'}>Total Damage</Typography>
    {additionalData?.map(({ name, bonus }, index) => <TitleAndValue key={`stat-${name}-${index}`}
                                                                    boldTitle
                                                                    title={name}
                                                                    value={`${bonus}%`}
    />)}
  </>
}

const AllStatsTooltip = ({ additionalData }) => {
  return <>
    <Typography sx={{ fontWeight: 'bold' }} mb={1} variant={'subtitle1'}>All stats (STR/AGI/WIS/LUK)</Typography>
    {additionalData?.map(({ name, strength, agility, wisdom, luck }, index) => <TitleAndValue
      key={`all-stat-${name}-${index}`}
      boldTitle
      title={name}
      value={`${strength}/${agility}/${wisdom}/${luck}`}
    />)}
  </>
}

const ArtifactImg = styled.img`
  object-fit: contain;
`

export default Artifacts;
