import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { LocalizationProvider } from './src/context/LocalizationContext';
import { SyncProvider } from './src/context/SyncContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCachedResources } from './src/hooks/useCachedResources';
import { queryClient } from './src/services/queryClient';

export default function App() {
  const isReady = useCachedResources();

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LocalizationProvider>
            <AuthProvider>
              <SyncProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
                <StatusBar style="light" />
              </SyncProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
