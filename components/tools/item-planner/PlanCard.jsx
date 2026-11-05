import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, IconButton, InputBase, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { IconChevronDown, IconChevronRight, IconDotsVertical, IconPencil, IconPlus } from '@tabler/icons-react';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { cardSurface } from '@components/common/cards/tokens';
import { withCurrentSprites } from '@utility/itemPlanner';
import AddItemForm from './AddItemForm';
import TrackedItems from './TrackedItems';
import UpgradeChains from './UpgradeChains';
import { CoveredMaterials, GroupTitle, MaterialRows } from './MaterialList';

const ICON_BUTTON_SIZE = { xs: 44, sm: 36 };

// Floored, so a plan at 99.96% never reads 100; below 1% the fraction shows.
const formatPercent = (percent) => formatNum(percent > 0 && percent < 1 ? percent : Math.floor(percent), 'pct', { bare: true });

// The headline is the one thing holding the plan back: its scarcest material, else the next craft
const progressHeadline = ({ progress, craftNext, itemCount }) => {
  if (!itemCount) return { tone: 'idle', text: 'No items yet' };
  if (progress.blocker) return { tone: 'short', text: `Short on ${cleanUnderscore(progress.blocker.itemName)}` };
  const toCraft = craftNext.find(({ state }) => state !== 'ready');
  if (toCraft) return { tone: 'ready', text: `Craft ${cleanUnderscore(toCraft.itemName)} next` };
  if (!progress.total) return { tone: 'idle', text: 'Nothing to craft' };
  return { tone: 'ready', text: 'All materials ready' };
};

const HEADLINE_STATUS = { short: 'problem', ready: 'done' };

const Progress = ({ progress, craftNext, itemCount }) => {
  const headline = progressHeadline({ progress, craftNext, itemCount });
  const percent = progress.blocker ? progress.percent : progress.total ? 100 : 0;
  return <Stack gap={0.5} sx={{ width: { xs: '100%', sm: 240 } }}>
    <Stack direction={'row'} justifyContent={'space-between'} gap={1}>
      {headline.tone === 'idle'
        ? <Typography variant={'body2'} color={'text.secondary'}>{headline.text}</Typography>
        : <StatusText status={HEADLINE_STATUS[headline.tone]} wrap>{headline.text}</StatusText>}
      {progress.blocker ? <Typography variant={'body2'} color={'text.secondary'}>
        {formatPercent(progress.percent)}%
      </Typography> : null}
    </Stack>
    {itemCount > 0 && progress.total > 0 ? <>
      <Box sx={{ height: 6, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{
          height: '100%',
          width: `${percent}%`,
          borderRadius: 999,
          bgcolor: progress.blocker ? 'error.main' : 'success.main'
        }}/>
      </Box>
      <Typography variant={'caption'} color={'text.muted'}>
        {`${formatNum(progress.ready, 'whole')} of ${formatNum(progress.total, 'whole')} materials ready`}
      </Typography>
    </> : null}
  </Stack>;
};

const PlanName = ({ name, renaming, onRename, onCancel }) => {
  if (!renaming) {
    return <Typography variant={'cardTitle'} component={'h2'} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {name}
    </Typography>;
  }
  return <InputBase
    autoFocus
    defaultValue={name}
    inputProps={{ 'aria-label': 'Plan name' }}
    onBlur={(event) => onRename(event.target.value)}
    onKeyDown={(event) => {
      if (event.key === 'Enter') onRename(event.target.value);
      if (event.key === 'Escape') onCancel();
    }}
    sx={{ fontWeight: 500, borderBottom: 1, borderColor: 'primary.main' }}
  />;
};

const PlanCard = ({
                    plan,
                    view,
                    defaultExpanded = false,
                    startRenaming = false,
                    showAll,
                    unknown,
                    onAddItem,
                    onSetCount,
                    onRename,
                    onRemove
                  }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [renaming, setRenaming] = useState(startRenaming);
  const [adding, setAdding] = useState(false);
  const cardRef = useRef(null);

  // A plan just made with New plan lands at the bottom of the list, so bring it into view to be named
  useEffect(() => {
    if (startRenaming) cardRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, []);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuButton = useRef(null);
  const [pendingRename, setPendingRename] = useState(false);
  const items = withCurrentSprites(plan?.items);
  // A failed storage section can't say what is short, so every material shows
  const craftNext = showAll || unknown ? view.craftNext : view.craftNext.filter(({ state }) => state !== 'ready');
  const gather = showAll || unknown ? view.gather : view.gather.filter(({ state }) => state === 'short');
  const shortCount = view.gather.filter(({ state }) => state === 'short').length;
  const nothingMissing = !showAll && !unknown && !craftNext.length && !gather.length;

  const rename = (name) => {
    onRename(name);
    setRenaming(false);
  };

  return <Box ref={cardRef} component={'section'} aria-label={`${plan?.name} plan`} sx={(theme) => cardSurface(theme)}>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: { xs: 1, sm: 2 },
      px: { xs: 0.5, sm: 2 },
      py: 1.5,
      borderBottom: expanded ? 1 : 0,
      borderColor: 'divider'
    }}>
      <IconButton aria-label={expanded ? 'Collapse plan' : 'Expand plan'} aria-expanded={expanded}
                  onClick={() => setExpanded(!expanded)}
                  sx={{ width: ICON_BUTTON_SIZE, height: ICON_BUTTON_SIZE, color: 'text.secondary' }}>
        {expanded ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}
      </IconButton>
      <Box sx={{ display: { xs: 'none', sm: 'flex' } }} aria-hidden>
        {items.slice(0, 4).map(({ itemName, rawName }) => <GameIcon key={itemName} src={`data/${rawName}.png`} size={40} alt={''}/>)}
      </Box>
      <Stack sx={{ flex: '1 1 180px', minWidth: 0 }}>
        <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ minWidth: 0 }}>
          <PlanName name={plan?.name} renaming={renaming} onRename={rename} onCancel={() => setRenaming(false)}/>
          {!renaming ? <IconButton aria-label={'Rename plan'} onClick={() => setRenaming(true)}
                                   sx={{ width: 28, height: 28, color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}>
            <IconPencil size={16}/>
          </IconButton> : null}
        </Stack>
        <Typography variant={'caption'} color={'text.muted'}>
          {formatNum(items.length, 'whole')} item{items.length === 1 ? '' : 's'} tracked
        </Typography>
      </Stack>
      <Box sx={{ order: { xs: 3, sm: 0 }, flexBasis: { xs: '100%', sm: 'auto' }, px: { xs: 1.5, sm: 0 } }}>
        {unknown ? null : <Progress progress={view.progress} craftNext={view.craftNext} itemCount={items.length}/>}
      </Box>
      <IconButton ref={menuButton} aria-label={'Plan options'} onClick={(event) => setMenuAnchor(event.currentTarget)}
                  sx={{ width: ICON_BUTTON_SIZE, height: ICON_BUTTON_SIZE, color: 'text.secondary' }}>
        <IconDotsVertical size={20}/>
      </IconButton>
      {/* The menu keeps focus until it has closed, so the rename field only opens once it is gone */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} disableRestoreFocus
            TransitionProps={{
              onExited: () => {
                if (!pendingRename) return;
                setPendingRename(false);
                setRenaming(true);
              }
            }}>
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          setExpanded(true);
          setPendingRename(true);
        }}>Rename</MenuItem>
        <Divider/>
        {/* The row is gone once the menu closes, so the delete dialog gives focus back to the menu's button */}
        <MenuItem sx={{ color: 'text.error' }} onClick={() => {
          setMenuAnchor(null);
          onRemove(menuButton.current);
        }}>Delete plan</MenuItem>
      </Menu>
    </Box>

    {expanded ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, p: { xs: 2, sm: 3 } }}>
      <Stack gap={2} sx={{ flex: '1 1 320px', maxWidth: { sm: 420 }, minWidth: 0 }}>
        {/* On phones the results come first: the add form waits behind a button */}
        <Button startIcon={<IconPlus size={18}/>} onClick={() => setAdding(true)}
                sx={{ display: { xs: adding ? 'none' : 'inline-flex', sm: 'none' }, alignSelf: 'flex-start', minHeight: 44 }}>
          Add item
        </Button>
        <Stack gap={2} sx={{ display: { xs: adding ? 'flex' : 'none', sm: 'flex' } }}>
          <Typography variant={'groupLabel'} component={'h3'} color={'text.muted'}>Add to this plan</Typography>
          <AddItemForm onAdd={onAddItem}/>
        </Stack>
        <Typography variant={'groupLabel'} component={'h3'} color={'text.muted'} sx={{ mt: 1 }}>Tracked items</Typography>
        <TrackedItems items={items} onSetCount={onSetCount}/>
      </Stack>
      <Stack gap={3} sx={{ flex: '999 1 560px', minWidth: 0 }}>
        {view.chains.length ? <Stack gap={0.5}>
          <GroupTitle title={'Upgrade chains'}/>
          <UpgradeChains chains={view.chains} unknown={unknown}/>
        </Stack> : null}
        {craftNext.length ? <Stack gap={0.5}>
          <GroupTitle title={'Craft next'}/>
          <MaterialRows rows={craftNext} unknown={unknown}/>
        </Stack> : null}
        {gather.length ? <Stack gap={0.5}>
          <GroupTitle title={'Gather'}
                      count={unknown ? null : showAll
                        ? `${view.gather.length} material${view.gather.length === 1 ? '' : 's'}, ${shortCount} short`
                        : `${shortCount} short`}/>
          <MaterialRows rows={gather} unknown={unknown}/>
        </Stack> : null}
        {showAll && !unknown ? <CoveredMaterials rows={view.covered}/> : null}
        {nothingMissing && items.length ? <StatusText status={'done'} wrap>Nothing missing: every material is ready.</StatusText> : null}
      </Stack>
    </Box> : null}
  </Box>;
};

export default PlanCard;
