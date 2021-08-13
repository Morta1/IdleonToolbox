import styled from "styled-components";
import { Tooltip } from "@material-ui/core";
import { prefix } from "../Utilities";
import InfoTooltip from "./InfoTooltip";

const CustomTooltip = ({ header, base, children }) => {
  return (
    <StyledTooltip
      interactive
      enterTouchDelay={100}
      placement={"top-start"}
      title={"TEST"}
      // title={
      //   <div className="tooltip-body">
      //     <div className="tooltip-header">{header}</div>
      //     <div className="stars">
      //       {base
      //         ? [1, 2, 3, 4]?.map((_, index) => {
      //           return (
      //             <div className="star-line" key={base + " " + index}>
      //               <div className="image-wrapper">
      //                 {index === 0 ? (
      //                   <span style={{ fontWeight: "bold" }}>Base</span>
      //                 ) : (
      //                   <img src={`${prefix}etc/Star${index}.png`} alt=""/>
      //                 )}
      //               </div>
      //               <div className="stat">{base * (index + 1)}</div>
      //             </div>
      //           );
      //         })
      //         : null}
      //     </div>
      //   </div>
      // }
    >
      {children}
    </StyledTooltip>
  );
};

const StyledTooltip = styled(((props) =>
    <Tooltip {...props} classes={{ popper: props.className, tooltip: "tooltip"}}  />
))`
  & .tooltip {
    color: black;
    font-size: 16px;
    background-color: #f5f5f9;
    border: 1px solid #dadde9;
    box-shadow: rgba(0, 0, 0, 0.24) 0 3px 8px;
    max-width: 300px;
    @media only screen and (max-width: 600px) {
      max-width: 200px;
    }
  }
`;
//
// const StyledTooltip = styled((props) =>
//   <Tooltip {...props} classes={{ popper: props.className, tooltip: "tooltip", touch: "touch" }}  />
// )`
//   & .tooltip {
//     font-size: 16px;
//     background-color: rebeccapurple;
//     box-shadow: rgba(0, 0, 0, 0.24) 0 3px 8px;
//     max-width: 300px;
//     @media only screen and (max-width: 600px) {
//       max-width: 200px;
//     }
//   }
//
//   & .touch {
//     padding: 8px;
//     max-width: 300px;
//     @media only screen and (max-width: 600px) {
//       max-width: 200px;
//     }
//   }
//
//   .tooltip-body {
//     .tooltip-header {
//       text-align: center;
//       font-weight: bold;
//       padding: 10px 0;
//     }
//
//     .stars {
//       border-top: 1px solid #51325a;
//       padding: 10px 0;
//       display: flex;
//       justify-content: space-around;
//
//       .star-line {
//         display: flex;
//         align-items: center;
//         flex-direction: column;
//       }
//
//       .image-wrapper {
//       }
//
//       .stat {
//         margin-top: 3px;
//       }
//     }
//   }
// `;

export default CustomTooltip;
