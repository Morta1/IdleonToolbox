import styled from 'styled-components'
import { prefix } from "../../Utilities";
import { useEffect } from "react";

const OutdatedData = ({ extVersion }) => {
  useEffect(() => {
    localStorage.removeItem('characterData');
  }, []);

  return (
    <OutdatedDataStyle>
      <div className={'info'}>
        <span>Please update your extension to the latest version ({extVersion}) and refresh</span>
        <span className={'small-text'}>If your extension is updated please contact Morojo#2331 in discord</span>
      </div>
      <img src={`${prefix}etc/Dr_Defecaus_Walking.gif`} alt=""/>
    </OutdatedDataStyle>
  );
};

const OutdatedDataStyle = styled.div`
  text-align: center;

  > .info > span {
    display: block;
    margin-bottom: 5px;
  }

  .small-text {
    font-size: 14px;
  }
`;

export default OutdatedData;
