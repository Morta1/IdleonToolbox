import styled from 'styled-components';
import { Accordion, AccordionDetails, AccordionSummary } from "@material-ui/core";
import Obols from "./Character/Obols";
import Looty from "./General/Looty";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useRef } from "react";
import Statues from "./General/Statues";
import GeneralInfo from "./General/GeneralInfo";
import Shrines from "./General/Shrines";
import ColosseumHighscores from "./General/ColosseumHighscores";
import MinigameHighscores from "./General/MinigameHighscores";

const General = ({ account }) => {
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
                   gems={account?.gems}
                   colosseumTickets={account?.colosseumTickets} teleports={account?.worldTeleports}
                   obolFragments={account?.obolFragments}/>
      <ColosseumHighscores scores={account?.colosseumHighscores}/>
      <MinigameHighscores scores={account?.minigameHighscores}/>
      <Shrines shrines={account?.shrines}/>
      <Statues statues={account?.statues}/>
    </div>

    <div className="looty-row">
      <StyledAccordion
        className={'looty'}
        ref={accordionRef}
        onChange={(e, expanded) => {expanded && scrollToAccordion()}}>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
          Looty Shooty Missing Items ({account?.missingLootyItems.length})
        </AccordionSummary>
        <AccordionDetails>
          <Looty items={account?.missingLootyItems}/>
        </AccordionDetails>
      </StyledAccordion>
    </div>
  </AccountWrapperStyle>;
}

const StyledAccordion = styled(Accordion)`
  && {
    background-color: #352633;
  }
`;

const AccountWrapperStyle = styled.div`
  .looty-row {
    width: 90%;
    margin: 0 auto;
  }

  .row {
    display: grid;
    justify-content: center;
    margin: 0 0 25px 0;
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

export default General;