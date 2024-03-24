import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider, List, ListItem, ListItemText, Stack } from '@mui/material';
import React, { useState } from 'react';
import { prefix } from '../../../../utility/helpers';
import { useRouter } from 'next/router';
import Kofi from '../../Kofi';

const worldsData = {
  'misc': {
    icon: 'data/CharSlot',
    categories: [
      { label: 'general', icon: 'data/ClassIcons1' },
      { label: 'storage', icon: 'data/InvStorage42' },
      { label: 'quests', icon: 'data/Quest62' },
      { label: 'dungeons', icon: 'data/DungeonA7' },
      { label: 'slab', icon: 'etc/Slab' },
      { label: 'beanstalk', icon: 'etc/beanstalk1' },
      { label: 'apocalypses', icon: 'data/UISkillIcon110' },
      { label: 'constellations', icon: 'data/StarTitle1' },
      { label: 'randomEvents', icon: 'etc/Mega_Grumblo' },
      { label: 'guild', icon: 'etc/Guild' },
    ],
  },
  'premium-currency': {
    style: { filter: 'hue-rotate(180deg)' },
    icon: 'data/PremiumGem',
    categories: [
      { label: 'gemShop', icon: 'data/PremiumGem' },
      { label: 'companions', icon: 'data/PremiumGem', style: { filter: 'hue-rotate(280deg)' } },
    ]
  },
  'task board': {
    icon: 'etc/TasksStar',
    categories: [
      { label: 'achievements', icon: 'data/TaskAchBorder1' },
      { label: 'tasks', icon: 'etc/TasksStar' },
      { label: 'merits', icon: 'etc/Merit_4' },
    ]
  },
  'world 1': {
    icon: 'data/BadgeG2',
    categories: [
      { label: 'anvil', icon: 'data/ClassIcons43' },
      { label: 'forge', icon: 'data/ForgeD' },
      { label: 'bribes', icon: 'data/BribeW' },
      { label: 'stamps', icon: 'data/StampA34' }
    ]
  },
  'world 2': {
    icon: 'data/BadgeD2',
    categories: [
      { label: 'bubbles', icon: 'data/aBrewOptionA0' },
      { label: 'Cauldrons', icon: 'data/aStirringStick0' },
      { label: 'vials', icon: 'data/aVials1' },
      { label: 'arcadeShop', icon: 'data/PachiBall1' },
      { label: 'sigils', icon: 'data/LabBonus12' },
      { label: 'islands', icon: 'data/Island1' },
      { label: 'weeklyBosses', icon: 'etc/SWR_Containment' },
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
      { label: 'worship', icon: 'data/WorshipSkull1' },
      { label: 'prayers', icon: `data/PrayerSel` },
      { label: 'Traps', icon: 'data/ClassIcons47' },
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
      // { label: 'tome', icon: 'etc/tome' },
    ]
  },
  'world 5': {
    icon: 'data/GemP24',
    categories: [
      { label: 'sailing', icon: 'data/ClassIcons54' },
      { label: 'divinity', icon: 'data/ClassIcons55' },
      { label: 'gaming', icon: 'data/ClassIcons56' }
    ]
  },
  'world 6': {
    icon: 'etc/sneaking-temp',
    categories: [
      { label: 'farming', icon: 'data/ClassIcons57' },
      { label: 'sneaking', icon: 'data/ClassIcons58' },
      { label: 'summoning', icon: 'data/ClassIcons59' },
    ]
  }
};

const nestedOptionPadding = 35;

const AccountDrawer = () => {
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
        value: 1,
      })
    }
    router.push({ pathname: url, query: router.query });
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Divider/>
      <List>
        {Object.entries(worldsData).map(([key, value], index) => {
          const { icon, categories, style } = value;
          return (
            <React.Fragment key={key + ' ' + index}>
              <ListItem button selected={isSelected(key)} onClick={() => handleClick(key, categories)}>
                <img className={'list-img'} width={32} height={32} style={{ objectFit: 'contain', ...style }}
                     src={`${prefix}${icon}.png`} alt=""/>
                <ListItemText style={{ marginLeft: 10 }} primary={key.split('-').join(' ').capitalizeAllWords()}/>
                {categories ? accordions?.[key] ? <ExpandLess/> : <ExpandMore/> : null}
              </ListItem>
              {categories ? <Collapse in={accordions?.[key]} timeout="auto" unmountOnExit>
                {categories?.map((category, categoryIndex) => {
                  const label = category?.label.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
                  return (
                    <ListItem selected={isSelected(label)}
                              key={category + ' ' + categoryIndex}
                              style={{ paddingLeft: nestedOptionPadding }}
                              button
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
                    </ListItem>
                  );
                })}
              </Collapse> : null}
            </React.Fragment>
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
    </Stack>
  );
};

export default AccountDrawer;
