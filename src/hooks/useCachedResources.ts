import { useEffect, useState } from 'react';

export function useCachedResources() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return isReady;
}
