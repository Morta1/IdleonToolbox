import styled from 'styled-components'
import React from "react";

const Tabs = ({ tabs, onTabChange, subView }) => {
  return (
    <TabsStyle>
      {tabs?.map((tab, index) => {
        return <div key={`${tab?.name}${index}`} className={`${subView === tab?.name ? 'active' : ''}`}
                    onClick={() => onTabChange(tab?.name)}>{tab?.name}</div>
      })}
    </TabsStyle>
  );
};

const TabsStyle = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;

  > div {
    cursor: pointer;
  }

  .active {
    font-weight: bold;
    border-bottom: 2px solid white;
  }
`;

export default Tabs;
