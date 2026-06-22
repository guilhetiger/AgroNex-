import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@screens/DashboardScreen';
import { ClientsScreen } from '@screens/ClientsScreen';
import { FlightsScreen } from '@screens/FlightsScreen';
import { MapsScreen } from '@screens/MapsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ReportsScreen } from '@screens/ReportsScreen';
import { AgroChatScreen } from '@screens/AgroChatScreen';
import { IntelligentReportsScreen } from '@screens/IntelligentReportsScreen';
import { OcrExpenseScreen } from '@screens/OcrExpenseScreen';
import { AgrochemicalsScreen } from '@screens/AgrochemicalsScreen';
import { ExpensesScreen } from '@screens/ExpensesScreen';
import { ClientDetailScreen } from '@screens/ClientDetailScreen';
import { FlightDetailScreen } from '@screens/FlightDetailScreen';
import { GeoHistoryScreen } from '@screens/GeoHistoryScreen';
import { SubscriptionManagementScreen } from '@screens/SubscriptionManagementScreen';
import { AnalyticsDashboardScreen } from '@screens/AnalyticsDashboardScreen';
import { PremiumTabBar } from './PremiumTabBar';
import { RoleGuard } from './RoleGuard';
import type { UserRole } from '../types';
import type { AppStackParamList, AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();
const ALL_APP_ROLES: UserRole[] = ['admin', 'operator', 'client'];

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Clients"
        options={{
          tabBarLabel: 'Clientes',
        }}
      >
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <ClientsScreen />
          </RoleGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Flights"
        options={{
          tabBarLabel: 'Vuelos',
        }}
      >
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <FlightsScreen />
          </RoleGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Maps"
        component={MapsScreen}
        options={{
          tabBarLabel: 'Mapa',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  );
}

export function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTab" component={MainTabNavigator} />
      <Stack.Screen name="Reports">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <ReportsScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="AgroChat">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <AgroChatScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="IntelligentReports">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <IntelligentReportsScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="OcrExpense">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <OcrExpenseScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="Agrochemicals">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <AgrochemicalsScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="Expenses">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <ExpensesScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="ClientDetail">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <ClientDetailScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="FlightDetail">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <FlightDetailScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="GeoHistory">
        {() => (
          <RoleGuard allowedRoles={ALL_APP_ROLES}>
            <GeoHistoryScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="SubscriptionManagement">
        {() => (
          <RoleGuard allowedRoles={['admin']}>
            <SubscriptionManagementScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
      <Stack.Screen name="AnalyticsDashboard">
        {() => (
          <RoleGuard allowedRoles={['admin']}>
            <AnalyticsDashboardScreen />
          </RoleGuard>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
