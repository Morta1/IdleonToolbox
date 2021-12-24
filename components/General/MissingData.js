import styled from 'styled-components'
import { prefix } from "../../Utilities";

const MissingData = () => {
  return (
    <MissingDataStyle>
      <div className={'missing-text'}>
        <div className={'instructions'}>
          <h1>Welcome!</h1>
          <div>1. Download my steam data extractor <a
            href="https://drive.google.com/file/d/1Q03J-kadz5iob45J1wnZWjnHhS0j0GgV/view?usp=sharing"
            rel={'noreferrer'}
            target={'_blank'}>idleon-steam-data-extractor</a>
          </div>
          <div>
            <div style={{ marginBottom: 10 }}> 2. Open the extractor and click Run (you can also change the destination
              if you&apos;d like)
            </div>
            <img src={`${prefix}extractor-image.png`} alt=""/>
          </div>
          <div>
            <div style={{ marginBottom: 10 }}> 3. Copy the result json and click the icon on the top right of the
              website
            </div>
          </div>
          <div className={'contact'}>For any question, suggestion or bug report, please contact me in discord
            Morojo#2331
          </div>
        </div>
      </div>
    </MissingDataStyle>
  );
};

const MissingDataStyle = styled.div`
  margin-top: 15px;
  display: grid;

  .discord {
    margin-left: 10px;
  }

  .contact {
    margin: 10px 0;
  }

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
