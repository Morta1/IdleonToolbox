import {
  Checkbox,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
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
import React, { useState } from 'react';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Box from '@mui/material/Box';
import { handleDownload, prefix } from '../../utility/helpers';
import Tabber from './Tabber';
import Button from '@mui/material/Button';
import FileUploadButton from '@components/common/DownloadButton';
import { IconFileExport } from '@tabler/icons-react';

const DashboardSettings = ({ open, onClose, config, onChange, onFileUpload }) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });

  const handleSettingChange = (e, configType, option, trackerName, section, category) => {
    const tempConfig = structuredClone((config));
    const nameClicked = e?.target?.name;
    const sectionRef = section ? tempConfig[configType][section] : tempConfig[configType];
    if (option?.type === 'array') {
      const value = sectionRef[trackerName || option?.name].options[option?.optionIndex].props.value[nameClicked];
      sectionRef[trackerName || option?.name].options[option?.optionIndex].props.value[nameClicked] = !value;
    } else if (option?.type === 'input') {
      if (option?.inputVal) {
        sectionRef[trackerName].options[option?.optionIndex].props.value = e?.target?.value;
      } else {
        const value = sectionRef[trackerName].options[option?.optionIndex]?.checked;
        sectionRef[trackerName].options[option?.optionIndex].checked = !value;
      }
    } else {
      if (option) {
        const value = sectionRef[trackerName].options[option?.optionIndex]?.checked;
        sectionRef[trackerName].options[option?.optionIndex].checked = !value
      } else {
        const value = sectionRef[nameClicked]?.checked;
        sectionRef[nameClicked].checked = !value;
        sectionRef[nameClicked].options = sectionRef[nameClicked].options.map((option) => {
          if (option?.type === 'array') {
            const updatedValue = Object.entries(option.props.value)?.reduce((result, [key]) => {
              return { ...result, [key]: !value }
            }, {})
            return { ...option, checked: !value, props: { ...(option?.props || {}), value: updatedValue } }
          }
          return { ...option, checked: !value }
        })
      }
    }
    onChange(tempConfig);
  }

  return <Dialog open={open} onClose={onClose} fullWidth>
    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Stack gap={2} direction={'row'} alignItems={'center'}>
        <Typography variant={'h6'}>Configuration</Typography>
        <Box display="flex" gap={1}>
          <FileUploadButton onFileUpload={(data) => {
            if (data?.account && data?.characters) {
              onFileUpload(data);
            }
          }}>
            Import
          </FileUploadButton>
          {isSm ? <IconButton onClick={() => handleDownload(config, 'it-dashboard-config')}
                              size="small">
            <IconFileExport size={18}/>
          </IconButton> : <Button onClick={() => handleDownload(config, 'it-dashboard-config')} variant="outlined"
                                  startIcon={<IconFileExport size={18}/>}
                                  size="small">Export</Button>}
        </Box>
      </Stack>
      <IconButton onClick={onClose}><CloseIcon/></IconButton>
    </DialogTitle>
    <DialogContent>
      <Tabber tabs={['Account', 'Character', 'Timers']}>
        <Box><FieldsByType config={config?.account} configType={'account'} onChange={handleSettingChange}/></Box>
        <Box><FieldsByType config={config?.characters} configType={'characters'} onChange={handleSettingChange}/></Box>
        <Box><FieldsByType config={config?.timers} configType={'timers'} onChange={handleSettingChange}/></Box>
      </Tabber>
    </DialogContent>
  </Dialog>
};

const FieldsByType = ({ config, onChange, configType }) => {
  const [collapsedSections, setCollapsedSections] = useState(() => {
    if (!config) return {};
    return Object.keys(config).reduce((acc, section) => {
      acc[section] = true;
      return acc;
    }, {});
  });

  const handleSectionCollapse = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (configType === 'characters') {
    return <Fields config={config} onChange={onChange} configType={configType}/>
  }
  return config && Object.entries(config)?.map(([section, fields], index) => {
    return <React.Fragment key={`tracker-${index}`}>
      <Stack sx={{ cursor: 'pointer' }} direction="row" alignItems="center" justifyContent="space-between"
             onClick={() => handleSectionCollapse(section)}>
        <Typography variant={'body2'} color={'text.secondary'}>{section}</Typography>
        <IconButton size="small">
          {collapsedSections[section] ? <ArrowDropDownIcon/> : <ArrowDropUpIcon/>}
        </IconButton>
      </Stack>
      <Collapse in={!collapsedSections[section]} unmountOnExit>
        <Fields config={fields} onChange={onChange} configType={configType} section={section}/>
      </Collapse>
    </React.Fragment>;
  })
}

const Fields = ({ config, onChange, configType, section }) => {
  const [showId, setShowId] = useState(null);

  const handleArrowClick = (trackerName) => {
    setShowId(showId === trackerName ? null : trackerName)
  }

  return config && Object.entries(config)?.map(([trackerName, data], index) => {
    return <Box sx={{ ml: 1 }} key={`tracker-${trackerName}-${index}`}>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <FormControlLabel
          sx={{ [`.${typographyClasses.root}`]: { fontSize: 14 } }}
          control={<Checkbox name={trackerName} checked={data?.checked} size={'small'}/>}
          onChange={(e) => onChange(e, configType, null, null, section)}
          label={trackerName?.camelToTitleCase()}/>
        {data?.options?.length > 0 ? <IconButton size={'small'}
                                                 onClick={() => handleArrowClick(trackerName)}>
          {showId === trackerName ? <ArrowDropUpIcon/> : <ArrowDropDownIcon/>}
        </IconButton> : null}
      </Stack>
      <Collapse in={showId === trackerName} unmountOnExit>
        <Stack sx={{ ml: 3, mr: 3 }}>
          {data?.options?.map((option, optionIndex) => {
            return <BaseField key={`${option?.name}-${optionIndex}`}
                              trackerName={trackerName}
                              option={{ ...option, optionIndex }}
                              configType={configType}
                              onChange={onChange}
                              section={section}
            />
          })}
        </Stack>
      </Collapse>
    </Box>
  })
}

const BaseField = ({ option, trackerName, onChange, configType, section }) => {
  const { type, props } = option || {};
  return <>
    {option?.category ? <Typography variant={'caption'}>{option?.category?.camelToTitleCase()}</Typography> : null}
    <Stack direction={'row'}>
      {type !== 'array' ? <Stack>
        <FormControlLabel
          sx={{ minWidth: props?.type === 'img' ? 'inherit' : 100, [`.${typographyClasses.root}`]: { fontSize: 14 } }}
          control={<Checkbox name={option?.name}
                             checked={option?.checked}
                             size={'small'}
          />}
          onChange={(e) => onChange(e, configType, option, trackerName, section)}
          label={<>
            <Typography>{option?.name?.camelToTitleCase()}</Typography>
          </>}
        />
        {option?.helperText ? <FormHelperText sx={{ ml: 3, mt: 0 }}>{option?.helperText}</FormHelperText> : null}
      </Stack> : null}
      {type === 'input' ?
        <InputField option={option} trackerName={trackerName} configType={configType} onChange={onChange}
                    section={section}/> : null}
      {type === 'array'
        ? <ArrayField option={option} trackerName={trackerName} configType={configType} onChange={onChange}
                      section={section}/>
        : null}
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
    InputProps={{
      endAdornment: endAdornment ? <InputAdornment position="end">{endAdornment}</InputAdornment> : null,
      inputProps: {
        max: maxValue, min: minValue, autoComplete: 'off'
      }
    }}
    onChange={(e) => onChange(e, configType, { ...option, inputVal: true }, trackerName, section)}
    helperText={helperText}/>
}

export default DashboardSettings;
