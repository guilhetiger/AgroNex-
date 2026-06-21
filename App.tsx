import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { LocalizationProvider } from './src/context/LocalizationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCachedResources } from './src/hooks/useCachedResources';
import { queryClient } from './src/services/queryClient';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  const isReady = useCachedResources();

  if (!isReady) return null;

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
