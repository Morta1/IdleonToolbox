import styled from "styled-components";

const Wrapper = styled.div`
  width: 95%;
  margin: 20px auto 0;
  
  @media (max-width: 1440px) {
    width: 98%;
  }
  
  @media (max-width: 750px) {
    width: 100%;
    margin: 0;
  }
`;

export { Wrapper };
