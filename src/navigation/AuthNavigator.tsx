import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '@screens/SignInScreen';
import { SignUpScreen } from '@screens/SignUpScreen';
import { WelcomeScreen } from '@screens/WelcomeScreen';
import { OnboardingScreen } from '@screens/OnboardingScreen';
import { ForgotPasswordScreen } from '@screens/ForgotPasswordScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
