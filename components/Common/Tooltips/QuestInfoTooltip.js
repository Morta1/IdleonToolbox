import styled from 'styled-components'
import { Tooltip } from "@material-ui/core";
import { cleanUnderscore, numberWithCommas, prefix } from "../../../Utilities";
import CoinDisplay from "../../General/CoinDisplay";

const QuestInfoTooltip = ({
                            rewards,
                            itemReq,
                            customArray,
                            children
                          }) => {
  return (
    <QuestInfoTooltipStyle
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={<div className='tooltip-body'>
        {/*<div className={'title'}>{cleanUnderscore(npcName)}</div>*/}
        {/*<div className="info">*/}
        {/*  {cleanUnderscore(DialogueText)}*/}
        {/*</div>*/}
        {customArray?.length > 0 ? <div className="custom-array">
          <div className={'sub-title'}>Requirements</div>
          <div className={'section'}>{customArray?.map(({ desc, value }, index) => {
            return <div key={desc + '' + index}>
              {cleanUnderscore(desc)} {value}
            </div>
          })}</div>
        </div> : null}
        {itemReq?.length > 0 ? <div className="item-req">
          <div className={'sub-title'}>Item Requirements</div>
          <div className={'item-section'}>{itemReq?.map(({ name, rawName, amount }, index) => {
            return <div className={'item-wrapper'} title={cleanUnderscore(name)} key={name + '' + index}>
              <span className={'amount'}>{numberWithCommas(amount)}</span>
              <img className={'item-img'} src={`${prefix}data/${rawName}.png`} alt=""/>
            </div>
          })}</div>
        </div> : null}
        {rewards?.length > 0 ? <div className="item-req">
          <div className={'sub-title'}>Rewards</div>
          <div className={'item-section'}>{rewards?.map(({ name, rawName, amount }, index) => {
            let img;
            if (rawName.includes('Experience')) {
              img = 'XP';
            } else if (rawName.includes('Talent')) {
              img = 'TalentBook1';
            } else if (rawName.includes('Recipes')) {
              img = `SmithingRecipes${rawName[rawName.length - 1]}`;
            } else {
              img = rawName;
            }
            return <div className={'item-wrapper'} title={cleanUnderscore(name)} key={name + '' + index}>
              {rawName !== 'COIN' ? <>
                  <span className={'amount'}>{numberWithCommas(amount)}</span>
                  <img className={'item-img'}
                       title={cleanUnderscore(name || rawName)}
                       src={`${prefix}data/${img}.png`}
                       alt=""/></> :
                <div className={'coins'}><CoinDisplay labelPosition={'top'}
                                                      money={String(amount).split(/(?=(?:..)*$)/)}/></div>}
            </div>
          })}</div>
        </div> : null}
      </div>}>
      {children}
    </QuestInfoTooltipStyle>
  );
};

const QuestInfoTooltipStyle = styled((props) => (
  <Tooltip
    {...props}
    classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}
  />
))`

  & .tooltip {
    will-change: contents;
    background-color: #393e46;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%),
    0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
    font-size: 16px;
    min-width: 200px;
  }

  & .touch {
  }

  .tooltip-body {
    padding: 10px;

    .section {
      margin-bottom: 10px;
    }

    .item-section {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .coins {
    }

    .title {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .sub-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .info {
    }

    .item-wrapper {
      margin: 20px 10px 0 0;
      position: relative;
      display: inline-block;

      .item-img {
        width: 50px;
        height: 50px;
      }

      .amount {
        position: absolute;
        top: -10px;
        right: 0;
        font-weight: bold;
        background: #000000eb;
        font-size: 13px;
        padding: 0 5px;
      }
    }

  }
`;
export default QuestInfoTooltip;
