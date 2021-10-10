import styled from 'styled-components'
import CoinDisplay from "./CoinDisplay";
import { cleanUnderscore } from "../../Utilities";
import { Checkbox } from "@material-ui/core";

const Bribes = ({ bribes }) => {
  return (
    <BribesStyle>
      <table>
        <thead>
        <tr>
          <th>Done</th>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
        </tr>
        </thead>
        <tbody>
        {bribes?.map((bribe, index) => {
          const { name, desc, price, done, value } = bribe;
          return <tr key={name + ' ' + index} className={'bribe-row'}>
            <td><StyledCheckbox color={'default'} disabled={done} checked={done}/></td>
            <td>{cleanUnderscore(name)}</td>
            <td
              className={'desc'}>{index === 0 ? cleanUnderscore(desc).replace('5%', `${value}%`) : cleanUnderscore(desc)}</td>
            <td><CoinDisplay money={String(parseInt(price)).split(/(?=(?:..)*$)/)}/></td>
          </tr>
        })}
        </tbody>
      </table>
    </BribesStyle>
  );
};

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

const BribesStyle = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
  padding: 10px;

  table,
  td {
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid #ffffff6b;
    padding: 5px;
  }

  td {
    padding: 5px 15px;
  }

`;

export default Bribes;
