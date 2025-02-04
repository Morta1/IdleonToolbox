import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider, List, ListItem, ListItemText, Stack } from '@mui/material';
import React, { useContext, useState } from 'react';
import { prefix } from '@utility/helpers';
import { useRouter } from 'next/router';
import Kofi from '../../Kofi';
import { AppContext } from '@components/common/context/AppProvider';
import { format } from 'date-fns';

import ListItemButton from '@mui/material/ListItemButton';

const worldsData = {
  'misc': {
    icon: 'data/CharSlot',
    categories: [
      { label: 'general', icon: 'data/ClassIcons1' },
      { label: 'storage', icon: 'data/InvStorage42' },
      { label: 'quests', icon: 'data/Quest62' },
      { label: 'dungeons', icon: 'data/DungeonA7' },
      { label: 'apocalypses', icon: 'data/UISkillIcon110' },
      { label: 'grimoire', icon: 'data/GrimoireUpg18' },
      { label: 'constellations', icon: 'data/StarTitle1' },
      { label: 'upgradeVault', icon: 'data/VaultBut' },
      { label: 'randomEvents', icon: 'etc/Mega_Grumblo' },
      { label: 'guild', icon: 'etc/Guild' }
    ]
  },
  'premium-currency': {
    style: { filter: 'hue-rotate(180deg)' },
    icon: 'data/PremiumGem',
    categories: [
      { label: 'gemShop', icon: 'data/PremiumGem' },
      { label: 'companions', icon: 'data/PremiumGem', style: { filter: 'hue-rotate(280deg)' } }
    ]
  },
  'task board': {
    icon: 'etc/TasksStar',
    categories: [
      { label: 'achievements', icon: 'data/TaskAchBorder1' },
      { label: 'tasks', icon: 'etc/TasksStar' },
      { label: 'merits', icon: 'etc/Merit_4' }
    ]
  },
  'world 1': {
    icon: 'data/BadgeG2',
    categories: [
      { label: 'anvil', icon: 'data/ClassIcons43' },
      { label: 'forge', icon: 'data/ForgeD' },
      { label: 'bribes', icon: 'data/BribeW' },
      { label: 'stamps', icon: 'data/StampA34' },
      { label: 'owl', icon: 'etc/Owl' }
    ]
  },
  'world 2': {
    icon: 'data/BadgeD2',
    categories: [
      { label: 'bubbles', icon: 'data/aBrewOptionA0' },
      { label: 'Cauldrons', icon: 'data/aStirringStick0' },
      { label: 'vials', icon: 'data/aVials1' },
      { label: 'sigils', icon: 'data/LabBonus12' },
      { label: 'arcadeShop', icon: 'data/PachiBall1' },
      { label: 'islands', icon: 'data/Island1' },
      { label: 'killroy', icon: 'etc/Killroy_Skull' },
      { label: 'weeklyBosses', icon: 'etc/SWR_Containment' },
      { label: 'kangaroo', icon: 'data/RooA' },
      { label: 'voteBallot', icon: 'etc/VoteBallot' }
    ]
  },
  'world 3': {
    icon: 'data/BadgeI2',
    categories: [
      { label: 'Printer', icon: 'data/ConTower0' },
      { label: 'refinery', icon: 'data/TaskSc6' },
      { label: 'atomCollider', icon: 'data/ConTower8' },
      { label: 'Equinox', icon: 'data/Quest78' },
      { label: 'buildings', icon: 'data/ConTower7' },
      { label: 'deathNote', icon: 'data/ConTower2' },
      { label: 'worship', icon: 'data/ClassIcons50' },
      { label: 'prayers', icon: `data/PrayerSel` },
      { label: 'Traps', icon: 'data/TrapBoxSet1' },
      { label: 'saltLick', icon: 'data/ConTower3' },
      { label: 'construction', icon: 'data/ClassIcons49' }
    ]
  },
  'world 4': {
    icon: 'data/Ladle',
    categories: [
      { label: 'cooking', icon: 'data/ClassIcons51' },
      { label: 'breeding', icon: 'data/ClassIcons52' },
      { label: 'laboratory', icon: 'data/ClassIcons53' },
      { label: 'rift', icon: 'data/Mface75' },
      { label: 'tome', icon: 'etc/Tome_0' }
    ]
  },
  'world 5': {
    icon: 'data/GemP24',
    categories: [
      { label: 'sailing', icon: 'data/ClassIcons54' },
      { label: 'divinity', icon: 'data/ClassIcons55' },
      { label: 'gaming', icon: 'data/ClassIcons56' },
      { label: 'hole', icon: 'data/Quest90' },
      { label: 'slab', icon: 'etc/Slab' }
    ]
  },
  'world 6': {
    icon: 'etc/sneaking-temp',
    categories: [
      { label: 'farming', icon: 'data/ClassIcons57' },
      { label: 'sneaking', icon: 'data/ClassIcons58' },
      { label: 'summoning', icon: 'data/ClassIcons59' },
      { label: 'beanstalk', icon: 'etc/beanstalk1' }
    ]
  }
};

const nestedOptionPadding = 35;

const AccountDrawer = () => {
  const { state } = useContext(AppContext);
  const [accordions, setAccordions] = useState({});
  const router = useRouter();

  const handleClick = (label, categories) => {
    if (categories) {
      return setAccordions({ ...accordions, [label]: !accordions?.[label] });
    } else {
      handleLabelClick('', label);
    }
  }

  const handleLabelClick = (section, label) => {
    const url = section ? `/account/${section.split(' ').join('-')}/${label}` : `/account/${label}`;
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1
      })
    }
    const { t, nt, ...updatedQuery } = router.query;
    router.push({ pathname: url, query: updatedQuery });
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    (<Stack sx={{ height: '100%' }}>
      <Divider/>
      <List>
        {state?.account?.accountCreateTime ? <ListItem>Account created
          at: {format(state?.account?.accountCreateTime, 'dd/MM/yyyy HH:mm:ss')}</ListItem> : null}
        {Object.entries(worldsData).map(([key, value], index) => {
          const { icon, categories, style } = value;
          return (
            (<React.Fragment key={key + ' ' + index}>
              <ListItemButton
                data-cy={key}
                selected={isSelected(key?.split(' ')?.join('-'))}
                onClick={() => handleClick(key, categories)}>
                <img className={'list-img'} width={32} height={32} style={{ objectFit: 'contain', ...style }}
                     src={`${prefix}${icon}.png`} alt=""/>
                <ListItemText style={{ marginLeft: 10 }} primary={key.split('-').join(' ').capitalizeAllWords()}/>
                {categories ? accordions?.[key] ? <ExpandLess/> : <ExpandMore/> : null}
              </ListItemButton>
              {categories ? <Collapse in={accordions?.[key]} timeout="auto" unmountOnExit>
                {categories?.map((category, categoryIndex) => {
                  const label = category?.label.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
                  return (
                    (<ListItemButton
                      selected={isSelected(label)}
                      data-cy={label}
                      key={category + ' ' + categoryIndex}
                      style={{ paddingLeft: nestedOptionPadding }}
                      onClick={() => handleLabelClick(key, label)}>
                      <img className={'list-img'} width={32} height={32}
                           style={{ objectFit: 'contain', ...category?.style }}
                           src={`${prefix}${category.icon}.png`}
                           alt=""/>
                      <ListItemText
                        style={{ marginLeft: 10 }}
                        primary={category?.label
                          .split(/(?=[A-Z])/)
                          .join(' ')
                          .capitalize()}
                      />
                    </ListItemButton>)
                  );
                })}
              </Collapse> : null}
            </React.Fragment>)
          );
        })}
      </List>
      <List style={{ marginTop: 'auto' }}>
        <ListItem>
          <ListItemText>
            <Kofi display={'inline-block'}/>
          </ListItemText>
        </ListItem>
      </List>
      <Divider/>
    </Stack>)
  );
};

export default AccountDrawer;
