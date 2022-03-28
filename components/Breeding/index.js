import styled from 'styled-components'
import Tabs from "../Common/Tabs";
import { useContext, useState } from "react";
import { AppContext } from "../Common/context";
import PetUpgrades from "./PetUpgrades";
import ArenaBonuses from "./ArenaBonuses";

const Breeding = ({ meals, breeding }) => {
  const { accountDisplay, setUserAccountDisplay } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(accountDisplay?.subView || 'pet upgrades');
  const tabs = [
    { name: 'pet upgrades' },
    { name: 'arena bonuses' }
  ];


  const handleTabChange = (clickedTab) => {
    setUserAccountDisplay({ view: 'breeding', subView: clickedTab });
    setSelectedTab(clickedTab);
  }

  return (
    <BreedingStyle>
      <Tabs subView={selectedTab} tabs={tabs} onTabChange={handleTabChange}/>
      {selectedTab === 'pet upgrades' ? <PetUpgrades meals={meals} petUpgrades={breeding?.petUpgrades}/> : null}
      {selectedTab === 'arena bonuses' ?
        <ArenaBonuses maxArenaLevel={breeding?.maxArenaLevel} bonuses={breeding?.arenaBonuses}/> : null}
    </BreedingStyle>
  );
};

const BreedingStyle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export default Breeding;
