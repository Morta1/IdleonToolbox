import { useState } from 'react';
import { Card, CardContent, FormControl, Grid, InputLabel, Select, Stack, Typography } from "@mui/material";
import { cleanUnderscore, growth, prefix } from "utility/helpers";
import Tooltip from "components/Tooltip";
import { talents } from "data/website-data";
import MenuItem from "@mui/material/MenuItem";
import { talentPagesMap } from "parsers/talents";

const mg = {
  "title": "Shaman / AFK (~150)",
  "notes": "After reaching 100 WIS your brewspeed is reduced until you hit 1300+ WIS. n Active Skills act as a multiplyer to your total dmg for afk. n lvl 25 on all of them should be enough to reach dmg cap. Put more points into attack talents if you are using Prayers that increase mob hp. ",
  "version": "1.40b",
  "level": 150,
  "tabs": [
    {
      "name": "Savvy Basics",
      "talents": [
        { "name": "Health Booster", "skillIndex": 0, "level": "*1", "note": "" },
        { "name": "Mana Booster", "skillIndex": 1, "level": "100+", "note": "" },
        { "name": "Star Player", "skillIndex": 8, "level": 0, "note": "" },
        { "name": "Bucklered Up", "skillIndex": 9, "level": "*1", "note": "" },
        { "name": "Sharpened Axe", "skillIndex": 5, "level": "160", "note": "" },
        { "name": "Fist Of Rage", "skillIndex": 10, "level": 0, "note": "" },
        { "name": "Quickness Boots", "skillIndex": 11, "level": "100", "note": "" },
        { "name": "Book Of The Wise", "skillIndex": 12, "level": "260", "note": "" },
        { "name": "Lucky Clover", "skillIndex": 13, "level": "100", "note": "" },
        { "name": "Gilded Sword", "skillIndex": 6, "level": "160", "note": "" },
        { "name": "Smart Efficiency", "skillIndex": 445, "level": "100", "note": "" },
        { "name": "Overclocked Energy", "skillIndex": 446, "level": "100", "note": "" },
        { "name": "Farsight", "skillIndex": 447, "level": "2*", "note": "" },
        { "name": "Idle Casting", "skillIndex": 448, "level": "160", "note": "" },
        { "name": "Active Afk'er", "skillIndex": 449, "level": "100", "note": "" }
      ],
      "note": "*1 Put points into talents for Survivablility. Quickness Boots for accuracy."
    },
    {
      "name": "Mage",
      "talents": [
        { "name": "Energy Bolt", "skillIndex": 450, "level": "25", "note": "" },
        { "name": "Mini Fireball", "skillIndex": 451, "level": "25", "note": "" },
        { "name": "Mana Overdrive", "skillIndex": 452, "level": "160", "note": "" },
        { "name": "Teleport", "skillIndex": 453, "level": "*", "note": "" },
        { "name": "You're Next", "skillIndex": 454, "level": "50", "note": "" },
        { "name": "Knowledge Is Power", "skillIndex": 455, "level": "160", "note": "" },
        { "name": "Unt'wis'ted Robes", "skillIndex": 456, "level": "160", "note": "" },
        { "name": "Power Overwhelming", "skillIndex": 457, "level": "160", "note": "" },
        { "name": "Free Meal", "skillIndex": 458, "level": "1+", "note": "" },
        { "name": "Individual Insight", "skillIndex": 459, "level": "160", "note": "" },
        { "name": "Log On Logs", "skillIndex": 460, "level": "100", "note": "" },
        { "name": "Leaf Thief", "skillIndex": 461, "level": "20", "note": "" },
        { "name": "Deforesting All Doubt", "skillIndex": 462, "level": "20", "note": "" },
        { "name": "Inner Peace", "skillIndex": 464, "level": "160", "note": "" },
        { "name": "Choppin It Up Ez", "skillIndex": 463, "level": "25", "note": "" }
      ],
      "note": "Put points into Free Meal to reduce food consumption. n*1 Chopping it up Ez is a has bad scaling, 25 points are enough."
    },
    {
      "name": "Shaman",
      "talents": [
        { "name": "Crazy Concoctions", "skillIndex": 480, "level": "25", "note": "" },
        { "name": "Auspicious Aura", "skillIndex": 481, "level": "25", "note": "" },
        { "name": "Sizzling Skull", "skillIndex": 482, "level": "25", "note": "" },
        { "name": "Tenteyecle", "skillIndex": 483, "level": 0, "note": "" },
        { "name": "Instant Invincibility", "skillIndex": 484, "level": 0, "note": "" },
        { "name": "Virile Vials", "skillIndex": 485, "level": "160", "note": "" },
        { "name": "Occult Obols", "skillIndex": 486, "level": "1+", "note": "" },
        { "name": "Stupendous Statues", "skillIndex": 487, "level": "100+", "note": "" },
        { "name": "Wis Wumbo", "skillIndex": 488, "level": "160", "note": "" },
        { "name": "Fantasia Flasks", "skillIndex": 489, "level": 0, "note": "" },
        { "name": "Cranium Cooking", "skillIndex": 490, "level": 0, "note": "" },
        { "name": "Busy Brewin'", "skillIndex": 491, "level": "160", "note": "" },
        { "name": "Bubble Breakthrough", "skillIndex": 492, "level": "160", "note": "" },
        { "name": "Sharing Some Smarts", "skillIndex": 493, "level": "160", "note": "" },
        { "name": "Earlier Education", "skillIndex": 494, "level": "1+", "note": "" }
      ],
      "note": "Talents 12, 13  and 14 to boost your alchemy.n*1 Excess points go into Stupendous Statues. n Wis Wumbo is needed to reach lvl 260 on first tab talent Book of the wise."
    }
  ],
  "idleonClass": "Shaman"
}

const Builds = () => {
  const [className, setClassName] = useState('');
  const [build, setBuild] = useState('');

  const handleClassChange = (event) => {
    setClassName(event.target.value);
  };

  const handleBuildChange = (event) => {
    setBuild(event.target.value);
  };

  return <>
    <Stack direction={'row'} my={3} gap={2} flexWrap={'wrap'}>
      <FormControl sx={{ width: 150 }}>
        <InputLabel id="class-select-label">Class</InputLabel>
        <Select
          labelId="class-select-label"
          id="class-select"
          value={className}
          label="Class"
          onChange={handleClassChange}
        >
          {Object.keys(talentPagesMap).map((name, index) => {
            return <MenuItem key={`${name}-${index}`} value={name}>{name}</MenuItem>;
          })}
        </Select>
      </FormControl>
      <FormControl sx={{ width: 250 }}>
        <InputLabel id="build-select-label">Build</InputLabel>
        <Select
          labelId="build-select-label"
          id="build-select"
          value={build}
          label="Build"
          onChange={handleBuildChange}
        >
          {Object.keys(talentPagesMap).map((name, index) => {
            return <MenuItem key={`${name}-${index}`} value={name}>{name}</MenuItem>;
          })}
        </Select>
      </FormControl>
    </Stack>
    <div>
      <Typography mb={3} variant={'h4'}>{mg.title}</Typography>
      <Grid container spacing={2}>
        {mg.tabs.map((tab, index) => {
          return <Grid item key={`${tab.name}-${index}`}>
            <Tab {...tab}/>
          </Grid>
        })}
      </Grid>
    </div>
  </>
};

const Tab = ({ note, name: idleonClassName, talents: talentList = [] }) => {
  return <>
    <Stack gap={1} direction={'row'} flexWrap={'wrap'} sx={{ width: 320 }}>
      {talentList.map((skill) => {
        const { name, skillIndex, level } = skill;
        const skillName = name.toUpperCase().replace(/ /g, '_');
        const realClassName = idleonClassName.replace(/ /g, '_')
        const realSkill = talents?.[realClassName]?.[skillName];
        return <Stack alignItems={'center'} key={skillIndex}>
          <Tooltip
            title={<TalentTooltip name={name} level={level} skill={realSkill}/>}>
            <img style={{ opacity: level === 0 ? .3 : 1 }} src={`${prefix}data/UISkillIcon${skillIndex}.png`} alt=""/>
          </Tooltip>
          <Typography variant={'body1'}>{level || ''}</Typography>
        </Stack>
      })}
    </Stack>
    <Card sx={{ width: 320, my: 2 }}>
      <CardContent>
        <Typography>{note}</Typography>
      </CardContent>
    </Card>
  </>
};

const TalentTooltip = ({ name, skill, level }) => {
  const { description, funcX, x1, x2, funcY, y1, y2 } = skill;
  const realLevel = isNaN(parseInt(level)) ? 100 : parseInt(level);
  const mainStat = realLevel > 0 ? growth(funcX, realLevel, x1, x2) : 0;
  const secondaryStat = realLevel > 0 ? growth(funcY, realLevel, y1, y2) : 0;
  return <>
    <Typography variant={'h5'}>{name}</Typography>
    <Typography
      variant={'body1'}>{cleanUnderscore(cleanUnderscore(description).replace('{', mainStat).replace('}', secondaryStat))}</Typography>
  </>
}

export default Builds;
