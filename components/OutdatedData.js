import styled from 'styled-components'
import { useEffect } from "react";

const OutdatedData = ({ extVersion }) => {
  const updates = [
    {
      latest: true,
      version: '1.1.0',
      changes: [
        {
          title: 'Account',
          desc: [
            'Added death note',
            'Added salt lick'
          ]
        },
      ]
    },
    {
      version: '1.0.8',
      changes: [
        {
          title: 'General',
          desc: [
            'Fixed post office boxes bug',
          ]
        },
      ]
    }, {
      version: '1.0.7',
      changes: [
        {
          title: 'General',
          desc: [
            'Fixed stamps bug',
            'Added tooltip for statues'
          ]
        },
      ]
    },
    {
      version: '1.0.6',
      changes: [
        {
          title: 'General',
          desc: [
            'Added \'Active Exp Calculator\' tab',
            'Added post office to \'Account\' tab',
            'Added tooltip for skills, talents and obols',
            'Added \'character completed\' column to constellations',
            'Upgraded the quests tab with more information: quest requirement, item requirements and rewards'
          ]
        },
      ]
    },
    {
      version: '1.0.5',
      changes: [
        {
          title: 'Account',
          desc: [
            'Added refinery tab',
            'Added Gem Shop bundles tab',
            'Fixed some quests\' positions'
          ]
        },
      ]
    },
    {
      version: '1.0.4',
      changes: [
        {
          title: 'General',
          desc: [
            'Added ranking for character\'s skills'
          ]
        },
      ]
    },
    {
      version: '1.0.3',
      changes: [
        {
          title: 'General',
          desc: [
            'Updated with the new patch 1.40b',
            'Added achievement screen with progress',
            'A small redesign for the navigation bar (removed /family)',
            'Card search is now showing your stars',
            'Now displaying an AFK image when your character is doing NOTHING',
            'Basic carry capacity bags tooltip'
          ]
        },
      ]
    },
    {
      version: '1.0.2',
      changes: [
        {
          title: 'General',
          desc: [
            'Updated shrines with more data',
            'Moved looty to a different tab in Account',
            'Added traps timers (just displaying time left)'
          ]
        },
      ]
    }, {
      version: '1.0.1',
      changes: [
        {
          title: 'General',
          desc: [
            'Added all new items\' data',
            'New item\'s images might be missing, please let me know if you find these items :)',
            'Added an option to load your json from the extension (requires few extra steps)'
          ]
        },
        {
          title: 'Account',
          desc: [
            'Added a constellation and star signs tracker',
          ]
        },
      ]
    },
    {
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
    localStorage.removeItem('characterData');
    localStorage.removeItem('characterIndices');
    localStorage.removeItem('dataFilters');
    localStorage.removeItem('lastUpdated');
    localStorage.removeItem('display');
  }, []);

  return (
    <OutdatedDataStyle>
      <div className={'info'}>
        <span>Please update your steam data extractor to the <a className={'extractor'}
                                                                href="https://drive.google.com/file/d/1Q03J-kadz5iob45J1wnZWjnHhS0j0GgV/view?usp=sharing">latest version</a> ({extVersion}) and refresh</span>
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
        content: "\u2713  ";
        display: inline-block;
        margin-right: 5px;
        color: #33d033;
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
