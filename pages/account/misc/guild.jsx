import { NextSeo } from 'next-seo';
import { Button, Stack } from '@mui/material';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import GuildMembers from '../../../components/account/Guild/GuildMembers';
import GuildBonuses from '../../../components/account/Guild/GuildBonuses';
import { formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import { notify } from '@components/common/Overlays/notify';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import { OPT } from '@parsers/accountOptions';
import { getLockedGuild } from '@parsers/guild';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import useTabIndex from '@hooks/useTabIndex';

const Guild = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const tabs = ['Members', 'Bonuses'];
  const [tabIndex] = useTabIndex(tabs);
  const guildFailed = isSectionFailed(state?.account, 'guild');
  const guild = guildFailed ? getLockedGuild() : state?.account?.guild;
  const members = (guild?.members ?? []).filter((member) => member?.name);
  const hasMembers = !guildFailed && members.length > 0;
  // The snapshots are the player's data, kept under the old key; no default, so a visit writes nothing
  const [stored, setStored] = useLocalStorage({ key: 'guild' });
  // Older saves kept one snapshot as a plain object
  const snapshots = Array.isArray(stored) ? stored : stored ? [stored] : [];

  const saveSnapshot = () => setStored([...snapshots.slice(snapshots.length >= 3 ? 1 : 0),
    { timestamp: Date.now(), members: guild?.members }]);
  const clearSnapshots = () => setStored([]);

  const exportToJson = async () => {
    let copied = false;
    try {
      const exportedData = {
        date: formatDate(new Date()),
        members: guild?.members?.map(({ name, gpEarned }) => ({ name, gpEarned }))
      }
      copied = await copyText(JSON.stringify(exportedData, null, 2));
    } catch (e) {
      console.error('exportToJson -> ', e);
    }
    notify(copied ? 'Copied the guild members to clipboard' : CLIPBOARD_ERROR_MESSAGE);
  }

  const membersTab = guildFailed ? null : state?.emptyAccount
    ? <Notice tone={'signin'}>Your guild's members show here once you sign in.</Notice>
    : !members.length
      ? <Notice tone={'locked'}>Join a guild in game: its members show here.</Notice>
      : <Stack gap={3}>
        <Panel title={'Snapshots'} meta={'Up to 3, kept in this browser: each adds a column of GP earned since it'}>
          {snapshots.toReversed().map(({ timestamp }, index) => <Panel.KV key={`${timestamp}-${index}`} label={`#${index + 1}`}
                                                                       value={formatDate(timestamp, { showSeconds: false })}/>)}
          <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={1} sx={{ px: 2, py: 1.25 }}>
            <Button variant={'contained'} onClick={saveSnapshot}>Save snapshot</Button>
            <Button onClick={exportToJson}>Export</Button>
            {snapshots.length ? <Button color={'error'} onClick={clearSnapshots} sx={{ color: 'text.error' }}>Clear all</Button> : null}
          </Stack>
        </Panel>
        <GuildMembers members={guild?.members} saves={snapshots}/>
      </Stack>;

  return <>
    <GuildSeo/>
    {guildFailed ? <MissingData name={'Guild'} failed atZero={tabs[tabIndex] === 'Bonuses'}/> : null}
    {hasMembers ? <PageSummary>
      <StatTile label={'Guild'} icon={`data/G2icon${state?.account?.accountOptions?.[OPT.guildIcon]}.png`}
                value={state?.account?.accountOptions?.[OPT.guildName]}/>
      <StatTile label={'Members'} value={`${formatNum(members.length)} / ${formatNum(guild?.maxMembers ?? 0)}`}/>
      <StatTile label={'Guild GP'} value={`${formatNum(guild?.totalGp ?? 0)} / ${formatNum(Math.round(guild?.levelReq ?? 0))}`}/>
    </PageSummary> : null}
    <Tabber tabs={tabs}>
      {membersTab}
      <GuildBonuses bonuses={guild?.guildBonuses} sectionFailed={guildFailed}/>
    </Tabber>
  </>
};

const GuildSeo = () => <NextSeo
  title="Guild | Idleon Toolbox"
  description="Keep track of your guild members, gp, bonuses and more"
/>;


export default Guild;
