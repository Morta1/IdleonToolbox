import { capitalize, Stack, Typography } from "@mui/material";
import { cleanUnderscore, notateNumber, pascalCase } from "utility/helpers";
import HtmlTooltip from "components/Tooltip";
import { IconWithText, TitleAndValue } from "components/common/styles";
import ProgressBar from "components/common/ProgressBar";
import Box from "@mui/material/Box";
import { getStatueBonus } from "../../../../parsers/statues";

const Statues = ({ statues, characters }) => {
  return (
    <Stack sx={{ height: 'fit-content' }} flexWrap={'wrap'} direction={'row'} justifyContent={'center'} gap={2}>
      {statues?.map((statue, index) => {
        const { name, rawName, level } = statue;
        return <Box key={name + index}>
          <HtmlTooltip title={<StatueTooltip {...statue} statues={statues} characters={characters}/>}>
            <IconWithText stat={level} icon={rawName} img={{ style: { width: 40, height: 50, objectFit: 'contain' } }}/>
          </HtmlTooltip>
        </Box>;
      })}
    </Stack>
  );
};

const StatueTooltip = ({ effect, bonus, talentMulti, name, rawName, level, progress, statues, characters }) => {
  const calcBonus = level * bonus * talentMulti;
  const nextLv = Math.round(Math.pow(level, 1.17) * Math.pow(1.35, level / 10) + 1);
  const desc = cleanUnderscore(pascalCase(effect?.replace(/(%?)(@)/, '$2$1_').replace('@', Math.floor(10 * calcBonus) / 10)));
  return <>
    <Typography fontWeight={'bold'} variant={'h5'}>{capitalize(cleanUnderscore(name.toLowerCase()))}</Typography>
    <Typography variant={'body1'}>{desc}</Typography>
    <ProgressBar percent={progress / nextLv * 100} label={false}/>
    <Typography
      variant={'body2'}>{notateNumber(progress, 'Big')} / {notateNumber(nextLv, 'Big')}</Typography>
    <Typography my={2} component={'div'} variant={'caption'}>Voodo
      Statufication: {notateNumber(talentMulti, 'MultiplierInfo')}x</Typography>

    <Stack>
      {characters?.map(({ name: cName, talents }) => {
        const bonus = getStatueBonus(statues, rawName, talents);
        return <TitleAndValue key={cName} title={cName} value={Math.floor(10 * bonus) / 10}/>
      })}
    </Stack>
  </>
};

export default Statues;
