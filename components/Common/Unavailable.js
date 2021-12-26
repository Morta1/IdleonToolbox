import styled from 'styled-components'

const Unavailable = () => {
  return (
    <UnavailableStyle>
      <div>Content isn&apos;t available yet !</div>
    </UnavailableStyle>
  );
};

const UnavailableStyle = styled.div`
  display: flex;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
`;

export default Unavailable;
