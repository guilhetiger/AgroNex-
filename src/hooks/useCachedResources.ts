import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';

export function useCachedResources() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await Asset.loadAsync([]);
        await Font.loadAsync({});
      } catch (error) {
        console.warn(error);
      } finally {
        setIsReady(true);
      }
    }
    loadResources();
  }, []);

  return isReady;
}
