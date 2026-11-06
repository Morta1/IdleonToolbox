import { useContext, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AppContext } from '@components/common/context/AppProvider';
import { trackEvent } from '@utility/analytics';
import { claimWhatsNew, startWhatsNew, whenPageIsFree } from '@utility/whatsNew';

const WhatsNewDialog = dynamic(() => import('./WhatsNewDialog'), { ssr: false, loading: () => null });

// Beside SnackbarHost in _app, for its layer. Null at build and on the first render, and
// the chunk loads only for the visitor who gets the dialog.
const WhatsNewGate = () => {
  const router = useRouter();
  const { state } = useContext(AppContext);
  const [stage, setStage] = useState(null);
  const regular = useRef(false);

  useEffect(() => {
    regular.current = startWhatsNew();
  }, []);

  const appReady = router.isReady && !state?.isLoading;
  useEffect(() => {
    if (!appReady || !regular.current) return undefined;
    return whenPageIsFree(() => {
      if (!claimWhatsNew()) return;
      trackEvent('whats_new_open');
      setStage('dialog');
    });
  }, [appReady]);

  return stage === 'dialog' ? <WhatsNewDialog onDone={() => setStage(null)}/> : null;
};

export default WhatsNewGate;
