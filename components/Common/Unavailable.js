import styled from 'styled-components'

const Unavailable = () => {
  return (
    <UnavailableStyle>
      <div className={'main'}>Content isn&apos;t available yet !</div>
      <div className={'mini'}>If this content is available for you in-game, try to parse your data again</div>
    </UnavailableStyle>
  );
};

const UnavailableStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;

  .main {
    font-size: 24px;
    font-weight: bold;
  }

  .mini {
    font-size: 14px;
  }
`;

export default Unavailable;
