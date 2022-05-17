import Tooltip from "../Tooltip";
import { prefix } from "utility/helpers";
import styled from "@emotion/styled";
import ItemDisplay from "../common/ItemDisplay";

const Bags = ({ bags, capBags }) => {
  return (
    <BagsStyled>
      {bags?.map((bag, index) => {
        return <Tooltip key={bag?.displayName + index} title={<ItemDisplay {...bag}/>}>
          <Bag exists={bag?.acquired}
               src={`${prefix}data/${bag?.rawName}.png`} alt=""/>
        </Tooltip>;
      })}
      {capBags?.map((item, index) => {
        const { displayName, rawName, capacity } = item;
        return <Tooltip title={<ItemDisplay {...item}/>} key={displayName + index}>
          <Bag exists={true}
               src={`${prefix}data/${rawName}.png`}
               alt=""/>
        </Tooltip>;
      })}
    </BagsStyled>
  );
};

const BagsStyled = styled.div`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(4, minmax(36px, max-content));
  justify-content: center;
`;

const Bag = styled.img`
  filter: ${({ exists }) => exists ? 'grayscale(0)' : 'grayscale(1)'};
  opacity: ${({ exists }) => exists ? '1' : '0.3'};
  justify-self: center;
  width: 48px;
  height: 48px;

  @media (max-width: 370px) {
    width: 36px;
    height: 36px;
  }
`;

export default Bags;
