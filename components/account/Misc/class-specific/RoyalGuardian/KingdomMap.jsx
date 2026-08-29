import React, { useState } from 'react';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { notateNumber, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

// The colours the kingdom screen itself draws each outpost mode in, so the map reads the same way
// as the game's: yellow depot, cyan support camp, pink savage stronghold. The game colours a
// connection line by the mode of the outpost it leaves, and so does this.
const MODE_MAP_COLOR = ['#f7de2a', '#31cef0', '#f8b4f8'];
const MODE_LABELS = ['Resource Depot', 'Support Camp', 'Savage Stronghold'];

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

  // The hover card is capped rather than scrollable: it cannot take the pointer, so a scrollbar
  // inside it would be unreachable.
  const REACH_SHOWN = 3;
  const reachable = focused
    ? focused.reachableNodes
      .map((nodeIndex) => nodeOf(nodeIndex))
      .filter(Boolean)
      .map((node) => ({ node, away: Math.round(distance(focused.mapX, focused.mapY, node.anchorX, node.anchorY)) }))
      .sort((a, b) => a.away - b.away)
    : [];
  const reachList = reachable.slice(0, REACH_SHOWN);
  const reachOverflow = reachable.length - reachList.length;
  // The card parks in the map corner furthest from the marker rather than floating beside it: a
  // marker in the middle band leaves no room for the card on either side, so anchoring to the
  // marker clipped the card's last rows.
  const cardAnchor = focusedNode
    ? { x: focusedNode.anchorX, y: focusedNode.anchorY }
    : focused ? { x: focused.mapX, y: focused.mapY } : null;
  const cardRight = cardAnchor ? (cardAnchor.x - minX) / width < 0.5 : true;
  const cardBottom = cardAnchor ? (cardAnchor.y - minY) / height < 0.5 : true;

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
            title="The ring is how far the outpost reaches: any node inside it can be wired to this outpost, whether or not it is wired today. An outpost collects one node at a time: wiring a new one replaces what it had.">
            <InfoIcon sx={{ fontSize: 14, opacity: 0.7 }}/>
          </Tooltip>
        </Stack>
      </Stack>

      <Box sx={{
        position: 'relative',
        color: 'text.primary',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        width: '100%',
        maxWidth: `${Math.round((width / height) * 460)}px`,
        aspectRatio: `${width} / ${height}`
      }}>
        <Box component="svg" viewBox={`${minX} ${minY} ${width} ${height}`}
             preserveAspectRatio="xMidYMid meet"
             onClick={() => setSelected(null)}
             sx={{ width: '100%', height: '100%', display: 'block' }}>
          {/* The reach ring sits under everything so markers stay readable inside it. */}
          {focused
            ? <circle cx={focused.mapX} cy={focused.mapY} r={focused.range + 15}
                      fill={MODE_MAP_COLOR[focused.mode] ?? MODE_MAP_COLOR[0]} fillOpacity={0.07}
                      stroke={MODE_MAP_COLOR[focused.mode] ?? MODE_MAP_COLOR[0]} strokeOpacity={0.5}
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
                            stroke={MODE_MAP_COLOR[focused.mode] ?? MODE_MAP_COLOR[0]} strokeWidth={2}
                            strokeDasharray="3 3"/>
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
        </Box>

        {/* Floats over the map, anchored to the marker: laying it out below the map made the page
            grow and shrink under the cursor. It never takes the pointer, so moving onto the card
            cannot steal the hover from the marker underneath it. */}
        {focusedNode
          ? <Paper elevation={8} sx={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2,
            p: 1.25,
            width: 210,
            [cardRight ? 'right' : 'left']: 8,
            [cardBottom ? 'bottom' : 'top']: 8
          }}>
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
            {focusedNode.exhausted
              ? <Typography variant="caption" sx={{ display: 'block', color: 'warning.main' }}>
                Empty: it pays nothing until a restock refills it.
              </Typography>
              : null}
          </Paper>
          : focused
            ? <Paper elevation={8} sx={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2,
            p: 1.25,
            width: 250,
            maxHeight: 'calc(100% - 16px)',
            overflow: 'hidden',
            [cardRight ? 'right' : 'left']: 8,
            [cardBottom ? 'bottom' : 'top']: 8
          }}>
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
                    {`${away}px${node.connected ? ' · taken' : ''}`}
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
            </Paper>
            : null}
      </Box>
    </Stack>
  );
};

export default KingdomMap;
