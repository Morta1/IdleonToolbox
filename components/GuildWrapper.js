import styled from 'styled-components'
import { Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel } from "@material-ui/core";
import { useEffect, useState } from "react";
import { cleanUnderscore, prefix } from "../Utilities";

const GuildWrapper = ({ guild }) => {
  const tableHeader = [
    { displayName: 'Name', value: 'name' },
    { displayName: 'Level', value: 'level', sort: true },
    { displayName: 'Guild Points', value: 'guildPoints', sort: true },
    { displayName: 'Wanted Perk', value: 'wantedPerk', sort: true, type: 'string' },
    { displayName: 'Class Name', value: 'className' },
    { displayName: 'Rank', value: 'rank', sort: true }];
  const [tableRows, setTableRows] = useState([]);
  const [orderBy, setOrderBy] = useState('guildPoints');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    setTableRows(guild?.members.sort((a, b) => b['guildPoints'] - a['guildPoints']) || []);
  }, []);

  const sort = (sortBy, order, type) => {
    if (type === 'string') {
      return tableRows.sort((a, b) => {
        const nameA = a?.[sortBy]?.toUpperCase() || ''; // ignore upper and lowercase
        const nameB = b?.[sortBy]?.toUpperCase() || ''; // ignore upper and lowercase
        if (order === 'asc') {
          return nameA.localeCompare(nameB);
        }
        return nameB.localeCompare(nameA);
      })
    }
    return tableRows.sort((a, b) => {
      if (order === 'desc') {
        return a[sortBy] - b[sortBy];
      }
      return b[sortBy] - a[sortBy];
    });
  }

  const handleClick = (colName, type) => {
    const sorted = sort(colName, order, type);
    setOrder(order === 'desc' ? 'asc' : 'desc');
    setOrderBy(colName);
    setTableRows(sorted);
  }
  return (
    <GuildWrapperStyle>
      {!guild ? <div>Missing Guild Information !</div> : <>
        <div className="members">
          <Table size={'small'}>
            <TableHead>
              <TableRow>
                {tableHeader.map(({ displayName, value, sort, type }, index) => (
                  <StyledHeaderCell key={value + index}>
                    {sort ? <TableSortLabel active={orderBy === value}
                                            direction={orderBy === value ? order : 'asc'}
                                            onClick={() => handleClick(value, type)}>
                      {displayName}
                    </TableSortLabel> : displayName}
                  </StyledHeaderCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {
                tableRows?.map((member) => (<TableRow key={member.name}>
                  <TableCell component="th" scope="row">
                    {cleanUnderscore(member.name)}
                  </TableCell>
                  <TableCell>{member.level}</TableCell>
                  <TableCell>{member.guildPoints}</TableCell>
                  <TableCell>{cleanUnderscore(member.wantedPerk) || 'None'}</TableCell>
                  <TableCell>{member.className}</TableCell>
                  <TableCell>{member.rank}</TableCell>
                </TableRow>))
              }
            </TableBody>
          </Table>
        </div>

        <div className={'bonuses'}>
          {guild?.bonuses.map(({ name, rawName, level }, index) => {
            return <div className={'bonus-wrapper'} key={name + index}>
              <span className={'level'}>{level}</span>
              <img title={cleanUnderscore(name)} src={`${prefix}data/${rawName}.png`} alt=""/>
            </div>;
          })}
        </div>
      </>}
    </GuildWrapperStyle>
  );
};

const StyledHeaderCell = styled(TableCell)`
  && {
    background-color: #00000070;
    color: white;
    font-weight: bold;
  }
`;

const GuildWrapperStyle = styled.div`
  padding: 10px;
  margin-top: 15px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));

  .bonuses {
    display: grid;
    gap: 55px;
    grid-template-columns: repeat(4, 50px);
    grid-template-rows: repeat(auto-fit, 50px);
    justify-content: center;
    @media (max-width: 1239px) {
      grid-row: 1;
      margin-top: 20px;
    }

    .bonus-wrapper {
      position: relative;

      .level {
        position: absolute;
        font-weight: bold;
        top: -20px;
        right: 0;

      }
    }
  }


  .members {
    //width: 50%;
  }
`;


export default GuildWrapper;
