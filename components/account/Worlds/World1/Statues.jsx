import { capitalize, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, pascalCase } from 'utility/helpers';
import HtmlTooltip from 'components/Tooltip';
import { IconWithText, TitleAndValue } from '@components/common/styles';
import ProgressBar from 'components/common/ProgressBar';
import Box from '@mui/material/Box';
import { getStatueBonus } from '../../../../parsers/statues';

const Statues = ({ characters, account }) => {
  return (
    <Stack sx={{ height: 'fit-content' }} flexWrap={'wrap'} direction={'row'} justifyContent={'center'} gap={2}>
      {account?.statues?.map((statue, index) => {
        const { name, rawName, level, bonus, talentMulti, progress } = statue;
        const calcBonus = level * bonus * talentMulti;
        const nextLv = Math.round(Math.pow(level, 1.17) * Math.pow(1.35, level / 10) + 1);
        return <Box key={name + index}>
          <HtmlTooltip title={<StatueTooltip {...statue} calcBonus={calcBonus} nextLv={nextLv} account={account}
                                             characters={characters} index={index}/>}>
            <IconWithText stat={level} icon={rawName} img={{ style: { width: 40, height: 50, objectFit: 'contain' } }}/>
          </HtmlTooltip>
          <ProgressBar percent={progress / nextLv * 100} label={false}/>
        </Box>;
      })}
    </Stack>
  );
};

const StatueTooltip = ({
                         effect,
                         talentMulti,
                         name,
                         account,
                         progress,
                         characters,
                         calcBonus,
                         nextLv,
                         index
                       }) => {
  const desc = cleanUnderscore(pascalCase(effect?.replace(/(%?)(@)/, '$2$1_').replace('@', Math.floor(10 * calcBonus) / 10)));
  return <>
    <Typography fontWeight={'bold'} variant={'h6'}>{capitalize(cleanUnderscore(name.toLowerCase()))}</Typography>
    <Typography variant={'body1'}>{desc}</Typography>
    <Divider sx={{ my: 1 }}/>
    <ProgressBar percent={progress / nextLv * 100}/>
    <Typography
      variant={'body2'}>{notateNumber(progress, 'Big')} / {notateNumber(nextLv, 'Big')}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography component={'div'} variant={'caption'}>Voodo
      Statufication: {notateNumber(talentMulti, 'MultiplierInfo')}x</Typography>
    <Divider sx={{ my: 1 }}/>
    <Stack>
      {characters?.map(({ name: cName, flatTalents }) => {
        const bonus = getStatueBonus(account, index, flatTalents);
        return <TitleAndValue key={cName} title={cName} value={Math.floor(10 * bonus) / 10}/>
      })}
    </Stack>
  </>
};

export default Statues;
