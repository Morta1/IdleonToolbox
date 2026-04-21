import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem, Stack, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { classes } from '@website-data';
import {
  ACCENT,
  CLASS_KEYS,
  FAMILY_ORDER,
  FAMILY_THEME,
  familyOf
} from '@utility/builds/classes';

const CLASS_OPTIONS = FAMILY_ORDER.flatMap((fam) =>
  CLASS_KEYS.filter((k) => familyOf(k) === fam)
);

// Pill-shaped trigger — mirrors the filter pills on the builds list page
// so the form and the browse page feel like the same control.
const PillTrigger = ({ label, value, placeholder, active, onClick }) => (
  <Button
    onClick={onClick}
    sx={{
      textTransform: 'none',
      borderRadius: 999,
      height: 36,
      px: 2,
      background: active ? ACCENT.primarySoft : 'rgba(255,255,255,0.04)',
      color: active ? ACCENT.primary : 'rgba(255,255,255,0.85)',
      border: `1px solid ${active ? ACCENT.primaryBorder : 'rgba(255,255,255,0.08)'}`,
      fontWeight: 500,
      '&:hover': {
        background: active ? ACCENT.primarySoft : 'rgba(255,255,255,0.07)',
        borderColor: active ? ACCENT.primaryBorder : 'rgba(255,255,255,0.14)'
      }
    }}
  >
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, lineHeight: 1 }}>
      <Box
        component="span"
        sx={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1,
          color: active ? ACCENT.primary : 'rgba(255,255,255,0.55)'
        }}
      >
        {label}
      </Box>
      <Box component="span" sx={{ fontSize: 13, lineHeight: 1 }}>
        {value || placeholder}
      </Box>
      <KeyboardArrowDownIcon sx={{ fontSize: 18, opacity: 0.75 }}/>
    </Box>
  </Button>
);

const ClassPicker = ({
  value,
  onChange,
  label = 'Class',
  placeholder = 'Any',
  clearable = true
}) => {
  const [anchor, setAnchor] = useState(null);

  const handlePick = (next) => {
    onChange(next);
    setAnchor(null);
  };

  return (
    <>
      <PillTrigger
        label={label}
        value={value ? cleanUnderscore(value) : null}
        placeholder={placeholder}
        active={!!value}
        onClick={(e) => setAnchor(e.currentTarget)}
      />
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              borderRadius: 2,
              width: { xs: '90vw', md: 680 },
              maxWidth: '95vw'
            }
          }
        }}
      >
        <Stack gap={1.5}>
          {clearable && value && (
            <Stack direction="row" justifyContent="flex-end">
              <Button
                size="small"
                onClick={() => handlePick(null)}
                sx={{
                  textTransform: 'none',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.6)'
                }}
              >
                Clear
              </Button>
            </Stack>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2
            }}
          >
            {FAMILY_ORDER.map((family) => (
              <Stack key={family} gap={0.5}>
                <Box
                  sx={{
                    px: 0.5,
                    pb: 0.5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: FAMILY_THEME[family].primary,
                    borderBottom: `1px solid ${FAMILY_THEME[family].primary}44`
                  }}
                >
                  {family}
                </Box>
                {CLASS_OPTIONS.filter((k) => familyOf(k) === family).map((name) => {
                  const iconIdx = classes.indexOf(name);
                  const selected = value === name;
                  return (
                    <MenuItem
                      key={name}
                      onClick={() => handlePick(name)}
                      selected={selected}
                      sx={{
                        borderRadius: 1,
                        px: 1,
                        py: 0.75,
                        gap: 1,
                        minHeight: 0,
                        '&.Mui-selected': {
                          bgcolor: `${FAMILY_THEME[family].primary}22`,
                          '&:hover': { bgcolor: `${FAMILY_THEME[family].primary}33` }
                        }
                      }}
                    >
                      {iconIdx >= 0 ? (
                        <img
                          src={`${prefix}data/ClassIcons${iconIdx}.png`}
                          alt=""
                          width={20}
                          height={20}
                          style={{ objectFit: 'contain', flexShrink: 0 }}
                        />
                      ) : (
                        <Box sx={{ width: 20, height: 20, flexShrink: 0 }}/>
                      )}
                      <Typography sx={{ fontSize: 13 }} noWrap>
                        {cleanUnderscore(name)}
                      </Typography>
                    </MenuItem>
                  );
                })}
              </Stack>
            ))}
          </Box>
        </Stack>
      </Menu>
    </>
  );
};

export default ClassPicker;
