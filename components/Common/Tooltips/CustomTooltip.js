import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import { prefix } from "../../../Utilities";

const CustomTooltip = ({ bonus, cardName, effect, children }) => {
  return (
    <StyledTooltip
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={
        <div className='tooltip-body'>
          <div className='tooltip-header'>
            <div className={'title'}>{cardName}</div>
            <div>{effect}</div>
          </div>
          <div className='stars'>
            {bonus
              ? [1, 2, 3, 4]?.map((_, index) => {
                return (
                  <div className='star-line' key={bonus + " " + index}>
                    <div className='image-wrapper'>
                      {index === 0 ? (
                        <span style={{ fontWeight: "bold" }}>Base</span>
                      ) : (
                        <img src={`${prefix}etc/Star${index}.png`} alt=''/>
                      )}
                    </div>
                    <div className='stat'>{bonus * (index + 1)}</div>
                  </div>
                );
              })
              : null}
          </div>
        </div>
      }>
      {children}
    </StyledTooltip>
  );
};

const StyledTooltip = styled((props) => (
  <Tooltip
    {...props}
    classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}
  />
))`
  & .tooltip {
    will-change: contents;
    font-size: 16px;
    background-color: #393e46;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%),
    0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
    max-width: 300px;
    @media only screen and (max-width: 600px) {
      max-width: 200px;
    }
  }

  & .touch {
    padding: 8px;
    max-width: 300px;
    @media only screen and (max-width: 600px) {
      max-width: 200px;
    }
  }

  .tooltip-body {
    padding: 10px;
    .tooltip-header {
      padding: 10px 0;
      
      .title {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 10px;
      }
    }

    .stars {
      border-top: 1px solid white;
      padding: 10px 0;
      display: flex;
      justify-content: space-around;

      .star-line {
        display: flex;
        align-items: center;
        flex-direction: column;
      }

      .image-wrapper {
      }

      .stat {
        margin-top: 3px;
      }
    }
  }
`;

export default CustomTooltip;
