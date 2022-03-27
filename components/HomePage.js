import styled from 'styled-components'
import { Button, Dialog, DialogContent, Typography } from "@material-ui/core";
import { getRandomNumber, prefix } from "../Utilities";
import React, { useContext, useState } from "react";
import MissingData from "./General/MissingData";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import InfoIcon from '@material-ui/icons/Info';
import { useRouter } from "next/router";
import { AppContext } from './Common/context';

const icons = ['I', 'G', 'D'];
const HomePage = () => {
  const updates = [
    {
      version: '2.0.4',
      changes: [
        {
          title: 'Characters',
          desc: [
            'Added requirement for next portal',
            'Some adjustments for cooking'
          ]
        }
      ]
    },
    {
      version: '2.0.3',
      changes: [
        {
          title: 'Account',
          desc: [
            'Added simple info for pet upgrades to the Breeding page'
          ]
        }
      ]
    },
    {
      version: '2.0.2',
      changes: [
        {
          title: 'General',
          desc: [
            'Added spices produced by territory to Cooking page',
            'Fixed worship overcharge display',
            'Fixed missing Printer Products'
          ]
        }
      ]
    },
    {
      version: '2.0.1',
      changes: [
        {
          title: 'Account',
          desc: [
            'Added a prayer page'
          ]
        }
      ]
    },
    {
      version: '2.0.0',
      changes: [
        {
          title: 'World 4',
          desc: [
            'Uploaded all W4 new data and images',
            'Added a World 4 in Account tab, at the moment cooking only (kitchens and cooking menu).',
            'Added W4 afk targets (let me know if I missed anything please)',
            'Fixed a bug caused by W4 new skills',
          ]
        }
      ]
    },
    {
      version: '1.1.9',
      changes: [
        {
          title: 'General',
          desc: [
            'Updated navigation arrangement (hopefully for the better)',
            'Added \'Tools\' menu',
            'Rearranged the \'Account\' page categories\' into worlds',
            'Added this home page screen (!)'
          ]
        }
      ]
    },
    {
      version: '1.1.8',
      changes: [
        {
          title: 'General',
          desc: [
            'Added \'Totals\' to Account -> General to keep track of some aggregated milestones']
        },
        {
          title: 'Characters',
          desc: [
            'Added Active Skill CD filter to character screen',
            'Added anvil progress calculation'
          ]
        },
      ]
    },
    {
      version: '1.1.7',
      changes: [
        {
          title: 'Account/Character',
          desc: [
            'Added flags page',
            'Added separate anvil filters - 1 for details and 1 for products'
          ]
        },
      ]
    },
    {
      version: '1.1.6',
      changes: [
        {
          title: 'Characters',
          desc: [
            'Added active skills cooldown filter in characters',
          ]
        },
      ]
    },
    {
      version: '1.1.5',
      changes: [
        {
          title: 'Characters',
          desc: [
            'Anvil is most accurate when using the \'connect\' button because the steam-extractor is missing guild data and bonuses',
            'Added material and coins cost calculations',
            'Added anvil speed and capacity'
          ]
        },
      ]
    },
    {
      version: '1.1.4',
      changes: [
        {
          title: 'Item Planner',
          desc: [
            'Added back the option to remove 1 item from item planner',
            'Added a checkbox to include equipped items in the item planner calculations',
            'Added a tooltip on the required items to see who has it (like the item browser)'
          ]
        },
      ]
    },
    {
      version: '1.1.3',
      changes: [
        {
          title: 'General',
          desc: [
            'Added running timers to count down/up for afk time, traps and salts (This is experimental and might be not accurate)',
            'Added cooldown timer for squires\' refinery throttle',
            'Added tooltips for equipped cards and card set',
            'Added an option of item count in the Item Planner'
          ]
        },
      ]
    }, {
      version: '1.1.2',
      changes: [
        {
          title: 'General',
          desc: [
            'Added afk time',
            'Afk time is marked red when Unending energy is equipped and 10h passed',
            'Traps are now marked red when they are ready to be picked up',
            'Added worship tag to card search',
            "Refinery's squire cycles are now calculated based on the skills' max level"
          ]
        },
      ]
    },
    {
      version: '1.1.1',
      changes: [
        {
          title: 'Characters',
          desc: [
            'Added worship max charge and rate',
            'Added crystal spawn chance'
          ]
        },
      ]
    },
    {
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
  const { userData } = useContext(AppContext);
  const [icon] = useState(icons[getRandomNumber(0, 2)]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isDemo = () => {
    return router?.query?.hasOwnProperty('demo');
  }

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(localStorage.getItem('rawJson'));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <HomePageStyle>
      {/*<div className={'sprite'}/>*/}
      <Typography variant={'h1'}><img src={`${prefix}data/Badge${icon}2.png`} alt=""/>Idleon
        Toolbox</Typography>
      <div className={'desc'}>Idleon toolbox helps you track all of your account and characters&apos; progress with
        ease!
      </div>
      <Typography style={{ fontFamily: 'JetBrains Mono' }} variant={'subtitle2'}>For any question, suggestion or bug
        report, please contact me in
        discord Morojo#2331</Typography>
      <div className={'extra'} style={{ display: 'flex', alignItems: 'center', gap: 35 }}>
        {!isDemo() ? <div className={'button'}>
          <StyledButton startIcon={<InfoIcon/>} onClick={() => setOpen(true)} variant={'contained'} color={'primary'}>
            Learn How to Connect
          </StyledButton>
        </div> : null}
        <div>
          <a style={{ height: 0, display: 'flex', alignItems: 'center' }} href='https://ko-fi.com/S6S7BHLQ4'
             target='_blank'
             rel="noreferrer">
            <img height='36'
                 style={{ border: 0, height: 36 }}
                 src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
                 alt='Buy Me a Coffee at ko-fi.com'/>
          </a>
        </div>
      </div>
      {userData ? <div style={{ marginTop: 25 }}>
        <StyledButton startIcon={<FileCopyIcon/>} onClick={handleCopyRaw} variant={'contained'} color={'primary'}>
          Copy Raw JSON
        </StyledButton>
      </div> : null}
      <div className={'patch-notes'}>
        <Typography style={{ margin: '20px 0' }} variant={'h4'}>Patch Notes</Typography>
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
      </div>

      <Dialog onClose={() => setOpen(false)} open={open}>
        <DialogContent>
          <MissingData/>
        </DialogContent>
      </Dialog>
    </HomePageStyle>
  );
};

const StyledButton = styled(Button)`
  && {
    text-transform: capitalize;
  }
`

const HomePageStyle = styled.div`

  .sprite {
    width: 50px;
    height: 50px;
    background: url(${prefix}carrot.png) 0 0;
  }

  margin: 25px auto;
  padding: 10px;
  display: flex;
  max-width: 800px;
  flex-direction: column;

  .extra {
    display: flex;
    align-items: center;
    margin-top: 20px;
    gap: 35px;
  }

  .extractor {
    &:visited, &:active {
      color: white;
    }
  }

  .desc {
    font-size: 20px;
  }

  .patch-notes {
    margin-top: 30px;

    .new-features {
      font-size: 16px;

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
  }
`;

export default HomePage;
