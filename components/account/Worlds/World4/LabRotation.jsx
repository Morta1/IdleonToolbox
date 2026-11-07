import { getChipsAndJewels } from '@parsers/world-4/cooking';
import React, { useContext } from 'react';
import { AppContext } from '../../../common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { format, isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getRequirementAmount } from '@parsers/world-4/lab';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import Notice from '@components/common/Notice';
import { chipText } from './Chips';
import { jewelText } from './Mainframe';

const ROTATION_TOOLBAR = { search: '', weeks: '10' };
// The mark's threshold, in the Laboratory's gear under the tab's name: it marks chips, it does not filter them
export const ROTATION_SETTINGS = { threshold: null };

export const RotationSettings = () => <PageSettings.Group title={'Chips And Jewels Rotation'}>
  <PageSettings.Number name={'threshold'} label={'Chips owned to mark'} min={0} integer
                       help={'A chip you own more of than this is marked on every week'}/>
</PageSettings.Group>;

// The rotation follows the save's clock (timeAway) and the server's current shop (serverVars): a guest has neither, and
// the parser reads serverVars.ChipRepo without a guard
export const canRotate = (account, sectionFailed) => !sectionFailed && Boolean(account?.serverVars)
  && Number.isFinite(account?.timeAway?.GlobalTime);
const WEEKS = [10, 20, 30, 40, 50];
// The shop's third item each week is a jewel, the first two chips
const JEWEL_SLOT = 2;

const LabRotation = ({ sectionFailed }) => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('lab-rotation', ROTATION_TOOLBAR);
  const [settings] = usePageSettings('lab-rotation', ROTATION_SETTINGS);
  const lab = state?.account?.lab ?? {};
  const currentRotation = lab?.currentRotation ?? [];
  const rotating = canRotate(state?.account, sectionFailed);
  const rotations = rotating ? getChipsAndJewels(state?.account, Number(toolbar?.weeks) || WEEKS[0]) : [];
  const search = String(toolbar?.search ?? '').trim().toLowerCase();
  const shown = rotations.map((rotation, rotationIndex) => ({ ...rotation, rotationIndex }))
    .filter(({ items }) => !search || items?.some((item) => cleanUnderscore(item?.name).toLowerCase().includes(search)));
  const threshold = settings?.threshold;

  if (sectionFailed) return null;
  if (!rotating) {
    return <Notice tone={'locked'}>The shop rotation follows your save&apos;s clock: it shows once you sign in.</Notice>;
  }

  return <Box>
    <Toolbar state={toolbar} defaults={ROTATION_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={rotations.length} shown={shown.length} noun={'weeks'}>
      <Toolbar.Search placeholder={'Search chips and jewels'}/>
      <Toolbar.Show name={'weeks'} options={WEEKS.map((weeks) => [String(weeks), `${weeks} weeks`])}/>
    </Toolbar>
    <Stack gap={3}>
      {shown.map(({ items, date, rotationIndex }) => <Stack key={'rotation' + rotationIndex} gap={1}>
        {isValid(date) ? <Typography variant={'cardTitle'} component={'h3'}>
          {`${formatDate(date)} (${format(date, 'MMM do, yyyy')})`}
        </Typography> : null}
        <CardGrid size={'m'}>
          {items?.map((item, itemsIndex) => {
            const { name, requirements = [], rawName, index, acquired, totalAmount: chipCount } = item ?? {};
            const soldOut = rotationIndex === 0 && index === currentRotation?.[itemsIndex];
            const marked = threshold != null && itemsIndex !== JEWEL_SLOT && chipCount > threshold;
            return <ItemCard key={'items' + itemsIndex} icon={`data/${rawName ? rawName : `ConsoleChip${index}`}.png`}
                             iconAlt={''} title={cleanUnderscore(name)}
                             status={soldOut || acquired || marked ? 'done' : undefined}
                             statusLabel={soldOut ? 'Sold out' : acquired ? 'Found' : marked ? `You own ${formatNum(chipCount)}` : undefined}>
              <ItemCard.Desc text={itemsIndex === JEWEL_SLOT ? jewelText(item) : [chipText(item)]}/>
              {requirements?.map(({ name: reqName, rawName: reqRaw, amount }, reqIndex) => <ItemCard.Cost
                key={`req-${reqRaw}-${reqIndex}`} icon={`data/${reqRaw}.png`} iconAlt={cleanUnderscore(reqName)}
                need={amount ?? 0} have={getRequirementAmount(reqName, reqRaw, state?.account) ?? 0}
                game={'Labb.ChipRepoJEWEL'}/>)}
            </ItemCard>;
          })}
        </CardGrid>
      </Stack>)}
    </Stack>
  </Box>;
};

export default LabRotation;
