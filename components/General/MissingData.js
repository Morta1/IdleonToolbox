import styled from 'styled-components'
import { prefix } from "../../Utilities";

const MissingData = () => {
  return (
    <MissingDataStyle>
      <div className={'missing-text'}>
        <div className={'instructions'}>
          <h1>Welcome!</h1>
          <div>1. Head over to <a href="https://github.com/Morta1/idleon-data-extractor"
                                  rel={'noreferrer'}
                                  target={'_blank'}>idleon-data-extractor</a> and download the extension.
          </div>
          <div>2. Make sure you&apos;re logged-in in <a href="https://legendsofidleon.com/"
                                                        rel={'noreferrer'}
                                                        target={'_blank'}>Legends Of Idleon</a> (This is a
            one-time process)
          </div>
          <div>3. Click Fetch Data and wait (The process can take roughly 20-45 seconds, depends on the network)
          </div>
        </div>
      </div>
      <img src={`${prefix}etc/Dr_Defecaus_Walking.gif`} alt=""/>
    </MissingDataStyle>
  );
};

const MissingDataStyle = styled.div`
  margin-top: 15px;
  display: grid;

  .instructions {
    > div {
      margin-bottom: 5px;
    }

    a {
      color: white;

      &:visited, &:active {
        color: white;
      }
    }
  }

  .missing-text {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  > img {
    place-self: center;
  }
`;

export default MissingData;
