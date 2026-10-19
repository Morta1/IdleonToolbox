import React, { useState } from 'react';
import { Box, Card, IconButton, InputBase, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { IconChevronDown, IconChevronRight, IconCircleCheck, IconDotsVertical, IconPencil } from '@tabler/icons-react';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { withCurrentSprites } from '@utility/itemPlanner';
import AddItemForm from './AddItemForm';
import TrackedItems from './TrackedItems';
import UpgradeChains from './UpgradeChains';
import { CoveredMaterials, GroupTitle, MaterialRows } from './MaterialList';

const ICON_BUTTON_SIZE = { xs: 44, sm: 36 };

const formatPercent = (percent) => percent < 1 ? percent.toFixed(1) : String(Math.floor(percent));

// The headline is the one thing holding the plan back: its scarcest material, else the next craft
const progressHeadline = ({ progress, craftNext, itemCount }) => {
  if (!itemCount) return { tone: 'idle', text: 'No items yet' };
  if (progress.blocker) return { tone: 'short', text: `Short on ${cleanUnderscore(progress.blocker.itemName)}` };
  const toCraft = craftNext.find(({ state }) => state !== 'ready');
  if (toCraft) return { tone: 'ready', text: `Craft ${cleanUnderscore(toCraft.itemName)} next` };
  if (!progress.total) return { tone: 'idle', text: 'Nothing to craft' };
  return { tone: 'ready', text: 'All materials ready' };
};

const HEADLINE_COLOR = { idle: 'text.secondary', short: 'error.light', ready: 'success.light' };

const Progress = ({ progress, craftNext, itemCount }) => {
  const headline = progressHeadline({ progress, craftNext, itemCount });
  const percent = progress.blocker ? progress.percent : progress.total ? 100 : 0;
  return <Stack gap={0.5} sx={{ width: { xs: '100%', sm: 240 } }}>
    <Stack direction={'row'} justifyContent={'space-between'} gap={1}>
      <Typography variant={'body2'} fontWeight={500} color={HEADLINE_COLOR[headline.tone]}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        {headline.tone === 'ready' ? <IconCircleCheck size={16}/> : null}
        {headline.text}
      </Typography>
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
          bgcolor: progress.blocker ? 'error.light' : 'success.light'
        }}/>
      </Box>
      <Typography variant={'caption'} color={'text.disabled'}>
        {`${progress.ready} of ${progress.total} materials ready`}
      </Typography>
    </> : null}
  </Stack>;
};

const PlanName = ({ name, renaming, onRename, onCancel }) => {
  if (!renaming) {
    return <Typography fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
    sx={{ fontWeight: 500, borderBottom: 1, borderColor: 'multi' }}
  />;
};

const PlanCard = ({ plan, view, defaultExpanded = false, showAll, onAddItem, onSetCount, onRename, onRemove }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [renaming, setRenaming] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [pendingRename, setPendingRename] = useState(false);
  const items = withCurrentSprites(plan?.items);
  const craftNext = showAll ? view.craftNext : view.craftNext.filter(({ state }) => state !== 'ready');
  const gather = showAll ? view.gather : view.gather.filter(({ state }) => state === 'short');
  const shortCount = view.gather.filter(({ state }) => state === 'short').length;
  const nothingMissing = !showAll && !craftNext.length && !gather.length;

  const rename = (name) => {
    onRename(name);
    setRenaming(false);
  };

  return <Card variant={'outlined'} component={'section'} aria-label={`${plan?.name} plan`}>
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
        {items.slice(0, 4).map(({ itemName, rawName }) => <Box key={itemName} component={'img'}
                                                               src={`${prefix}data/${rawName}.png`} alt=""
                                                               sx={{ width: 40, height: 40, objectFit: 'contain' }}/>)}
      </Box>
      <Stack sx={{ flex: '1 1 180px', minWidth: 0 }}>
        <Stack direction={'row'} alignItems={'center'} gap={0.5} sx={{ minWidth: 0 }}>
          <PlanName name={plan?.name} renaming={renaming} onRename={rename} onCancel={() => setRenaming(false)}/>
          {!renaming ? <IconButton aria-label={'Rename plan'} onClick={() => setRenaming(true)}
                                   sx={{ width: 28, height: 28, color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}>
            <IconPencil size={16}/>
          </IconButton> : null}
        </Stack>
        <Typography variant={'caption'} color={'text.disabled'}>
          {items.length} item{items.length === 1 ? '' : 's'} tracked
        </Typography>
      </Stack>
      <Box sx={{ order: { xs: 3, sm: 0 }, flexBasis: { xs: '100%', sm: 'auto' }, px: { xs: 1.5, sm: 0 } }}>
        <Progress progress={view.progress} craftNext={view.craftNext} itemCount={items.length}/>
      </Box>
      <IconButton aria-label={'Plan options'} onClick={(event) => setMenuAnchor(event.currentTarget)}
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
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          onRemove();
        }}>Delete plan</MenuItem>
      </Menu>
    </Box>

    {expanded ? <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, p: { xs: 2, sm: 3 } }}>
      <Stack gap={2} sx={{ flex: '1 1 320px', maxWidth: { sm: 420 }, minWidth: 0 }}>
        <Typography variant={'subtitle2'} color={'text.secondary'}>Add to this plan</Typography>
        <AddItemForm onAdd={onAddItem}/>
        <Typography variant={'subtitle2'} color={'text.secondary'} sx={{ mt: 1 }}>Tracked items</Typography>
        <TrackedItems items={items} onSetCount={onSetCount}/>
      </Stack>
      <Stack gap={3} sx={{ flex: '999 1 560px', minWidth: 0 }}>
        {view.chains.length ? <Stack gap={0.5}>
          <GroupTitle title={'Upgrade chains'}/>
          <UpgradeChains chains={view.chains}/>
        </Stack> : null}
        {craftNext.length ? <Stack gap={0.5}>
          <GroupTitle title={'Craft next'}/>
          <MaterialRows rows={craftNext}/>
        </Stack> : null}
        {gather.length ? <Stack gap={0.5}>
          <GroupTitle title={'Gather'}
                      count={showAll
                        ? `${view.gather.length} material${view.gather.length === 1 ? '' : 's'}, ${shortCount} short`
                        : `${shortCount} short`}/>
          <MaterialRows rows={gather}/>
        </Stack> : null}
        {showAll ? <CoveredMaterials rows={view.covered}/> : null}
        {nothingMissing && items.length ? <Typography variant={'body2'} color={'success.light'}>
          Nothing missing: every material is ready.
        </Typography> : null}
      </Stack>
    </Box> : null}
  </Card>;
};

export default PlanCard;
