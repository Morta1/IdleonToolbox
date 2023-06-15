import {
  Checkbox,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState } from 'react';
import Switch from './Switch';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Box from '@mui/material/Box';
import { prefix } from '../../utility/helpers';

const DashboardSettings = ({ open, onClose, config, onChange }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (e, selected) => {
    setSelectedTab(selected);
  }

  const handleSettingChange = (e, configType, option, trackerName) => {
    const tempConfig = JSON.parse(JSON.stringify(config));
    const nameClicked = e?.target?.name;
    if (option?.type === 'array') {
      const value = tempConfig[configType][option?.name].options[option?.optionIndex].props.value[nameClicked];
      tempConfig[configType][option?.name].options[option?.optionIndex].props.value[nameClicked] = !value;
    } else if (option?.type === 'input') {
      if (option?.inputVal) {
        tempConfig[configType][trackerName].options[option?.optionIndex].props.value = e?.target?.value;
      } else {
        const value = tempConfig[configType][trackerName].options[option?.optionIndex]?.checked;
        tempConfig[configType][trackerName].options[option?.optionIndex].checked = !value;
      }
    } else {
      if (option) {
        const value = tempConfig[configType][trackerName].options[option?.optionIndex]?.checked;
        tempConfig[configType][trackerName].options[option?.optionIndex].checked = !value
      } else {
        const value = tempConfig[configType][nameClicked]?.checked;
        tempConfig[configType][nameClicked].checked = !value;
        tempConfig[configType][nameClicked].options = tempConfig[configType][nameClicked].options.map((option) => {
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
      Dashboard configurations
      <IconButton onClick={onClose}><CloseIcon/></IconButton>
    </DialogTitle>
    <DialogContent>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={'fullWidth'}
            value={selectedTab} onChange={handleTabChange}>
        {['Account', 'Character'].map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>
      <Switch selected={selectedTab}>
        <Box switch-id={0}>
          <Fields config={config?.account} configType={'account'} onChange={handleSettingChange}/>
        </Box>
        <Box switch-id={1}>
          <Fields config={config?.characters} configType={'characters'} onChange={handleSettingChange}/>
        </Box>
      </Switch>
    </DialogContent>
  </Dialog>
};

const Fields = ({ config, onChange, configType }) => {
  const [showId, setShowId] = useState(null);

  const handleArrowClick = (trackerName) => {
    setShowId(showId === trackerName ? null : trackerName)
  }

  return config && Object.entries(config)?.map(([trackerName, data], index) => {
    return <Box key={`tracker-${trackerName}-${index}`}>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <FormControlLabel
          control={<Checkbox name={trackerName} checked={data?.checked}
                             size={'small'}
          />}
          onChange={(e) => onChange(e, configType)}
          label={trackerName?.camelToTitleCase()}/>
        {data?.options?.length > 0 ? <IconButton size={"small"}
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
                              onChange={onChange}/>
          })}
        </Stack>
      </Collapse>
    </Box>
  })
}

const BaseField = ({ option, trackerName, onChange, configType }) => {
  const { type, props } = option || {};
  return <>
    {option?.category ? <Typography variant={'caption'}>{option?.category?.camelToTitleCase()}</Typography> : null}
    <Stack direction={'row'}>
      {type !== 'array' ? <FormControlLabel
        sx={{ minWidth: props?.type === 'img' ? 'inherit' : 100 }}
        control={<Checkbox name={option?.name}
                           checked={option?.checked}
                           size={'small'}
        />}
        onChange={(e) => onChange(e, configType, option, trackerName)}
        label={<>
          <Typography>{option?.name?.camelToTitleCase()}</Typography>
        </>}/> : null}
      {type === 'input' ?
        <InputField option={option} trackerName={trackerName} configType={configType} onChange={onChange}/> : null}
      {type === 'array' ? <ArrayField option={option} configType={configType} onChange={onChange}/> : null}
    </Stack></>
}

const ArrayField = ({ option, onChange, configType }) => {
  const { value, type, } = option?.props;
  return <Stack direction={'row'} flexWrap={'wrap'}>
    {Object.keys(value)?.map((opt, index) => {
      return <FormControlLabel
        key={`${opt}-${index}`}
        onChange={(e) => onChange(e, configType, option)}
        control={<Checkbox name={opt} checked={value?.[opt]} size={'small'}/>}
        label={type === 'img' ? <img width={24} height={24} src={`${prefix}data/${opt}.png`}
                                     alt=""/> : opt.camelToTitleCase()}/>
    })}
  </Stack>
}
const InputField = ({ option, onChange, configType, name, trackerName }) => {
  const {
    label,
    value,
    helperText = '',
    maxValue,
    minValue = 0
  } = option?.props;
  return <TextField
    size={'small'}
    label={label.capitalize()}
    type={'number'}
    sx={{ mt: 1, width: 150 }}
    name={name}
    value={value}
    InputProps={{ inputProps: { max: maxValue, min: minValue, autoComplete: 'off' } }}
    onChange={(e) => onChange(e, configType, { ...option, inputVal: true }, trackerName)}
    helperText={helperText}/>
}

export default DashboardSettings;
