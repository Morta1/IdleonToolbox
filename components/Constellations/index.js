import styled from 'styled-components'
import { cleanUnderscore } from "../../Utilities";
import { Checkbox } from "@material-ui/core";
import StarSignTooltip from "../Common/Tooltips/StarSignTooltip";

const Constellations = ({ constellations, starSigns }) => {
  const getTotalPoints = () => {
    const { ownedPoints, totalPoints } = constellations?.reduce((res, { points, done }) => {
      if (done) {
        res.ownedPoints += points;
      }
      res.totalPoints += points;
      return res;
    }, { ownedPoints: 0, totalPoints: 0 });
    return `${ownedPoints} / ${totalPoints}`;
  }
  return (
    <ConstellationsStyle>
      {constellations ? <div>
        <div className={'title'}>Constellations</div>
        <span className={'sub-title'}>&nbsp;</span>
        <table>
          <thead>
          <tr>
            <th>Done</th>
            <th>Name</th>
            <th>Progress</th>
            <th>Location</th>
            <th>Requirement</th>
            <th>Points</th>
          </tr>
          </thead>
          <tbody>
          {constellations?.map((constellation, index) => {
            const { name, points, done, requirement, completedChars, requiredPlayers, location } = constellation;
            return <tr key={name + ' ' + index} className={`row${done ? ' done' : ''}`}>
              <td className={'text-align-center'}><StyledCheckbox color={'default'} disabled={done} checked={done}/>
              </td>
              <td
                className={'text-align-center'}>{cleanUnderscore(name)}</td>
              <td className={'text-align-center'}>{`${completedChars.length}/${requiredPlayers}`}</td>
              <td>{(location === 'End_Of_The_Road') ? cleanUnderscore(location) + ' *' : cleanUnderscore(location)}</td>
              <td>{cleanUnderscore(requirement)}</td>
              <td className={'text-align-center'}>{points}</td>
            </tr>
          })}
          <tr>
            <td colSpan={5}/>
            <td className={'total'}>
              {getTotalPoints()}
            </td>
          </tr>
          </tbody>
          <tfoot className={'constellation-footer'}>
          <tr>
            <td colSpan={6}>* - Might be bugged and show extra completed players</td>
          </tr>
          </tfoot>
        </table>
      </div> : null}
      {starSigns ? <div>
        <div className={'title'}>Star Signs</div>
        <span className={'sub-title'}>Hover for more info</span>
        <table>
          <thead>
          <tr>
            <th>Unlocked</th>
            <th>Name</th>
            <th>Cost</th>
          </tr>
          </thead>
          <tbody>
          {starSigns?.map((starSign, index) => {
            const { starName, cost, unlocked, bonuses } = starSign;
            return (!starName.includes('Filler') && !starName.includes('Unknown')) &&
              <tr key={starName + ' ' + index} className={`row${unlocked ? ' done' : ''}`}>
                <td className={'text-align-center'}><StyledCheckbox color={'default'} disabled={unlocked}
                                                                    checked={unlocked}/></td>
                <StarSignTooltip name={starName} bonuses={bonuses}>
                  <td className={'star-name'}>
                    <span>{cleanUnderscore(starName)}</span>
                  </td>
                </StarSignTooltip>
                <td>{cost}</td>
              </tr>
          })}
          </tbody>
        </table>
      </div> : null}
    </ConstellationsStyle>
  );
};

const StyledCheckbox = styled(Checkbox)`
  && {
    color: white;
  }
`;

const ConstellationsStyle = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
  padding: 10px;
  font-size: 14px;

  .title {
    font-size: 24px;
    margin: 0 15px 10px 15px;
    font-weight: bold;
  }
  .sub-title {
    display: inline-block;
    margin: 0 15px 5px 15px;
  }

  .done {
    color: #9de060;
  }

  table,
  td {
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid #ffffff6b;
    padding: 5px;
    margin: 0 15px;
  }

  td {
    padding: 0 15px;
  }

  .constellation-footer {
    vertical-align: middle;

    tr {
      height: 50px;
    }
  }

  .total {
    text-align: right;
  }

  .star-name {
    vertical-align: middle;
  }

  .text-align-center {
    text-align: center;
  }

`;

export default Constellations;
