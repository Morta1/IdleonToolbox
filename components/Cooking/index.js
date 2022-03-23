import styled from 'styled-components'
import Tabs from "../Common/Tabs";
import { useContext, useState } from "react";
import { AppContext } from "../Common/context";
import Meals from "./Meals";
import Kitchens from "./Kitchens";

const Cooking = ({ meals, kitchens, spices }) => {
  const { accountDisplay, setUserAccountDisplay } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(accountDisplay?.subView || 'kitchens');
  const tabs = [
    { name: 'kitchens' },
    { name: 'meals' }
  ];


  const handleTabChange = (clickedTab) => {
    setUserAccountDisplay({ view: 'cooking', subView: clickedTab });
    setSelectedTab(clickedTab);
  }

  return (
    <CookingStyle>
      <Tabs subView={selectedTab} tabs={tabs} onTabChange={handleTabChange}/>
      {selectedTab === 'meals' && <Meals meals={meals}/>}
      {selectedTab === 'kitchens' && <Kitchens spices={spices} kitchens={kitchens}/>}
    </CookingStyle>
  );
};

const CookingStyle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export default Cooking;
