import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Collapse, Divider, List, ListItem, ListItemText, Stack } from "@mui/material";
import React, { useState } from "react";
import { useRouter } from "next/router";

const misc = {
  general: {
    icon: 'ClassIcons1'
  },
  achievements: {
    icon: 'TaskAchBorder1'
  },
  storage: {
    icon: 'InvStorage42'
  },
  quests: {
    icon: 'Quest62'
  },
  dungeons: {
    icon: 'DungeonA7'
  },
  looty: {
    icon: 'UISkillIcon305'
  },
  apocalypses: {
    icon: 'UISkillIcon110'
  },
  constellations: {
    icon: "StarTitle1"
  }
};

const worldsData = {
  ...misc,
  "world 1": {
    icon: "BadgeG2",
    categories: [
      { label: "anvil", icon: "ClassIcons43" },
      { label: "forge", icon: "ForgeD" },
      { label: "bribes", icon: "BribeW" },
      { label: "stamps", icon: "StampA34" }
    ]
  },
  "world 2": {
    icon: "BadgeD2",
    categories: [
      { label: "bubbles", icon: "aBrewOptionA0" },
      { label: "Cauldrons", icon: "aStirringStick0" },
      { label: "vials", icon: "aVials1" },
      { label: "arcadeShop", icon: "PachiBall1" },
      { label: "sigils", icon: "LabBonus12" }
    ]
  },
  "world 3": {
    icon: "BadgeI2",
    categories: [
      { label: "Printer", icon: "ConTower0" },
      { label: "refinery", icon: "TaskSc6" },
      { label: "atomCollider", icon: "ConTower8" },
      { label: "towers", icon: "ConTower7" },
      { label: "deathNote", icon: "ConTower2" },
      { label: "worship", icon: "WorshipSkull1" },
      { label: "prayers", icon: `PrayerSel` },
      { label: "Traps", icon: "ClassIcons47" },
      { label: "saltLick", icon: "ConTower3" },
      { label: "construction", icon: "ClassIcons49" }
    ]
  },
  "world 4": {
    icon: "Ladle",
    categories: [
      { label: "cooking", icon: "ClassIcons51" },
      { label: "breeding", icon: "ClassIcons52" },
      { label: "laboratory", icon: "ClassIcons53" }
    ]
  },
  "world 5": {
    icon: "GemP24",
    categories: [
      { label: "sailing", icon: "ClassIcons54" },
      { label: "divinity", icon: "ClassIcons55" },
      { label: "gaming", icon: "ClassIcons56" }
    ]
  }
};

const nestedOptionPadding = 35;

const AccountDrawer = ({ onLabelClick }) => {
  const [worlds, setWorlds] = useState({ "World 1": false, "World 2": false, "World 3": false, "World 4": false });
  const router = useRouter();

  const handleClick = (key) => {
    if (key.includes('world')) {
      return setWorlds({ ...worlds, [key]: !worlds?.[key] });
    } else {
      handleLabelClick('', key);
    }
  }

  const handleLabelClick = (world, label) => {
    const url = world ? `/account/${world.split(' ').join('-')}/${label}` : `/account/${label}`;
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'handle_nav', {
        event_category: url,
        event_label: 'engagement',
        value: 1,
      })
    }
    router.push({ pathname: url, query: router.query });
    typeof onLabelClick === 'function' && onLabelClick();
  }

  const isSelected = (label) => {
    return router.pathname.includes(label);
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Divider/>
      <List>
        {Object.entries(worldsData).map(([key, value], index) => {
          const { icon, categories } = value;
          return (
            <React.Fragment key={key + " " + index}>
              <ListItem button selected={isSelected(key)} onClick={() => handleClick(key)}>
                <img className={"list-img"} width={32} src={`/data/${icon}.png`} alt=""/>
                <ListItemText style={{ marginLeft: 10 }} primary={key.capitalize()}/>
                {categories ? worlds?.[key] ? <ExpandLess/> : <ExpandMore/> : null}
              </ListItem>
              {categories ? <Collapse in={worlds?.[key]} timeout="auto" unmountOnExit>
                {categories?.map((category, categoryIndex) => {
                  const label = category?.label.split(/(?=[A-Z])/).map((str) => str.toLowerCase()).join('-');
                  return (
                    <ListItem selected={isSelected(label)}
                              key={category + " " + categoryIndex}
                              style={{ paddingLeft: nestedOptionPadding }}
                              button
                              onClick={() => handleLabelClick(key, label)}>
                      <img className={"list-img"} width={32} src={`/data/${category.icon}.png`} alt=""/>
                      <ListItemText
                        style={{ marginLeft: 10 }}
                        primary={category?.label
                          .split(/(?=[A-Z])/)
                          .join(" ")
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
            <a style={{ height: 0, display: 'inline-block' }} href='https://ko-fi.com/S6S7BHLQ4' target='_blank'
               rel="noreferrer">
              <img height='36'
                   style={{ border: 0, height: 36 }}
                   src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
                   alt='Buy Me a Coffee at ko-fi.com'/>
            </a>
          </ListItemText>
        </ListItem>
      </List>
      <Divider/>
    </Stack>
  );
};

export default AccountDrawer;
