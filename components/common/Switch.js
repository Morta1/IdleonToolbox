const Switch = ({ selected, children }) => {
  return children?.filter(({ props }) => props?.['switch-id'] === selected);
};

export default Switch;
