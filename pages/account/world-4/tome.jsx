import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, getRealDateInMs, notateNumber } from '@utility/helpers';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import useCheckbox from '@components/common/useCheckbox';
import Timer from '@components/common/Timer';
import { segmentColors } from '@parsers/world-4/tome';

const ranks = ['0.1%', '0.5%', '1%', '5%', '10%', '25%', '50%', '60%', '70%', '80%', '90%', '95%']
const getFormattedQuantity = ({ x2, x4 }, quantity) => quantity > 1e9 && x2 === 1
  ? notateNumber(quantity, 'Big')
  : x4 === 1
    ? Math.round(100 * quantity) / 100
    : commaNotation(quantity);

const Tome = () => {
  const { state } = useContext(AppContext);
  const [CheckboxEl, showThresholds] = useCheckbox('Show quantity thresholds');
  const [CheckboxHideMaxedEl, hideMaxed] = useCheckbox('Hide capped');
  const [CheckboxProgressBarsEl, showProgressBars] = useCheckbox('Show progress bars');
  const [CheckboxCalculatorEl, showCalculator] = useCheckbox('Show quantity calculator');

  // Calculate countdown to next tome nametag reset and next 10 resets
  const { nextResetTime, nextResetTimes } = useMemo(() => {
    const PERIOD_SECONDS = 2628000; // ~30 days 10 hours
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const currentPeriod = Math.floor(currentUnixTime / PERIOD_SECONDS);
    const nextPeriod = currentPeriod + 1;
    const nextResetUnixTime = nextPeriod * PERIOD_SECONDS;
    // Convert to milliseconds for Date object
    const firstReset = nextResetUnixTime * 1000;

    // Calculate next 10 resets
    const resets = [];
    for (let i = 0; i < 10; i++) {
      const period = nextPeriod + i;
      const resetUnixTime = period * PERIOD_SECONDS;
      resets.push(resetUnixTime * 1000);
    }

    return { nextResetTime: firstReset, nextResetTimes: resets };
  }, []);

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Keep track of your tome bonuses and highscores"
    />
    {/*<Typography variant={'caption'}>* Bubble bonus might be inaccurate because it is determined by your active*/}
    {/*  character.</Typography>*/}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Points'} value={commaNotation(state?.account?.tome?.totalPoints)} />
      <CardTitleAndValue title={'Rank'} value={!state?.account?.tome?.tops ? '' : <Tooltip title={<Stack gap={1}>
        {state?.account?.tome?.tops?.map((score, index) => <Stack direction={'row'} gap={1}
          key={'rank' + ranks?.[index]}
          divider={<>-</>}>
          <Typography sx={{ width: 40 }}>{ranks?.[index]}</Typography>
          <Typography>{commaNotation(score)}</Typography>
        </Stack>)}
      </Stack>}>
        <IconInfoCircleFilled size={18} />
      </Tooltip>} icon={`data/TomeTop${state?.account?.tome?.top}.png`} />
      <CardTitleAndValue title={'Nametag Reward Reset'} value={
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Timer type="countdown" date={nextResetTime} lastUpdated={state?.lastUpdated || Date.now()} />
          <Tooltip title={<Stack gap={1}>
            <Typography variant='body1' color='text.secondary'>Next resets</Typography>
            {nextResetTimes.map((resetTime, index) => (
              <Typography variant='body2' key={`reset-${index}`}>
                {getRealDateInMs(resetTime)}
              </Typography>
            ))}
          </Stack>}>
            <IconInfoCircleFilled size={18} />
          </Tooltip>
        </Stack>
      } />
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {state?.account?.tome?.bonuses?.map(({ name, bonus, isMulti, icon }, index) => {
          const formatted = isMulti ? notateNumber(1 + bonus / 100, 'MultiplierInfo') : notateNumber(bonus, 'Big');
          return <CardTitleAndValue key={name} title={cleanUnderscore(name)} value={`${formatted}${isMulti ? 'x' : '%'}`}
            icon={icon || `etc/Tome_${index}.png`}>
          </CardTitleAndValue>
        })}
        {state?.account?.spelunking?.loreBonuses?.map((upgrade) => {
          if (upgrade?.name === 'filler') return null;
          return <CardTitleAndValue key={upgrade?.name} title={upgrade?.name} value={`${notateNumber(upgrade?.isMulti ? 1 + upgrade?.bonus / 100 : upgrade?.bonus, 'MultiplierInfo')}${upgrade?.isMulti ? 'x' : '%'}`}
            icon={`etc/Tome_${upgrade?.index + 6}.png`}>
          </CardTitleAndValue>
        })}
      </Stack>
    </Stack>
    <CheckboxEl />
    <CheckboxHideMaxedEl />
    <CheckboxProgressBarsEl />
    <CheckboxCalculatorEl />

    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {state?.account?.tome?.tome?.map((bonus, rIndex) => {
        const {
          name,
          color,
          tomeLvReq,
          quantity,
          maxPoints,
          index,
          points,
          requiredQuantities
        } = bonus;
        const silverReq = requiredQuantities?.silver || null;
        const goldReq = requiredQuantities?.gold || null;
        const blueReq = requiredQuantities?.blue || null;
        const isReversed = bonus?.x2 === 3; // Type 3: lower quantity = more points

        const tiers = ['bronze', 'silver', 'gold', 'blue'];
        const segments = tiers.map((tier) => {
          const segment = {
            tier,
            progress: 0,
            fillColor: segmentColors[tier],
            startPoint: 0,
            endPoint: null,
            current: quantity,
            isReversed
          };

          // Define tier boundaries
          // For reversed items: blueReq < goldReq < silverReq (lower is better)
          // For normal items: silverReq < goldReq < blueReq (higher is better)
          let bounds;
          if (isReversed) {
            // Reversed: Lower quantity = better tier
            // Bronze: above silverReq (worst)
            // Silver: between goldReq and silverReq  
            // Gold: between blueReq and goldReq
            // Blue: at or below blueReq (best)
            bounds = {
              bronze: { start: silverReq, end: null },
              silver: { start: goldReq, end: silverReq },
              gold: { start: blueReq, end: goldReq },
              blue: { start: 0, end: blueReq }
            };
          } else {
            // Normal: Higher quantity = better tier
            bounds = {
              bronze: { start: 0, end: silverReq },
              silver: { start: silverReq, end: goldReq || blueReq },
              gold: { start: goldReq || silverReq, end: blueReq },
              blue: { start: blueReq, end: null }
            };
          }

          const { start, end } = bounds[tier] || {};
          segment.startPoint = start;
          segment.endPoint = end;

          // Calculate progress based on direction
          if (isReversed) {
            // Lower quantity = better progress
            // Segments represent milestones: each fills as you progress through tiers
            // For reversed: start is the better (lower) threshold, end is the worse (higher) threshold
            if (tier === 'bronze') {
              // Bronze segment: fills as you progress from infinity to silverReq
              // If quantity <= silverReq (start), you've passed bronze tier (segment full)
              segment.progress = start !== null && quantity <= start ? 1 : 0;
            } else if (tier === 'blue') {
              // Blue segment: not displayed in the 3-segment view
              if (end !== null && quantity <= end) {
                segment.progress = 1;
              } else {
                segment.progress = 0;
              }
            } else if (end !== null && start !== null) {
              // Silver/Gold segments: fill as you progress through each tier
              // start = better threshold (lower value, e.g., goldReq=75)
              // end = worse threshold (higher value, e.g., silverReq=100)
              if (quantity > end) {
                segment.progress = 0; // Above worse threshold, haven't reached this tier yet
              } else if (quantity <= start) {
                segment.progress = 1; // Below better threshold, passed this tier completely
              } else {
                // Within tier range (start < quantity <= end)
                // Progress from end (high/worse) down to start (low/better)
                const span = end - start;
                segment.progress = span > 0 ? (end - quantity) / span : 1;
              }
            }
          } else {
            // Higher quantity = better progress
            if (tier === 'blue') {
              segment.progress = quantity >= start ? 1 : 0;
            } else if (end !== null) {
              if (quantity < start) {
                segment.progress = 0; // Not reached tier
              } else if (quantity >= end) {
                segment.progress = 1; // Completed tier
              } else {
                // Within tier range
                const span = end - start;
                segment.progress = span > 0 ? (quantity - start) / span : 1;
              }
            }
          }

          // Clamp progress to [0, 1]
          segment.progress = Math.max(0, Math.min(1, segment.progress));

          return segment;
        });
        const formattedQuantity = getFormattedQuantity(bonus, quantity);
        const pointsProgress = Math.min(1, maxPoints ? points / maxPoints : 0);
        if (hideMaxed && points >= maxPoints) return null;
        return <Card key={'tome-bonus' + index} sx={{ width: 300 }}>
          <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: state?.account?.accountLevel < tomeLvReq ? .5 : 1
          }}>
            <Stack mb={1} direction={'row'} alignItems={'center'} gap={1} justifyContent={'space-between'}>
              <Typography variant={'body1'}>{cleanUnderscore(name.replace('(Tap_for_more_info)', ''))}</Typography>
              {rIndex === 19
                ? <Tooltip
                  title={'Affected by your currently active character'}><IconInfoCircleFilled size={16} /></Tooltip>
                : null}
            </Stack>
            <Stack mt={'auto'} mb={1} justifyContent="space-between" direction={'row'}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Typography>{formattedQuantity}</Typography>
                {showThresholds ? <Tooltip title={<Stack>
                  {Object.entries(requiredQuantities).map(([key, value]) => (
                    <TitleAndValue stackStyle={{ justifyContent: 'space-between' }} key={name + key}
                      title={key.capitalize()} value={getFormattedQuantity(bonus, value)} />
                  ))}
                </Stack>}>
                  <IconInfoCircleFilled size={16} />
                </Tooltip> : null}
              </Stack>
              <Typography color={color}>{commaNotation(points)} PTS</Typography>
            </Stack>
            <TomeProgressBar segments={segments} show={showProgressBars} />
            {showProgressBars
              ? <PointsProgressBar progress={pointsProgress} points={points} maxPoints={maxPoints} bonus={bonus} />
              : null}
            {showCalculator
              ? <QuantityCalculator bonus={bonus} maxPoints={maxPoints} />
              : null}
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const TomeProgressBar = ({ segments, show }) => {
  if (!show) return null;

  // Determine current tier and color for the whole bar
  const bronzeSegment = segments.find(s => s.tier === 'bronze');
  const silverSegment = segments.find(s => s.tier === 'silver');
  const goldSegment = segments.find(s => s.tier === 'gold');
  const blueSegment = segments.find(s => s.tier === 'blue');

  const { current, isReversed } = bronzeSegment || {};
  const currentFormatted = getFormattedQuantity({ x2: 0 }, current);

  // Determine which tier we're in - this determines the color for ALL segments
  let currentColor = segmentColors.bronze;
  
  if (isReversed) {
    // For reversed items: lower is better
    // Check from best (blue) to worst (bronze)
    if (blueSegment && blueSegment.progress >= 1) {
      currentColor = segmentColors.blue;
    } else if (goldSegment && goldSegment.progress > 0) {
      currentColor = segmentColors.gold;
    } else if (silverSegment && silverSegment.progress > 0) {
      currentColor = segmentColors.silver;
    } else {
      currentColor = segmentColors.bronze;
    }
  } else {
    // For normal items: higher is better
    if (blueSegment && blueSegment.progress >= 1) {
      currentColor = segmentColors.blue;
    } else if (goldSegment && goldSegment.progress > 0) {
      currentColor = segmentColors.gold;
    } else if (silverSegment && silverSegment.progress > 0) {
      currentColor = segmentColors.silver;
    } else {
      currentColor = segmentColors.bronze;
    }
  }

  // Filter to only show bronze, silver, gold segments (3 tiers)
  const displaySegments = segments.filter(s => ['bronze', 'silver', 'gold'].includes(s.tier));

  return (
    <Stack gap={0.25} mb={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Tier progress</Typography>
      </Stack>
      <Stack direction={'row'} gap={0.5}>
        {displaySegments.map(({ tier, progress, startPoint, endPoint, current, isReversed }) => {
          const currentFormatted = getFormattedQuantity({ x2: 0 }, current);
          const startFormatted = startPoint !== null ? getFormattedQuantity({ x2: 0 }, startPoint) : '0';
          const endFormatted = endPoint !== null ? getFormattedQuantity({ x2: 0 }, endPoint) : null;

          let rangeText = '';
          if (isReversed) {
            // For reversed: lower is better
            // Bounds are structured as: start (higher value), end (lower value or null)
            if (tier === 'bronze') {
              // Bronze: above silverReq (worst)
              rangeText = `≥ ${startFormatted}`;
            } else if (tier === 'blue') {
              // Blue: at or below blueReq (best)
              rangeText = `≤ ${endFormatted}`;
            } else if (endFormatted && startFormatted) {
              // Silver/Gold: between two values
              rangeText = `${endFormatted} - ${startFormatted}`;
            }
          } else {
            // Normal: higher is better
            if (tier === 'blue') {
              rangeText = `≥ ${startFormatted}`;
            } else if (endFormatted) {
              rangeText = `${startFormatted} - ${endFormatted}`;
            } else {
              rangeText = `${startFormatted}+`;
            }
          }

          const tooltipContent = (
            <Stack gap={0.5}>
              <Typography variant="body1" color="text.secondary">{tier.capitalize()} tier</Typography>
              <Typography variant="body2" color="text.secondary">{rangeText}</Typography>
              <Typography variant="body2" color="text.secondary">
                Current: {currentFormatted}{isReversed ? ' (lower is better)' : ''}
              </Typography>
            </Stack>
          );
          return (
            <Tooltip key={tier} title={tooltipContent}>
              <Box sx={{
                position: 'relative',
                flex: 1,
                height: 8,
                borderRadius: tier === 'bronze' ? '4px 0 0 4px' : tier === 'gold' ? '0 4px 4px 0' : 0,
                overflow: 'hidden',
                bgcolor: (theme) => theme.palette.action.hover
              }}>
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  width: `${progress * 100}%`,
                  bgcolor: currentColor  // All segments use the same color based on current tier
                }} />
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Stack>
  );
};

const PointsProgressBar = ({ progress, points, maxPoints, bonus }) => {
  if (!maxPoints) return null;
  const clamped = Math.max(0, Math.min(1, progress || 0));
  
  // Calculate required quantity for max points based on curve type
  const getRequiredForMaxPoints = () => {
    const { x1, x2, x3 } = bonus || {};
    if (x1 === undefined || x2 === undefined || x3 === undefined) return null;
    
    // Calculate the target percent needed to reach maxPoints
    // maxPoints = ceil(targetPercent * x3), so targetPercent ≈ maxPoints / x3
    const targetPercent = (maxPoints - 0.5) / x3; // Subtract 0.5 to account for ceiling
    
    // Type 2: Linear - quantity = targetPercent * x1
    if (x2 === 2) {
      return { quantity: targetPercent * x1 };
    }
    
    // Type 4: Diminishing returns - solve (2*q / (q + x1))^0.7 = targetPercent
    if (x2 === 4) {
      const base = Math.pow(targetPercent, 1 / 0.7);
      const quantity = (base * x1) / (2 - base);
      return { quantity: Math.ceil(quantity) };
    }
    
    // Type 3: Reversed - solve ((1.2 * (6*x1 - q)) / (7*x1 - q))^5 = targetPercent
    if (x2 === 3) {
      const base = Math.pow(targetPercent, 1 / 5);
      const numerator = 1.2 * 6 * x1 - base * 7 * x1;
      const denom = 1.2 - base;
      const quantity = numerator / denom;
      return { quantity: Math.ceil(Math.max(0, quantity)) };
    }
    
    // Type 0: Exponential - solve (1.7*q / (q + x1))^0.7 = targetPercent
    if (x2 === 0) {
      const base = Math.pow(targetPercent, 1 / 0.7);
      const quantity = (base * x1) / (1.7 - base);
      if (quantity < 0 || !isFinite(quantity)) {
        return { quantity: Infinity };
      }
      return { quantity: Math.ceil(quantity) };
    }
    
    // Type 1: Logarithmic - solve 2.4*log(q) / (2*log(q) + x1) = targetPercent
    if (x2 === 1) {
      const logQ = -(targetPercent * x1) / (2 * targetPercent - 2.4);
      if (logQ <= 0 || !isFinite(logQ)) {
        return { quantity: Infinity };
      }
      const quantity = Math.pow(10, logQ);
      return { quantity: Math.ceil(quantity) };
    }
    
    return null;
  };
  
  const maxInfo = getRequiredForMaxPoints();
  let maxQuantityText = null;
  
  if (maxInfo) {
    if (maxInfo.quantity === Infinity) {
      maxQuantityText = 'Unreachable (asymptotic)';
    } else {
      const formatted = getFormattedQuantity(bonus, maxInfo.quantity);
      maxQuantityText = formatted;
    }
  }
  
  const tooltipContent = maxQuantityText ? (
    <Stack gap={0.5}>
      <Typography variant="body1" color="text.secondary">Max Points</Typography>
      <Typography variant="body2" color="text.secondary">
        {maxInfo?.quantity === Infinity ? maxQuantityText : `Required: ${maxQuantityText}`}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {commaNotation(points)} / {commaNotation(maxPoints)} PTS
      </Typography>
    </Stack>
  ) : null;
  
  return (
    <Stack gap={0.25}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">PTS progress</Typography>
        <Typography variant="caption" color="text.secondary">{commaNotation(points)} / {commaNotation(maxPoints)}</Typography>
      </Stack>
      <Tooltip title={tooltipContent || ''}>
        <Box sx={{
          position: 'relative',
          width: '100%',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: (theme) => theme.palette.action.hover
        }}>
          <Box sx={{
            position: 'absolute',
            inset: 0,
            width: `${clamped * 100}%`,
            bgcolor: 'success.light'
          }} />
        </Box>
      </Tooltip>
    </Stack>
  );
}

const QuantityCalculator = ({ bonus, maxPoints }) => {
  const [targetPoints, setTargetPoints] = React.useState('');

  const calculateRequiredQuantity = (points) => {
    const { x1, x2, x3 } = bonus || {};
    if (!x1 || x2 === undefined || !x3 || !points || points <= 0) return null;

    // Calculate target percent: points = ceil(targetPercent * x3)
    const targetPercent = (points - 0.5) / x3;
    
    // Type 2: Linear
    if (x2 === 2) {
      return Math.ceil(targetPercent * x1);
    }
    
    // Type 4: Diminishing returns
    if (x2 === 4) {
      const base = Math.pow(targetPercent, 1 / 0.7);
      if (base >= 2) return Infinity;
      return Math.ceil((base * x1) / (2 - base));
    }
    
    // Type 3: Reversed
    if (x2 === 3) {
      const base = Math.pow(targetPercent, 1 / 5);
      if (base >= 1.2) return 0;
      const numerator = 1.2 * 6 * x1 - base * 7 * x1;
      const denom = 1.2 - base;
      return Math.ceil(Math.max(0, numerator / denom));
    }
    
    // Type 0: Exponential
    if (x2 === 0) {
      const base = Math.pow(targetPercent, 1 / 0.7);
      if (base >= 1.7) return Infinity;
      return Math.ceil((base * x1) / (1.7 - base));
    }
    
    // Type 1: Logarithmic
    if (x2 === 1) {
      const denom = 2 * targetPercent - 2.4;
      if (denom === 0) return Infinity;
      const logQ = -(targetPercent * x1) / denom;
      if (logQ <= 0) return Infinity;
      return Math.ceil(Math.pow(10, logQ));
    }
    
    return null;
  };

  // Calculate result automatically as user types
  const result = useMemo(() => {
    if (!targetPoints || targetPoints.trim() === '') {
      return null;
    }

    const points = parseFloat(targetPoints);
    if (isNaN(points) || points <= 0) {
      return 'Invalid input';
    }
    if (points > maxPoints) {
      return `Max points is ${commaNotation(maxPoints)}`;
    }
    
    const quantity = calculateRequiredQuantity(points);
    if (quantity === null) {
      return 'Unable to calculate';
    } else if (quantity === Infinity) {
      return 'Unreachable (asymptotic)';
    } else {
      const formatted = getFormattedQuantity(bonus, quantity);
      return `Required: ${formatted}`;
    }
  }, [targetPoints, bonus, maxPoints]);

  return (
    <Stack gap={0.5} mt={2} p={1} sx={{ bgcolor: (theme) => theme.palette.action.hover, borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">Calculate required quantity</Typography>
      <Stack direction="row" gap={1} alignItems="center">
        <input
          type="number"
          placeholder="Target PTS"
          value={targetPoints}
          onChange={(e) => setTargetPoints(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#1a1a1a',
            color: '#fff',
            width: '120px',
            fontSize: '12px'
          }}
        />
        
      {result && (
        <Typography variant="caption" color="primary.main">
          {result}
        </Typography>
      )}
      </Stack>
    </Stack>
  );
};

export default Tome;
