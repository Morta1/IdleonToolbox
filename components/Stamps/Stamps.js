import styled from 'styled-components'
import StampsCategory from "./StampsCategory";
import { useContext, useState } from "react";
import { AppContext } from "../Common/context";

const Stamps = ({ stamps, alchemy, bribes }) => {
  const { accountDisplay, stampsGoals, setUserStampsGoals, setUserAccountDisplay } = useContext(AppContext);
  const [stamp, setStamp] = useState(accountDisplay?.subView || 'combat');

  const handleGoalUpdate = (categoryName, levels) => {
    setUserStampsGoals(categoryName, levels);
  };

  const handleStampChange = (clickedStamp) => {
    setUserAccountDisplay({ view: 'stamps', subView: clickedStamp });
    setStamp(clickedStamp);
  }

  return (
    <StampsStyle>
      <div className={'tabs'}>
        <div className={`${stamp === 'combat' ? 'active' : ''}`} onClick={() => handleStampChange('combat')}>Combat
        </div>
        <div className={`${stamp === 'skills' ? 'active' : ''}`} onClick={() => handleStampChange('skills')}>Skills
        </div>
        <div className={`${stamp === 'misc' ? 'active' : ''}`} onClick={() => handleStampChange('misc')}>Misc</div>
      </div>
      {Object.keys(stamps)?.map((stampCategoryName, categoryIndex) => {
        const stampCategory = stamps[stampCategoryName];
        return accountDisplay?.view === 'stamps' && stamp === stampCategoryName ?
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
  .tabs {
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

    & img {
      height: 100px;
      width: 100px;
      object-fit: contain;
    }
  }
`;

export default Stamps;
