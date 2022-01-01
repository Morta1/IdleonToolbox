import { prefix } from "../../Utilities";
import styled from 'styled-components';
import StatueTooltip from "../Common/Tooltips/StatueTooltip";

const Statues = ({ statues }) => {
  return (
    <StatuesWrapper>
      <div className={'statue-group'}>
        {statues?.map((statue, index) => {
          const { name, rawName, level } = statue;
          return <div key={name + index} className={'statue-wrapper'}>
            <span className={'level'}>{level}</span>
            <StatueTooltip {...statue}>
              <img width={41} height={50} src={`${prefix}data/${rawName}.png`} alt=""/>
            </StatueTooltip>
          </div>;
        })}
      </div>
    </StatuesWrapper>
  );
};

const StatuesWrapper = styled.div`
  .statue-group {
    justify-content: center;
    display: grid;
    gap: 25px;
    grid-template-columns: repeat(4, 41px);
    grid-template-rows: repeat(auto-fit, 50px);
  }

  .statue-wrapper {
    display: inline-block;
    position: relative;

    .level {
      position: absolute;
      top: -10px;
      right: 0;
      font-weight: bold;
      background: #000000eb;
      font-size: 13px;
      padding: 0 5px;
    }
  }
`;

export default Statues;
