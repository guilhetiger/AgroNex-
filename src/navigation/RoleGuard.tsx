import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useAuth } from '@hooks/useAuth';
import { UserRole } from '../types';
import type { AppStackParamList } from './types';

type SafeFallbackRoute = 'Dashboard' | 'Reports' | 'Agrochemicals' | 'Expenses' | 'GeoHistory';

type RoleGuardProps = {
  allowedRoles: UserRole[];
  fallbackRoute?: SafeFallbackRoute;
  children: React.ReactNode;
};

export function RoleGuard({ allowedRoles, fallbackRoute = 'Dashboard', children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      if (fallbackRoute === 'Dashboard') {
        navigation.navigate('MainTab', { screen: 'Dashboard' });
        return;
      }

      navigation.navigate(fallbackRoute);
    }
  }, [loading, user, allowedRoles, navigation, fallbackRoute]);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' }}>
        <ActivityIndicator size="large" color="#3EE8A8" />
      </View>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
