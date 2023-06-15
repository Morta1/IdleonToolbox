import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function WaitForRouter({ children }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  // `ready` check is necessary for empty query cases where
  // !router.isReady on BE and
  // router.isReady immediately on FE
  if (ready && router.isReady) {
    return <>{children}</>
  }

  return <></>
}

// `hidden` and `page` are flags to control <Loader/>, you can ignore them