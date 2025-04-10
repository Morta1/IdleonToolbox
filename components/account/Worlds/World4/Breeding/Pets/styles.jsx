import styled from '@emotion/styled';

export const GeneIcon = styled.img`
  width: 24px;
  height: 24px;
`;
export const MonsterIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: ${({ missingIcon }) => missingIcon ? 'contain' : 'none'};
  ${({ missingIcon }) => missingIcon && `object-position: 0 100%;`}
`;