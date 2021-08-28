import styled from 'styled-components';
import { Accordion, AccordionDetails, AccordionSummary } from "@material-ui/core";
import Obols from "./Character/Obols";
import Looty from "./General/Looty";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Stamps from "./General/Stamps";
import { useRef } from "react";
import Statues from "./General/Statues";
import GeneralInfo from "./General/GeneralInfo";

const AccountWrapper = ({ account }) => {
  const accordionRef = useRef();

  const scrollToAccordion = () => {
    if (accordionRef.current) {
      setTimeout(() => {
        accordionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        })
      }, 300);
    }
  }

  return <AccountWrapperStyle>
    <div className="row">
      <Obols obols={account?.obols} type={'account'}/>
      <GeneralInfo silverPens={account?.silverPens}
                   money={account?.money}
                   keys={account?.keys}
                   colosseumTickets={account?.colosseumTickets} teleports={account?.worldTeleports}
                   obolFragments={account?.obolFragments}/>
      <Statues statues={account?.statues}/>
      <Stamps stamps={account?.stamps?.combat}/>
      <Stamps stamps={account?.stamps?.skills}/>
      <Stamps stamps={account?.stamps?.misc}/>
    </div>

    <StyledAccordion ref={accordionRef} onChange={(e, expanded) => {expanded && scrollToAccordion()}}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
        Looty Shooty Missing Items ({account?.missingLootyItems.length})
      </AccordionSummary>
      <AccordionDetails>
        <Looty items={account?.missingLootyItems}/>
      </AccordionDetails>
    </StyledAccordion>
  </AccountWrapperStyle>;
}

const StyledAccordion = styled(Accordion)`
  && {
    background-color: #352633;
  }
`;

const AccountWrapperStyle = styled.div`
  margin-top: 25px;

  .row {
    margin: 15px 0;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(1, 450px) repeat(auto-fit, minmax(200px, 300px));
    @media (max-width: 750px) {
      grid-template-columns: 1fr;
    }
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
`;

export default AccountWrapper;