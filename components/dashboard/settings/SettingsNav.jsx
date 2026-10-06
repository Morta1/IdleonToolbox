import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { prefix } from '@utility/helpers';
import { EditedDot } from './EditedTag';

const LONG_SECTION = 6;

const SettingsNav = ({ model, tabIndex, onTabChange, sectionKey, onSectionChange, onTrackerJump }) => {
  const tab = model[tabIndex];
  return <Stack gap={1.5}>
    <ToggleButtonGroup exclusive fullWidth size="small" value={tabIndex}
                       onChange={(e, value) => value !== null && onTabChange(value)}>
      {model.map((item, index) => <ToggleButton key={item.configType} value={index}
                                                sx={{ gap: 0.75, textTransform: 'none', minHeight: { xs: 44, sm: 32 } }}>
        {item.label}{item.edited ? <EditedDot/> : null}
      </ToggleButton>)}
    </ToggleButtonGroup>
    {/* A single-section tab still gets its row: on mobile it is the only way back into the section. */}
    <Stack component="nav" aria-label={`${tab.label} sections`} gap={0.25}>
      {tab.sections.map((section) => {
        const selected = section.key === sectionKey;
        return <React.Fragment key={section.key}>
          <ButtonBase onClick={() => onSectionChange(section.key)} aria-current={selected ? 'true' : undefined}
                      sx={{ justifyContent: 'flex-start', gap: 1.25, px: 1.25, minHeight: { xs: 52, sm: 38 }, borderRadius: 1.5, bgcolor: selected ? 'action.selected' : 'transparent' }}>
            {section.icon
              ? <img src={`${prefix}${section.icon}.png`} alt="" width={22} height={22} style={{ objectFit: 'contain' }}/>
              : <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'action.hover' }}/>}
            <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>{section.label}</Typography>
            {section.edited ? <EditedDot/> : null}
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{section.onCount}/{section.total}</Typography>
          </ButtonBase>
          {selected && section.trackers.length > LONG_SECTION ? section.trackers.map((tracker) =>
            <ButtonBase key={tracker.path} onClick={() => onTrackerJump(tracker.path)}
                        sx={{ justifyContent: 'flex-start', gap: 1, pl: 5.5, pr: 1.25, minHeight: { xs: 44, sm: 28 }, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'left' }}>{tracker.label}</Typography>
              {tracker.edited ? <EditedDot/> : null}
            </ButtonBase>) : null}
        </React.Fragment>;
      })}
    </Stack>
  </Stack>;
};

export default SettingsNav;
