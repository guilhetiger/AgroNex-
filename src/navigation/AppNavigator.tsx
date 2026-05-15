import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
