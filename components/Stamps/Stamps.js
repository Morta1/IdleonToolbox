import styled from 'styled-components'
import StampsCategory from "./StampsCategory";
import { useContext } from "react";
import { AppContext } from "../Common/context";

const Stamps = ({ stamps, alchemy, bribes }) => {
  const { accountDisplay, stampsGoals, setUserStampsGoals } = useContext(AppContext);

  const handleGoalUpdate = (categoryName, levels) => {
    setUserStampsGoals(categoryName, levels);
  };

  return (
    <StampsStyle>
      {Object.keys(stamps)?.map((stampCategoryName, categoryIndex) => {
        const stampCategory = stamps[stampCategoryName];
        return accountDisplay?.view === 'stamps' && accountDisplay?.subView === stampCategoryName ?
          <StampsCategory reductionVial={alchemy?.vials[18]} // BLUE_FLAV
                          reductionBribe={bribes?.[0]}
                          goals={stampsGoals?.[stampCategoryName]}
                          categoryName={stampCategoryName}
                          stamps={stampCategory}
                          onGoalUpdate={handleGoalUpdate}
                          key={stampCategoryName + '' + categoryIndex}/> : null
      })}
    </StampsStyle>
  );
};

const StampsStyle = styled.div`
`;

export default Stamps;
