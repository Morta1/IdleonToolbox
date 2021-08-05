import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import { prefix } from "../Utilities";

const CustomTooltip = ({ header, stats, children }) => {
  return (
    <StyledTooltip
      placement={"top"}
      title={
        <div className="tooltip-body">
          <div className="tooltip-header">{header}</div>
          <div className="stars">
            {(stats || [1, 2, 3, 4]).map((stat, index) => {
              return (
                <div className="star-line" key={stat + " " + index}>
                  <div className="image-wrapper">
                    {index === 0 ? (
                      "Base"
                    ) : (
                      <img src={`${prefix}/Star${index}.png`} alt="" />
                    )}
                  </div>
                  <div className="stat">{stat}</div>
                </div>
              );
            })}
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
    min-height: 50px;
  }

  .tooltip-body {
    .tooltip-header {
      font-weight: bold;
    }

    .stars {
      .star-line {
        display: flex;
        align-items: center;
      }
      .image-wrapper {
        min-width: 40px;
      }
      .stat {
        margin-left: 15px;
      }
    }
  }
`;

const Wrapper = styled.div``;

export default CustomTooltip;
