import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import { prefix } from "../Utilities";

const CustomTooltip = ({ header, base, children }) => {
  return (
    <StyledTooltip
      enterTouchDelay={0}
      placement={"top"}
      title={
        <div className="tooltip-body">
          <div className="tooltip-header">{header}</div>
          <div className="stars">
            {base
              ? [1, 2, 3, 4]?.map((_, index) => {
                  return (
                    <div className="star-line" key={base + " " + index}>
                      <div className="image-wrapper">
                        {index === 0 ? (
                          <span style={{ fontWeight: "bold" }}>Base</span>
                        ) : (
                          <img src={`${prefix}/Star${index}.png`} alt="" />
                        )}
                      </div>
                      <div className="stat">{base * (index + 1)}</div>
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      }
    >
      {children}
    </StyledTooltip>
  );
};

const StyledTooltip = styled((props) => (
  <Tooltip
    classes={{ popper: props.className, tooltip: "tooltip" }}
    {...props}
  />
))`
  & .tooltip {
    font-size: 16px;
    background-color: rebeccapurple;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  }

  .tooltip-body {
    .tooltip-header {
      text-align: center;
      font-weight: bold;
      padding: 10px 0;
    }

    .stars {
      border-top: 1px solid #51325a;
      padding: 10px 0;
      display: flex;
      justify-content: space-around;

      .star-line {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin: 0 10px;
      }
      .image-wrapper {
        /* min-width: 40px; */
      }
      .stat {
        /* margin-left: 15px; */
      }
    }
  }
`;

const Wrapper = styled.div``;

export default CustomTooltip;
