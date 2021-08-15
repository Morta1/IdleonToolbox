import React, { useEffect, useState } from 'react';
import { constantBags, prefix } from "../../Utilities";
import styled from 'styled-components';

const Bags = ({ bags }) => {
  const [invBags, setInvBags] = useState();
  useEffect(() => {
    setInvBags(bags.reduce((res, { name }) => ({ ...res, [name]: true }), {}));
  }, []);
  return (
    <BagsStyled>
      {invBags && constantBags?.map((bagName, index) => {
        return <Bag exists={invBags[bagName]} title={bagName.replace(/_/g, " ")}
                    key={bagName + index}
                    src={`${prefix}checklist/${bagName}.png`} alt=""/>;
      })}
    </BagsStyled>
  );
};

const BagsStyled = styled.div`
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(4, minmax(36px, max-content));
  justify-self: center;
`;

const Bag = styled.img`
  filter: ${({ exists }) => exists ? 'grayscale(0)' : 'grayscale(1)'};
  opacity: ${({ exists }) => exists ? '1' : '0.3'};
  justify-self: center;
  width: 48px;
  height: 48px;

  @media (max-width: 370px) {
    width: 36px;
    height: 36px;
  }
`;

export default Bags;
