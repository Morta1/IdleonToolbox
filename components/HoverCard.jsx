import { HoverCard, Text } from '@mantine/core';

const CustomHoverCard = ({ children, dropdown }) => {
  return <HoverCard closeDelay={0} withArrow arrowSize={12} shadow={'sm'}>
    <HoverCard.Target>
      {children}
    </HoverCard.Target>
    <HoverCard.Dropdown>
      <Text maw={320}>{dropdown}</Text>
    </HoverCard.Dropdown>
  </HoverCard>
};

export default CustomHoverCard;
