import React, { useContext } from 'react';
import ConstructionMain, {
  CONSTRUCTION_SETTINGS,
  ConstructionSettings
} from '../../../components/account/Worlds/World3/Construction/ConstructionMain';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import CogStatCalculator from '../../../components/account/Worlds/World3/Construction/CogStatCalculator';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';

const Construction = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'construction');
  // The Main tab's setting
  const [settings, setSettings, resetSettings] = usePageSettings('construction', CONSTRUCTION_SETTINGS);
  return <>
    <NextSeo
      title="Construction | Idleon Toolbox"
      description="Keep track of your construction board, cogs information and more"
    />
    {!failed && state?.characters?.length ? <PageSettings state={settings} defaults={CONSTRUCTION_SETTINGS}
                                                          onChange={setSettings} onReset={resetSettings}>
      <ConstructionSettings/>
    </PageSettings> : null}
    {failed ? <MissingData name={'Construction'} failed/> : null}
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'construction')}>
      <ConstructionMain/>
      <CogStatCalculator/>
    </Tabber>
  </>
}

export default Construction;
