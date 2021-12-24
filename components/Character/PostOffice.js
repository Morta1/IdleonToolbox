import styled from 'styled-components'
import { prefix } from "../../Utilities";
import PostOfficeTooltip from "../Common/Tooltips/PostOfficeTooltip";

const PostOffice = ({ postOffice }) => {
  const { boxes, unspentPoints } = postOffice;
  return (
    <PostOfficeStyle>
      <div className={'unspent'}> Unspent points: {unspentPoints}</div>
      <div className="boxes">
        {boxes?.map((box, index) => {
          return <div className={'box-wrapper'} key={box?.name + ' ' + index}>
            {box?.level > 0 ? <span className={'level'}>{box?.level}</span> : null}
            <PostOfficeTooltip {...box}>
              <img className={'box'} src={`${prefix}data/UIboxUpg${index}.png`} alt=""/>
            </PostOfficeTooltip>
          </div>
        })}
      </div>
    </PostOfficeStyle>
  );
};

const PostOfficeStyle = styled.div`
  margin-top: 10px;

  .unspent {
    margin: 20px 0;
  }
  
  .boxes {
    display: grid;
    grid-template-columns: repeat(4, minmax(45px, 100px));
    gap: 15px;
  }

  .box-wrapper {
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


  .box {
    object-fit: contain;
  }
`;

export default PostOffice;
