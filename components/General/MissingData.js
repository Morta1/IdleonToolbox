import styled from 'styled-components'
import { prefix } from "../../Utilities";

const MissingData = () => {
  return (
    <MissingDataStyle>
      <h1 style={{ textAlign: 'center' }}>Welcome!</h1>
      <h2 style={{ textAlign: 'center' }}>There are 2 ways to use the website</h2>
      <div className={'missing-text'}>
        <div className={'instructions'}>
          <h3>Google Login</h3>
          <div>1. Click the google login icon.</div>
          <div>2. Open the link and paste the provided code.</div>
          <div>3. Select your idelon google account.</div>
          <div>4. Done!</div>
          <div>(Don&apos;t worry, I&apos;m not saving anything about your google account, you can see by yourself in
            my
            <a target={'_blank'}
               href="https://github.com/Morta1/IdleonToolbox" rel="noreferrer">sourcecode</a>)
          </div>
        </div>
        <div className={'instructions'}>
          <h3>Executable</h3>
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
            <span>Morojo#2331</span>
          </div>
        </div>
      </div>
    </MissingDataStyle>
  );
};

const MissingDataStyle = styled.div`
  margin-top: 15px;
  display: grid;
  padding-bottom: 25px;

  .discord {
    margin-left: 10px;
  }

  .contact {
    margin: 10px 0;

    & span {
      display: inline-block;
      font-weight: bold;
      margin: 0 10px;
    }
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
    flex-direction: column;
    margin: 0 auto;
    gap: 15px;
  }

  > img {
    place-self: center;
  }
`;

export default MissingData;
