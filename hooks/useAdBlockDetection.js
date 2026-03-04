import { useEffect, useState } from 'react';

let detectionStarted = false;
let cachedResult = null;

const runDetection = () => {
  let errcnt = 0;
  const testImg = () => {
    const img = new Image();
    img.onerror = () => {
      errcnt++;
      if (errcnt < 3) {
        setTimeout(testImg, 250);
      } else {
        cachedResult = true;
        document.dispatchEvent(new CustomEvent('adblock.detected'));
      }
    };
    img.onload = () => { cachedResult = false; };
    img.src = `https://s.nitropay.com/1.gif?${Math.random()}&adslot=`;
  };
  testImg();
};

const useAdBlockDetection = () => {
  const [adBlocked, setAdBlocked] = useState(() => cachedResult ?? false);

  useEffect(() => {
    if (cachedResult !== null) {
      setAdBlocked(cachedResult);
      return;
    }

    if (!detectionStarted) {
      detectionStarted = true;
      runDetection();
    }

    const handleDetected = () => setAdBlocked(true);
    document.addEventListener('adblock.detected', handleDetected);
    return () => document.removeEventListener('adblock.detected', handleDetected);
  }, []);

  return adBlocked;
};

export default useAdBlockDetection;
