import {
  Checkbox,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormHelperText,
  formHelperTextClasses,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  typographyClasses,
  useMediaQuery
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect, useRef, useState } from 'react';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Box from '@mui/material/Box';
import { handleDownload, prefix } from '@utility/helpers';
import Tabber from './Tabber';
import Button from '@mui/material/Button';
import FileUploadButton from '@components/common/DownloadButton';
import { IconFileExport } from '@tabler/icons-react';
import Link from 'next/link';
import { resolveSettingsTarget } from '@utility/dashboard/settingsTarget';

// Static hints that point a tracker's config toggle at the page where its values are set.
// Kept out of the saved config so it renders for every user regardless of their stored config version.
const trackerDescriptions = {
  materialTracker: {
    text: 'Set item thresholds in',
    linkText: 'Tools → Material Tracker',
    href: '/tools/material-tracker'
  }
};

// camelToTitleCase splits on digits too, so names carrying one read wrong ("p2wUpgrades" becomes
// "P 2w Upgrades"). Names listed here render as written instead.
const labelOverrides = {
  p2wUpgrades: 'P2W Upgrades'
};

const getLabel = (name) => labelOverrides[name] ?? name?.camelToTitleCase();

// How long the setting an alert pointed at stays tinted after the modal opens on it.
const HIGHLIGHT_DURATION = 1600;

// Scrolls the row a dashboard alert asked for into view and fades its tint out again. The rows it
// runs on are mounted expanded (their Collapse starts open), so there is no animation to wait on.
const useHighlightTarget = (active) => {
  const ref = useRef(null);
  const [highlighted, setHighlighted] = useState(active);

  useEffect(() => {
    if (!active || !ref.current) return;
    ref.current.scrollIntoView({ block: 'center' });
    const timeout = setTimeout(() => setHighlighted(false), HIGHLIGHT_DURATION);
    return () => clearTimeout(timeout);
  }, [active]);

  return [ref, highlighted];
};

// The tint needs breathing room around the row's text, so the padding is offset back out with a
// matching negative margin - every row carries this, highlighted or not, and none of them move.
const highlightSx = (highlighted) => ({
  borderRadius: 1,
  px: 1,
  mx: -1,
  py: 0.5,
  my: -0.5,
  transition: 'background-color .4s',
  backgroundColor: highlighted ? 'action.selected' : 'transparent'
});

// A flat config (characters) has no sections, so both sides are compared as null.
const sameSection = (a, b) => (a ?? null) === (b ?? null);

const DashboardSettings = ({
  open,
  onClose,
  config,
  onChange,
  onFileUpload,
  target,
  hideAlertless,
  onHideAlertlessChange
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  // Null unless the modal was opened by clicking a dashboard alert.
  const resolvedTarget = resolveSettingsTarget(config, target?.configType, target?.path);
  const [selectedTab, setSelectedTab] = useState(0);

  // This component stays mounted while the modal is closed, so the tab has to be pointed at each
  // new target explicitly. Everything below DialogContent unmounts on close and re-reads the
  // target from its own initial state.
  useEffect(() => {
    if (open) setSelectedTab(resolvedTarget?.tab ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  const handleSettingChange = (e, configType, option, trackerName, section) => {
    const tempConfig = structuredClone(config);
    const nameClicked = e?.target?.name;
    const sectionRef = section ? tempConfig[configType][section] : tempConfig[configType];

    if (option?.type === 'array') {
      const optionRef = sectionRef[trackerName || option?.name].options[option?.optionIndex];
      optionRef.props.value[nameClicked] = !optionRef.props.value[nameClicked];
    } else if (option?.type === 'input' && option?.inputVal) {
      sectionRef[trackerName].options[option?.optionIndex].props.value = e?.target?.value;
    } else if (option) {
      const optionRef = sectionRef[trackerName].options[option?.optionIndex];
      optionRef.checked = !optionRef.checked;
    } else {
      const tracker = sectionRef[nameClicked];
      tracker.checked = !tracker.checked;
      tracker.options = tracker.options.map((opt) => {
        if (opt?.type === 'array') {
          const updatedValue = Object.keys(opt.props.value).reduce((result, key) => {
            return { ...result, [key]: tracker.checked }
          }, {});
          return { ...opt, checked: tracker.checked, props: { ...(opt?.props || {}), value: updatedValue } }
        }
        return { ...opt, checked: tracker.checked }
      });
    }
    onChange(tempConfig);
  }

  const handleExport = () => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_exported', {
        event_category: 'engagement',
        event_label: 'dashboard',
        value: 1
      });
    }
    handleDownload(config, 'it-dashboard-config');
  };

  return <Dialog open={open} onClose={onClose} fullWidth>
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Stack gap={2} direction={'row'} alignItems={'center'}>
        <Typography variant={'h6'}>Configuration</Typography>
        <Box display="flex" gap={1}>
          <FileUploadButton onFileUpload={(data) => {
            if (data?.account && data?.characters) {
              onFileUpload(data);
              if (typeof window.gtag !== 'undefined') {
                window.gtag('event', 'dashboard_config_imported', {
                  event_category: 'engagement',
                  event_label: 'dashboard',
                  value: 1
                });
              }
            }
          }}>
            Import
          </FileUploadButton>
          {isSm ? <IconButton onClick={handleExport} size="small">
            <IconFileExport size={18}/>
          </IconButton> : <Button onClick={handleExport} variant="outlined"
                                  startIcon={<IconFileExport size={18}/>}
                                  size="small">Export</Button>}
        </Box>
      </Stack>
      <IconButton onClick={onClose}><CloseIcon/></IconButton>
    </DialogTitle>
    <DialogContent>
      {/* Controlled and out of the URL: the tab is picked for the user when an alert opens the
       modal on its own setting, and the dashboard page's own query has no business changing. */}
      <Tabber tabs={['Account', 'Character', 'Timers']} disableQuery activeTab={selectedTab}
              onTabChange={setSelectedTab} keepChildren={false}>
        <Box><FieldsByType config={config?.account} configType={'account'} onChange={handleSettingChange}
                           target={resolvedTarget}/></Box>
        <Box>
          {/* A display preference rather than an alert, so it sits above the tracker list and is
           stored per browser instead of in the exported config. */}
          <Box sx={{ mb: 1 }}>
            <FormControlLabel
              sx={{ [`.${typographyClasses.root}`]: { fontSize: 14 } }}
              control={<Checkbox checked={hideAlertless} size={'small'}/>}
              onChange={(e) => onHideAlertlessChange(e.target.checked)}
              label={'Hide characters without alerts'}/>
            <FormHelperText sx={{ ml: 4, mt: -0.5 }}>
              Characters with nothing to act on are left out of the dashboard
            </FormHelperText>
          </Box>
          <Divider sx={{ mb: 1 }}/>
          <FieldsByType config={config?.characters} configType={'characters'} onChange={handleSettingChange}
                        target={resolvedTarget}/>
        </Box>
        <Box><FieldsByType config={config?.timers} configType={'timers'} onChange={handleSettingChange}
                           target={resolvedTarget}/></Box>
      </Tabber>
    </DialogContent>
  </Dialog>
};

const FieldsByType = ({ config, onChange, configType, target: rawTarget }) => {
  const target = rawTarget?.configType === configType ? rawTarget : null;
  const firstValue = config ? Object.values(config)?.[0] : null;
  const hasSections = firstValue && typeof firstValue === 'object' && !('checked' in firstValue);
  const sections = hasSections ? config : { _flat: config };

  const [collapsedSections, setCollapsedSections] = useState(() => {
    if (!sections) return {};
    return Object.keys(sections).reduce((acc, section) => {
      // The section holding the alert's setting opens straight away, so its row is mounted and
      // can be scrolled to.
      acc[section] = section !== target?.section;
      return acc;
    }, {});
  });

  const handleSectionCollapse = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return sections && Object.entries(sections)?.map(([section, fields], index) => {
    if (section === '_flat') {
      return <Fields key="flat" config={fields} onChange={onChange} configType={configType} target={target}/>;
    }
    return <React.Fragment key={`tracker-${index}`}>
      <Stack sx={{ cursor: 'pointer' }} direction="row" alignItems="center" justifyContent="space-between"
             onClick={() => handleSectionCollapse(section)}>
        <Typography variant={'body2'} color={'text.secondary'}>{section}</Typography>
        <IconButton size="small">
          {collapsedSections[section] ? <ArrowDropDownIcon/> : <ArrowDropUpIcon/>}
        </IconButton>
      </Stack>
      <Collapse in={!collapsedSections[section]} unmountOnExit>
        <Fields config={fields} onChange={onChange} configType={configType} section={section} target={target}/>
      </Collapse>
    </React.Fragment>;
  })
}

const Fields = ({ config, onChange, configType, section, target }) => {
  // The alert's own tracker starts with its options open, so the option it points at is mounted
  // and can be scrolled to.
  const targetTracker = target && sameSection(target.section, section) ? target.trackerName : null;
  const [showId, setShowId] = useState(targetTracker);

  const handleArrowClick = (trackerName) => {
    setShowId(showId === trackerName ? null : trackerName)
  }

  return config && Object.entries(config)?.map(([trackerName, data], index) => {
    return <TrackerRow key={`tracker-${trackerName}-${index}`}
                       trackerName={trackerName}
                       data={data}
                       onChange={onChange}
                       configType={configType}
                       section={section}
                       showId={showId}
                       onArrowClick={handleArrowClick}
                       target={targetTracker === trackerName ? target : null}/>
  })
}

const TrackerRow = ({ trackerName, data, onChange, configType, section, showId, onArrowClick, target }) => {
  // Only one of the two gets tinted: the option the alert names, or the tracker itself when the
  // alert doesn't map onto a single option.
  const [rowRef, highlighted] = useHighlightTarget(Boolean(target) && !target?.optionName);

  // mx:0 - the row's own indent is the highlight padding here, so it doesn't need both.
  return <Box ref={rowRef} sx={{ ...highlightSx(highlighted), mx: 0 }}>
    {data?.category ? <Typography variant="caption" color="text.secondary">{data.category?.camelToTitleCase()}</Typography> : null}
    <Stack direction={'row'} justifyContent={'space-between'}>
      <FormControlLabel
        sx={{ [`.${typographyClasses.root}`]: { fontSize: 14 } }}
        control={<Checkbox name={trackerName} checked={data?.checked} size={'small'}/>}
        onChange={(e) => onChange(e, configType, null, null, section)}
        label={getLabel(trackerName)}/>
      {data?.options?.length > 0 ? <IconButton size={'small'}
                                               onClick={() => onArrowClick(trackerName)}>
        {showId === trackerName ? <ArrowDropUpIcon/> : <ArrowDropDownIcon/>}
      </IconButton> : null}
    </Stack>
    {trackerDescriptions[trackerName] ? <FormHelperText sx={{ ml: 4, mt: -0.5, mb: 0.5 }}>
      {trackerDescriptions[trackerName].text}{' '}
      <Link href={trackerDescriptions[trackerName].href} style={{ textDecoration: 'underline', color: 'inherit' }}>
        {trackerDescriptions[trackerName].linkText}
      </Link>
    </FormHelperText> : null}
    <Collapse in={showId === trackerName} unmountOnExit>
      <Stack sx={{ ml: 3, mr: 3 }}>
        {data?.options?.map((option, optionIndex) => {
          return <BaseField key={`${option?.name}-${optionIndex}`}
                            trackerName={trackerName}
                            option={{ ...option, optionIndex }}
                            configType={configType}
                            onChange={onChange}
                            section={section}
                            highlight={target?.optionName === option?.name}
          />
        })}
      </Stack>
    </Collapse>
  </Box>
}

// Locks every input to the same x. The widest label sharing a row with an input is 23 characters
// ("Affordable Stamp Levels"), which fits inside this alongside the checkbox. Checkbox-only rows
// keep their natural width so the few far longer labels ("Show Gilded When No Atom Discount",
// 33 characters) stay on one line.
const INPUT_LABEL_WIDTH = 200;

const BaseField = ({ option, trackerName, onChange, configType, section, highlight }) => {
  const { type, props } = option || {};
  const isImageArray = props?.type === 'img';
  const [rowRef, highlighted] = useHighlightTarget(Boolean(highlight));
  return <>
    {option?.category ? <Typography variant={'caption'}>{option?.category?.camelToTitleCase()}</Typography> : null}
    <Stack ref={rowRef} sx={highlightSx(highlighted)}>
      {/* The helper sits under the whole row, not beside the label - a long one used to stretch
       the label column and knock that row's input out of line with every other row. */}
      <Stack direction={'row'} gap={2}>
        {type !== 'array' ? <FormControlLabel
          sx={{
            minWidth: isImageArray ? 'inherit' : 100,
            // Only lock the width once there's room for it - on a phone the label keeps its
            // natural size so the row doesn't overflow sideways.
            ...(type === 'input' ? { width: { xs: 'auto', sm: INPUT_LABEL_WIDTH }, flexShrink: 0 } : {}),
            [`.${typographyClasses.root}`]: { fontSize: 14 }
          }}
          control={<Checkbox name={option?.name}
                             checked={option?.checked}
                             size={'small'}
          />}
          onChange={(e) => onChange(e, configType, option, trackerName, section)}
          label={<>
            <Typography>{getLabel(option?.name)}</Typography>
          </>}
        /> : null}
        {type === 'input' ?
          <InputField option={option} trackerName={trackerName} configType={configType} onChange={onChange}
                      section={section}/> : null}
        {type === 'array'
          ? <ArrayField option={option} trackerName={trackerName} configType={configType} onChange={onChange}
                        section={section}/>
          : null}
      </Stack>
      {option?.helperText ? <FormHelperText sx={{ ml: 3, mt: 0 }}>{option?.helperText}</FormHelperText> : null}
    </Stack></>
}

const ArrayField = ({ option, onChange, configType, trackerName, section }) => {
  const { value, type } = option?.props;
  return <Stack direction={'row'} flexWrap={'wrap'}>
    {Object.keys(value)?.map((opt, index) => {
      return <FormControlLabel
        key={`${opt}-${index}`}
        onChange={(e) => onChange(e, configType, option, trackerName, section)}
        control={<Checkbox name={opt} checked={value?.[opt]} size={'small'}/>}
        label={type === 'img' ? <img width={24} height={24} src={`${prefix}data/${opt}.png`}
                                     alt=""/> : opt.camelToTitleCase()}/>
    })}
  </Stack>
}
const InputField = ({ option, onChange, configType, name, trackerName, section }) => {
  const {
    label,
    value,
    helperText = '',
    maxValue,
    minValue = 0,
    endAdornment = ''
  } = option?.props;
  return <TextField
    size={'small'}
    label={label.capitalize()}
    type={'number'}
    sx={{ mt: 1, width: 150, [`.${formHelperTextClasses.root}`]: { m: 0 } }}
    name={name}
    value={value}
    slotProps={{
      input: {
        endAdornment: endAdornment ? <InputAdornment position="end">{endAdornment}</InputAdornment> : null,
      },
      htmlInput: {
        max: maxValue, min: minValue, autoComplete: 'off'
      }
    }}
    onChange={(e) => onChange(e, configType, { ...option, inputVal: true }, trackerName, section)}
    helperText={helperText}/>
}

export default DashboardSettings;
