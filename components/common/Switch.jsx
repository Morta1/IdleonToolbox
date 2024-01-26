const Switch = ({ selected, children }) => {
  const array = Array.isArray(children) ? children : [children];
  return array?.filter(({ props }) => props?.['switch-id'] === selected);
};

export default Switch;
