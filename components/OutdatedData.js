import styled from 'styled-components'
import { useEffect } from "react";

const OutdatedData = ({ extVersion }) => {
  const updates = [
    {
      latest: true,
      version: '1.0.0',
      changes: [
        {
          title: 'General',
          desc: ['Re-arranged some UI elements', 'Moved Stamps, Bubbles and Vials into Account tab']
        },
        {
          title: 'Account',
          desc: [
            'Added a feature to calculate a future goal for Bubbles and Stamps',
            'Added a tooltip to view effect of Bubbles, Stamps and vials',
            'Added a simple bribes tracker'
          ]
        },
        {
          title: 'Etc.',
          desc: ['Changed version to 1.0.0 for easier tracking (for me)']
        }
      ]
    },
    {
      version: '0.0.0.5',
      changes: [
        {
          title: 'Quest Tracker',
          desc: ['Follow your quests account-wide, including quests\' description and required items']
        },
        {
          title: 'Looty Shooty',
          desc: ['Removed more unobtainable items from the list (probably still need some work).']
        }
      ]
    },
    {
      version: '0.0.0.4',
      changes: [
        {
          title: 'Alchemy',
          desc: ['Showing all owned bubbles and their levels', 'Showing all owned vials']
        }, {
          title: 'Bug Fixes',
          desc: ['Obols displayed in wrong order.']
        }
      ]
    },
    {
      version: '0.0.0.3',
      changes: [
        {
          title: 'Shop Stock',
          desc: ['see which items are still in stock (an item will disappear from the list when reaches 0)']
        }, {
          title: 'Characters',
          desc: ['Traps Overview', 'Current Worship Charge']
        }, {
          title: 'Account',
          desc: ['Colosseum Highscores', 'Minigame Highscores', 'Shrines']
        }
      ]
    }
  ]

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
      {updates?.map(({ version, changes }, index) => {
        return <div key={version + index} className={'new-features'}>
          <span className={index === 0 ? 'new-title' : 'title'}>Version {version}</span>
          <ol>
            {changes?.map(({ title, desc }, changesIndex) => {
              return <li key={title + changesIndex}>
                {title}
                <ul>
                  {desc?.map((item, descIndex) => {
                    return <li key={descIndex}>
                      {item}
                    </li>
                  })}
                </ul>
              </li>
            })}
          </ol>
        </div>
      })}
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
