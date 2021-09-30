import styled from 'styled-components'
import { useEffect } from "react";

const OutdatedData = ({ extVersion }) => {
  useEffect(() => {
    localStorage.clear();
  }, []);

  return (
    <OutdatedDataStyle>
      <div className={'info'}>
        <span>Please update your extension to the <a className={'extractor'}
                                                     href="https://github.com/Morta1/idleon-data-extractor">latest version</a> ({extVersion}) and refresh</span>
        <span className={'small-text'}>If your extension is up-to-date please contact Morojo#2331 in discord</span>
      </div>
      <div className={'new-features'}>
        <span className={'new-title'}>Version {extVersion}</span>
        <ol>
          <li>
            Alchemy
            <ul>
              <li>
                Showing all owned bubbles and their levels
              </li>
              <li>
                Showing all owned vials
              </li>
            </ul>
          </li>
          <li>
            Bug Fixes
            <ul>
              <li>
                Obols displayed in wrong order.
              </li>
            </ul>
          </li>
        </ol>
      </div>
      <div className={'new-features'}>
        <span className={'title'}>Version 0.0.0.3</span>
        <ol>
          <li>
            Shop Stock
            <ul>
              <li>
                see which items are still in stock (an item will disappear from the list when reaches 0)
              </li>
            </ul>
          </li>
          <li>
            Characters
            <ul>
              <li>Traps Overview</li>
              <li>Current Worship Charge</li>
            </ul>
          </li>
          <li>
            Account
            <ul>
              <li>Colosseum Highscores</li>
              <li>Minigame Highscores</li>
              <li>Shrines</li>
            </ul>
          </li>
        </ol>
      </div>
    </OutdatedDataStyle>
  );
};

const OutdatedDataStyle = styled.div`
  margin: 25px auto;
  padding: 10px;
  display: flex;
  width: 800px;
  flex-direction: column;

  .extractor {
    &:visited, &:active {
      color: white;
    }
  }

  .info {
    > span {
      display: block;
      margin-bottom: 5px;
    }

    .small-text {
      font-size: 14px;
    }
  }

  .new-features {
    margin-top: 4rem;

    > .title, .new-title {
      font-size: 18px;
      font-weight: bold;
      padding-bottom: 2px;
      border-bottom: 1px solid white;
    }

    > .new-title {
      &:before {
        content: "✅";
        display: inline-block;
        margin-right: 5px;
      }
    }

    ol {
      > li {
        margin-top: 10px;
      }
    }

    ul {
      list-style-type: "-> ";

      > li {
        margin-top: 5px;
      }
    }
  }
`;

export default OutdatedData;
