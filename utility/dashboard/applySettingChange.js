export const applySettingChange = (config, e, configType, option, trackerName, section) => {
  const tempConfig = structuredClone(config);
  const nameClicked = e?.target?.name;
  const sectionRef = section ? tempConfig[configType][section] : tempConfig[configType];

  if (option?.type === 'array') {
    const optionRef = sectionRef[trackerName || option?.name].options[option?.optionIndex];
    optionRef.props.value[nameClicked] = !optionRef.props.value[nameClicked];
  } else if (option?.type === 'input' && option?.worldKey) {
    const optionProps = sectionRef[trackerName].options[option?.optionIndex].props;
    // An empty field drops the override, so that world follows the main value again.
    if (option.worldKey === 'reset') optionProps.perWorld = {};
    else if (e?.target?.value === '') delete optionProps.perWorld[option.worldKey];
    else optionProps.perWorld[option.worldKey] = e?.target?.value;
  } else if (option?.type === 'input' && option?.inputVal) {
    sectionRef[trackerName].options[option?.optionIndex].props.value = e?.target?.value;
  } else if (option) {
    const optionRef = sectionRef[trackerName].options[option?.optionIndex];
    optionRef.checked = !optionRef.checked;
  } else {
    // The switch only gates the tracker: its options keep the user's choices.
    const tracker = sectionRef[nameClicked];
    tracker.checked = !tracker.checked;
  }
  return tempConfig;
};
