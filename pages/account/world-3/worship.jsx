import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Charge from '@components/account/Worlds/World3/Worship/Charge';
import Totems, { TOTEMS_SETTINGS, TotemsSettings } from '@components/account/Worlds/World3/Worship/Totems';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import MsaTotalizer from '@components/account/Worlds/World3/Worship/MsaTotalizer';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';

const Worship = () => {
  const { state } = useContext(AppContext);
  const failed = ['msaTotalizer', 'totems', 'towers'].filter((section) => isSectionFailed(state?.account, section));
  // The Totems tab's settings
  const [settings, setSettings, resetSettings] = usePageSettings('worship', TOTEMS_SETTINGS);
  return (
    <>
      <NextSeo
        title="Worship | Idleon Toolbox"
        description="Keep track of your worship charge and charge rate for all of your characters"
      />
      {/* A guest's totems have no waves, so the settings would price nothing */}
      {state?.characters?.length && !failed.includes('totems') ? <PageSettings state={settings} defaults={TOTEMS_SETTINGS}
                                                                               onChange={setSettings} onReset={resetSettings}>
        <TotemsSettings characters={state?.characters}/>
      </PageSettings> : null}
      {failed.length ? <MissingData name={'Worship'} failed/> : null}
      <MsaTotalizer/>
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'worship')}>
        <Charge/>
        <Totems totemsFailed={failed.includes('totems')} towersFailed={failed.includes('towers')}/>
      </Tabber>
    </>
  );
};

export default Worship;
