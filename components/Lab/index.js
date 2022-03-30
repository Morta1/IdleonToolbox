import styled from 'styled-components'
import "../Common/Tooltips/NumberTooltip";
import { useContext, useState } from "react";
import { AppContext } from "../Common/context";
import Tabs from "../Common/Tabs";
import MainFrame from "./MainFrame";
import Console from "./Console";

const Lab = ({ lab, characters }) => {
  const { accountDisplay, setUserAccountDisplay } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(accountDisplay?.subView || 'main frame');
  const tabs = [
    { name: 'main frame' },
    { name: 'console' }
  ];


  const handleTabChange = (clickedTab) => {
    setUserAccountDisplay({ view: 'laboratory', subView: clickedTab });
    setSelectedTab(clickedTab);
  }


  return (
    <LabStyle>
      <Tabs subView={selectedTab} tabs={tabs} onTabChange={handleTabChange}/>
      {selectedTab === 'main frame' && <MainFrame {...{ lab, characters }}/>}
      {selectedTab === 'console' &&
      <Console chips={lab?.chips} characters={characters} playersChips={lab?.playersChips}/>}
    </LabStyle>
  );
};

const LabStyle = styled.div`
`;

export default Lab;
