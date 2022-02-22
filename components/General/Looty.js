import { cleanUnderscore, prefix } from "../../Utilities";
import styled from 'styled-components';
import NumberTooltip from "../Common/Tooltips/NumberTooltip";

const Looty = ({ items }) => {
  return <LootyWrapper>
    {items?.map(({ name, rawName }, index) => (
      <NumberTooltip title={cleanUnderscore(name)} key={rawName + index}>
        <img height={50} width={50}  src={`${prefix}data/${rawName}.png`} alt={''} />
      </NumberTooltip>))}
  </LootyWrapper>;
};

const LootyWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 15px;
  gap: 10px;
  
  img {
    margin: 0 auto;
    object-fit: contain;
    height: 50px;
    width: 50px;
  }
`;

export default Looty;