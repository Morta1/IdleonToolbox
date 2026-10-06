import React, { useState } from 'react';
import { Box, Divider, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { notateNumber, prefix, secondsToCoarseDuration } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

// The colours the kingdom screen itself draws each outpost mode in, so the map reads the same way
// as the game's: yellow depot, cyan support camp, pink savage stronghold. The game colours a
// connection line by the mode of the outpost it leaves, and so does this.
const MODE_MAP_COLOR = ['#f7de2a', '#31cef0', '#f8b4f8'];
const MODE_LABELS = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];
// Straight up first, then fanning out to either side in 15 degree steps.
const LABEL_ANGLES = Array.from({ length: 24 }, (_, step) => -90 + (step % 2 ? -1 : 1) * Math.ceil(step / 2) * 15)
  .map((deg) => (deg * Math.PI) / 180);

const REACH_SHOWN = 3;
const PANEL_WIDTH = 280;

// The kingdom screen's own coordinate space, padded so markers near an edge are not clipped.
const PADDING = 45;

const distance = (ax, ay, bx, by) => Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));

// The catalog has no real names for resources, only "Resource 4" placeholders, so the sprite is
// the only thing that identifies a node to the player.
const NodeIcon = ({ node, size = 18 }) => (
  <img src={`${prefix}data/${node.rawName}.png`} alt="" width={size} height={size}
       style={{ objectFit: 'contain', verticalAlign: 'middle' }}/>
);

const KingdomMap = ({ outposts, resources }) => {
  const [world, setWorld] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  // Wide screens get the card in a panel beside the map, where it hides nothing. False on the first
  // render, so the static export and hydration both start from the overlay layout.
  const sidePanel = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  const placed = (outposts ?? []).filter(({ onKingdomMap }) => onKingdomMap);
  const worlds = [...new Set(placed.map(({ world: outpostWorld }) => outpostWorld))].sort((a, b) => a - b);
  // Falls back to the first world with outposts so the map is never blank on first render.
  const activeWorld = worlds.includes(world) ? world : worlds[0];

  const worldOutposts = placed.filter(({ world: outpostWorld }) => outpostWorld === activeWorld);
  const worldNodes = (resources ?? []).filter(({ world: nodeWorld, empty }) => nodeWorld === activeWorld && !empty);

  // Hover previews, a click pins: without pinning, reading the side panel means keeping the mouse
  // on the marker the whole time.
  const focused = worldOutposts.find(({ mapIndex }) => mapIndex === (hovered ?? selected)) ?? null;
  const focusedReach = focused ? new Set(focused.reachableNodes) : null;

  const outpostOf = (mapIndex) => worldOutposts.find((outpost) => outpost.mapIndex === mapIndex);
  const nodeOf = (nodeIndex) => worldNodes.find(({ index }) => index === nodeIndex);
  // A node under the cursor wins the card: it is the smaller target, so the player is being
  // deliberate when they land on one.
  const focusedNode = hoveredNode != null ? nodeOf(hoveredNode) : null;

  // Every line the game draws: an outpost to each node it collects, and a support camp to each
  // outpost it boosts.
  const links = worldOutposts.flatMap((outpost) => [
    ...outpost.connectedNodes
      .map((node) => nodeOf(node.index))
      .filter(Boolean)
      .map((node) => ({
        key: `${outpost.mapIndex}-node-${node.index}`,
        outpost,
        x: node.anchorX,
        y: node.anchorY
      })),
    ...(outpost.supportLinks ?? [])
      .map((mapIndex) => outpostOf(mapIndex))
      .filter(Boolean)
      .map((target) => ({
        key: `${outpost.mapIndex}-map-${target.mapIndex}`,
        outpost,
        x: target.mapX,
        y: target.mapY,
        support: true
      }))
  ]);

  const points = [
    ...worldOutposts.map(({ mapX, mapY }) => [mapX, mapY]),
    ...worldNodes.map(({ anchorX, anchorY }) => [anchorX, anchorY])
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  // Bounds come from the markers themselves, not from the screen's origin: worlds sit at different
  // offsets in the kingdom's coordinate space, and anchoring at 0 pads one side with dead space.
  const minX = (xs.length > 0 ? Math.min(...xs) : 0) - PADDING;
  const minY = (ys.length > 0 ? Math.min(...ys) : 0) - PADDING;
  const width = (xs.length > 0 ? Math.max(...xs) : 1) - minX + PADDING;
  const height = (ys.length > 0 ? Math.max(...ys) : 1) - minY + PADDING;

  const dimmed = (isRelevant) => (focused && !isRelevant ? 0.12 : 1);

  // The overlay card is capped rather than scrollable: it cannot take the pointer, so a scrollbar
  // inside it would be unreachable. The side panel sits off the map, so it lists everything.
  const reachShown = sidePanel ? Infinity : REACH_SHOWN;
  const reachable = focused
    ? focused.reachableNodes
      .map((nodeIndex) => nodeOf(nodeIndex))
      .filter(Boolean)
      .map((node) => ({ node, away: Math.round(distance(focused.mapX, focused.mapY, node.anchorX, node.anchorY)) }))
      .sort((a, b) => a.away - b.away)
    : [];
  const reachList = reachable.slice(0, reachShown);
  const reachOverflow = reachable.length - reachList.length;

  // What the focused outpost's Military rank has to be for a node to need no slot Guards. A node
  // already in reach without them (rank needed at or under the current one) is not worth a row.
  const militaryRank = focused?.rankBars?.[3]?.rank ?? 0;
  const rankNeedOf = (nodeIndex) => focused?.nodeRankNeeds?.find((need) => need.nodeIndex === nodeIndex) ?? null;
  const needsGuards = (need) => need != null && need.inReach && (need.rankNeeded == null || need.rankNeeded > militaryRank);
  const rankTargets = focused && focused.mode !== 1
    ? (focused.nodeRankNeeds ?? [])
      .filter((need) => !focused.connectedNodes?.some(({ index }) => index === need.nodeIndex))
      .filter((need) => need.rankNeeded == null || need.rankNeeded > militaryRank)
      .map((need) => ({ need, node: nodeOf(need.nodeIndex) }))
      .filter(({ node }) => node)
    : [];
  const rankList = rankTargets.slice(0, reachShown);
  const rankOverflow = rankTargets.length - rankList.length;
  const rankText = (need) => {
    if (need.rankNeeded == null) return 'no Military rank reaches it';
    const eta = need.etaHours == null ? null : secondsToCoarseDuration(need.etaHours * 3600);
    return `Military ${need.rankNeeded}${eta ? ` · ~${eta}` : ''}`;
  };
  const focusedNodeNeed = focusedNode && focused && focused.mode !== 1 ? rankNeedOf(focusedNode.index) : null;
  // A Support Camp's ring is about outposts, not nodes, so only collecting outposts get the inner one.
  const showGuardRing = focused != null && focused.mode !== 1
    && focused.unitSlots?.some((unit) => unit === 2) && focused.rangeWithoutGuards < focused.range;
  const focusedColor = focused ? MODE_MAP_COLOR[focused.mode] ?? MODE_MAP_COLOR[0] : null;
  // Colour says which ring reaches the node, the dash says another outpost already collects it:
  // most nodes end up taken, so a separate "taken" colour would hide the Guard split entirely.
  const nodeNeedsGuards = (node) => showGuardRing && needsGuards(rankNeedOf(node.index));
  const circlePath = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  // The card parks in the map corner furthest from the marker rather than floating beside it: a
  // marker in the middle band leaves no room for the card on either side, so anchoring to the
  // marker clipped the card's last rows.
  const cardAnchor = focusedNode
    ? { x: focusedNode.anchorX, y: focusedNode.anchorY }
    : focused ? { x: focused.mapX, y: focused.mapY } : null;
  const cardRight = cardAnchor ? (cardAnchor.x - minX) / width < 0.5 : true;
  const cardBottom = cardAnchor ? (cardAnchor.y - minY) / height < 0.5 : true;
  // A ring is often bigger than the map, so its label goes on the first edge point that is on screen
  // and clear of the outpost's card. Placed against the outpost, not a hovered node, so it holds still.
  const labelCardRight = focused ? (focused.mapX - minX) / width < 0.5 : true;
  const labelCardBottom = focused ? (focused.mapY - minY) / height < 0.5 : true;
  const underCard = (x, y, half) => !sidePanel && (labelCardRight ? x + half > minX + 0.6 * width : x - half < minX + 0.4 * width)
    && (labelCardBottom ? y > minY + 0.15 * height : y < minY + 0.85 * height);
  const ringLabelAt = (radius, text) => {
    if (!focused) return null;
    // Rough half-width of the 13px label in map units, so long labels are not cut at the edge.
    const half = text.length * 3.6 + 6;
    const spot = LABEL_ANGLES
      .map((angle) => ({
        x: focused.mapX + radius * Math.cos(angle),
        y: focused.mapY + radius * Math.sin(angle)
      }))
      .find(({ x, y }) => x - half > minX && x + half < minX + width && y > minY + 16 && y < minY + height - 10
        && !underCard(x, y, half));
    return spot ? { ...spot, text } : null;
  };
  const outerLabel = focused
    ? ringLabelAt(focused.range + 15, `${focused.range}px${showGuardRing ? ' with Guards' : ''}`)
    : null;
  // A big ring can have no free spot left on the map, so its range rides on the inner label.
  const innerText = showGuardRing
    ? `${focused.rangeWithoutGuards}px without Guards${outerLabel ? '' : ` · ${focused.range}px with`}`
    : null;
  const innerOnRing = innerText ? ringLabelAt(focused.rangeWithoutGuards + 15, innerText) : null;
  // Both rings past the map edges: the label parks in the corner diagonal to the card instead.
  const innerLabel = innerText && !innerOnRing && !outerLabel
    ? {
      text: innerText,
      x: labelCardRight ? minX + innerText.length * 3.6 + 14 : minX + width - innerText.length * 3.6 - 14,
      y: labelCardBottom ? minY + 18 : minY + height - 14
    }
    : innerOnRing;

  // Over the map the card is pointer-transparent and parks in the corner away from the marker;
  // in the side panel it fills the panel and scrolls, since the panel can take the pointer.
  const cardSx = (overlayWidth) => (sidePanel
    ? { p: 1.25, height: '100%', overflowY: 'auto', border: '1px solid', borderColor: 'divider' }
    : {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 2,
      p: 1.25,
      width: overlayWidth,
      maxHeight: 'calc(100% - 16px)',
      overflow: 'hidden',
      [cardRight ? 'right' : 'left']: 8,
      [cardBottom ? 'bottom' : 'top']: 8
    });
  const card = focusedNode
          ? <Paper elevation={sidePanel ? 0 : 8} sx={cardSx(210)}>
            <Stack direction="row" gap={1} alignItems="center">
              <NodeIcon node={focusedNode} size={28}/>
              <Stack direction="column">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {`${notateNumber(focusedNode.collected, 'Big')} / ${notateNumber(focusedNode.maxQuantity, 'Big')} collected`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {`Node ${focusedNode.index} · Lv${focusedNode.nodeLevel} · ${Math.round(100 * focusedNode.fillPercent)}% spent`}
                </Typography>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Typography variant="caption" sx={{ display: 'block' }}>
              {/* Account-wide storage of this resource, not this node's own pile. */}
              {`In storage: ${notateNumber(focusedNode.stored, 'Big')}`}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              {focusedNode.connected
                ? `Collected by ${focusedNode.connectedMaps.map((mapIndex) => outpostOf(mapIndex)?.name ?? `map ${mapIndex}`).join(', ')}`
                : 'Not connected'}
            </Typography>
            {focusedNodeNeed
              ? <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {focusedNodeNeed.rankNeeded != null && focusedNodeNeed.rankNeeded <= militaryRank
                  ? `${focused.name}: in reach without Guards`
                  : focusedNodeNeed.rankNeeded == null
                    ? `${focused.name}: no Military rank reaches it without Guards`
                    : `${focused.name}: ${rankText(focusedNodeNeed)} (now ${militaryRank}) to reach it without Guards`}
              </Typography>
              : null}
            {focusedNode.exhausted
              ? <Typography variant="caption" sx={{ display: 'block', color: 'warning.main' }}>
                Empty: it pays nothing until a restock refills it.
              </Typography>
              : null}
          </Paper>
          : focused
            ? <Paper elevation={sidePanel ? 0 : 8} sx={cardSx(250)}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{focused.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {MODE_LABELS[focused.mode]}
              {` · ${notateNumber(focused.resourceRate, 'Big')}/hr · ${focused.range}px range`}
            </Typography>
            <Divider sx={{ my: 1 }}/>
            {/* A support camp spends its two slots on outposts, not nodes, so naming them "connected
                nodes" would read as a mistake on every support camp. */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
              {focused.mode === 1 ? 'Boosting' : 'Connected'}
            </Typography>
            {focused.mode === 1
              ? (focused.supportLinks?.length > 0
                ? focused.supportLinks.map((mapIndex, slot) => (
                  <Typography key={`${mapIndex}-${slot}`} variant="caption" sx={{ display: 'block' }}>
                    {outpostOf(mapIndex)?.name ?? `map ${mapIndex}`}
                  </Typography>
                ))
                : <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                  Boosting nothing.
                </Typography>)
              : focused.connectedNodes?.length > 0
                ? focused.connectedNodes.map((node) => (
                  <Stack key={node.index} direction="row" gap={0.75} alignItems="center">
                    <NodeIcon node={node}/>
                    <Typography variant="caption">
                      {node.exhausted
                    ? 'empty'
                    : `${notateNumber(node.collected, 'Big')} / ${notateNumber(node.maxQuantity, 'Big')} collected`}
                    </Typography>
                  </Stack>
                ))
                : <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                  Nothing wired to this outpost.
                </Typography>}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1 }}>
              In reach, not connected
            </Typography>
            {reachList.length > 0
              ? reachList.map(({ node, away }) => (
                <Stack key={node.index} direction="row" gap={0.75} alignItems="center">
                  {/* Kept to one line each: naming the other collector wrapped every row and the
                      card clipped its own last entry. */}
                  <NodeIcon node={node}/>
                  <Typography variant="caption">
                    {`${away}px${node.connected ? ' · taken' : ''}${needsGuards(rankNeedOf(node.index)) ? ' · needs Guards' : ''}`}
                  </Typography>
                </Stack>
              ))
              : <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                No other node is within range.
              </Typography>}
            {reachOverflow > 0
              ? <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                and {reachOverflow} more
              </Typography>
                : null}
            {rankList.length > 0
              ? <>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1 }}>
                  {`Reach without Guards (Military ${militaryRank})`}
                </Typography>
                {rankList.map(({ need, node }) => (
                  <Stack key={node.index} direction="row" gap={0.75} alignItems="center">
                    <NodeIcon node={node}/>
                    <Typography variant="caption">{rankText(need)}</Typography>
                  </Stack>
                ))}
                {rankOverflow > 0
                  ? <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                    and {rankOverflow} more
                  </Typography>
                  : null}
              </>
              : null}
            </Paper>
            : null;

  if (worlds.length === 0) {
    return <Typography>No outposts are on the kingdom map yet.</Typography>;
  }

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
        <ToggleButtonGroup exclusive size="small" value={activeWorld}
                           onChange={(event, next) => {
                             if (next == null) return;
                             setWorld(next);
                             setSelected(null);
                           }}>
          {worlds.map((worldNumber) => (
            <ToggleButton key={worldNumber} value={worldNumber}>World {worldNumber}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        {MODE_LABELS.map((label, mode) => (
          <Stack key={label} direction="row" gap={0.75} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: MODE_MAP_COLOR[mode] }}/>
            <Typography variant="caption">{label}</Typography>
          </Stack>
        ))}
        <Stack direction="row" gap={0.75} alignItems="center">
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'text.primary', opacity: 0.35 }}/>
          <Typography variant="caption">Faded: empty node</Typography>
        </Stack>
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="body2">Click an outpost to pin it</Typography>
          <Tooltip
            title="The dashed ring is how far the outpost reaches: any node inside it can be wired to this outpost. An outpost collects one node at a time: wiring a new one replaces what it had. When the outpost has Guards in its slots, the solid inner ring is its reach without them, and the striped band between the two is the range the Guards add.">
            <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
          </Tooltip>
        </Stack>
        {/* Always rendered: showing it on hover wrapped the toolbar, which pushed the map out from
            under the cursor and ended the hover. */}
        {[
          { key: 'reach', label: 'In reach', color: focusedColor ?? MODE_MAP_COLOR[0] },
          { key: 'guards', label: 'Needs Guards', color: 'text.primary' },
          { key: 'taken', label: 'Dashed: taken by another outpost', color: 'text.secondary', dashed: true }
        ].map(({ key, label, color, dashed }) => (
          <Stack key={key} direction="row" gap={0.75} alignItems="center">
            <Box sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: `2px ${dashed ? 'dashed' : 'solid'}`,
              borderColor: color
            }}/>
            <Typography variant="caption">{label}</Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" gap={1.5}>
        <Box sx={{
          position: 'relative',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          flex: '1 1 auto',
          minWidth: 0,
          maxWidth: `${Math.round((width / height) * 460)}px`,
          aspectRatio: `${width} / ${height}`
        }}>
          <Box component="svg" viewBox={`${minX} ${minY} ${width} ${height}`}
               preserveAspectRatio="xMidYMid meet"
               onClick={() => setSelected(null)}
               sx={{ width: '100%', height: '100%', display: 'block' }}>
            {/* The reach ring sits under everything so markers stay readable inside it. */}
            {showGuardRing
              ? <>
                <defs>
                  <pattern id="guard-band" patternUnits="userSpaceOnUse" width={10} height={10}
                           patternTransform="rotate(45)">
                    <line x1={0} y1={0} x2={0} y2={10} stroke={focusedColor} strokeWidth={4} strokeOpacity={0.22}/>
                  </pattern>
                </defs>
                {/* Only the band the Guards add is striped, so their share reads apart from the base reach. */}
                <path d={`${circlePath(focused.mapX, focused.mapY, focused.range + 15)} ${circlePath(focused.mapX, focused.mapY, focused.rangeWithoutGuards + 15)}`}
                      fillRule="evenodd" fill="url(#guard-band)"/>
                <circle cx={focused.mapX} cy={focused.mapY} r={focused.rangeWithoutGuards + 15}
                        fill={focusedColor} fillOpacity={0.1}
                        stroke={focusedColor} strokeOpacity={0.8} strokeWidth={2}/>
              </>
              : null}
            {focused
              ? <circle cx={focused.mapX} cy={focused.mapY} r={focused.range + 15}
                        fill={showGuardRing ? 'none' : focusedColor} fillOpacity={0.07}
                        stroke={focusedColor} strokeOpacity={0.5}
                        strokeDasharray="6 5" strokeWidth={2}/>
              : null}

            {links.map(({ key, outpost, x, y, support }) => {
              const relevant = !focused || focused.mapIndex === outpost.mapIndex;
              return (
                <line key={key} x1={outpost.mapX} y1={outpost.mapY} x2={x} y2={y}
                      stroke={MODE_MAP_COLOR[outpost.mode] ?? MODE_MAP_COLOR[0]}
                      strokeWidth={relevant && focused ? 3 : 2}
                      strokeDasharray={support ? '7 4' : undefined}
                      opacity={dimmed(relevant)}/>
              );
            })}

            {worldNodes.map((node) => {
              const inReach = focusedReach?.has(node.index);
              const linked = focused?.connectedNodes?.some(({ index }) => index === node.index);
              const relevant = !focused || linked || inReach || focusedNode?.index === node.index;
              return (
                <g key={`node-${node.index}`} opacity={dimmed(relevant)}
                   style={{ cursor: 'pointer' }}
                   onMouseEnter={() => setHoveredNode(node.index)}
                   onMouseLeave={() => setHoveredNode(null)}>
                  {inReach && !linked
                    ? <circle cx={node.anchorX} cy={node.anchorY} r={16} fill="none"
                              stroke={nodeNeedsGuards(node) ? 'currentColor' : focusedColor} strokeWidth={2.5}
                              strokeDasharray={node.connected ? '4 3' : undefined}/>
                    : null}
                  {focusedNode?.index === node.index
                    ? <circle cx={node.anchorX} cy={node.anchorY} r={18} fill="none" stroke="currentColor"
                              strokeWidth={2} opacity={0.8}/>
                    : null}
                  {/* Empty nodes are simply faded: a node with resource left keeps its full colour. */}
                  <image href={`${prefix}data/${node.rawName}.png`} x={node.anchorX - 12} y={node.anchorY - 12}
                         width={24} height={24}
                         style={node.exhausted ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}/>
                </g>
              );
            })}

            {worldOutposts.map((outpost) => {
              const isFocused = focused?.mapIndex === outpost.mapIndex;
              return (
                <g key={`outpost-${outpost.mapIndex}`} opacity={dimmed(isFocused)}
                   style={{ cursor: 'pointer' }}
                   onMouseEnter={() => setHovered(outpost.mapIndex)}
                   onMouseLeave={() => setHovered(null)}
                   onClick={(event) => {
                     event.stopPropagation();
                     setSelected(selected === outpost.mapIndex ? null : outpost.mapIndex);
                   }}>
                  <circle cx={outpost.mapX} cy={outpost.mapY} r={isFocused ? 12 : 9}
                          fill={MODE_MAP_COLOR[outpost.mode] ?? MODE_MAP_COLOR[0]}
                          stroke="#1b1b1b" strokeWidth={2}/>
                  {isFocused
                    ? <text x={outpost.mapX} y={outpost.mapY - 18} textAnchor="middle" fontSize={14}
                            fill="currentColor" stroke="#1b1b1b" strokeWidth={3} paintOrder="stroke">
                      {outpost.name}
                    </text>
                    : null}
                  <title>{`${outpost.name} · ${MODE_LABELS[outpost.mode]}`}</title>
                </g>
              );
            })}

            {[
              outerLabel ? { key: 'outer', ...outerLabel } : null,
              innerLabel ? { key: 'inner', ...innerLabel } : null
            ].filter(Boolean).map(({ key, x, y, text }) => (
              <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={13}
                    fill={focusedColor} stroke="#1b1b1b" strokeWidth={3} paintOrder="stroke"
                    style={{ pointerEvents: 'none' }}>
                {text}
              </text>
            ))}
          </Box>

          {sidePanel ? null : card}
        </Box>
        {sidePanel
          // Always mounted at a fixed width, and its content never sizes the row: a panel that
          // appeared or grew on hover would push the map out from under the cursor.
          ? <Box sx={{ position: 'relative', width: PANEL_WIDTH, flexShrink: 0 }}>
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {card ?? <Paper elevation={0} sx={{ ...cardSx(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Hover an outpost or node to see its details, or click an outpost to pin it.
                </Typography>
              </Paper>}
            </Box>
          </Box>
          : null}
      </Stack>
    </Stack>
  );
};

export default KingdomMap;
