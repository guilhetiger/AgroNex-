import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '@screens/DashboardScreen';
import { ClientsScreen } from '@screens/ClientsScreen';
import { FlightsScreen } from '@screens/FlightsScreen';
import { MapsScreen } from '@screens/MapsScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { ReportsScreen } from '@screens/ReportsScreen';
import { AgrochemicalsScreen } from '@screens/AgrochemicalsScreen';
import { ExpensesScreen } from '@screens/ExpensesScreen';
import { ClientDetailScreen } from '@screens/ClientDetailScreen';
import { FlightDetailScreen } from '@screens/FlightDetailScreen';
import { GeoHistoryScreen } from '@screens/GeoHistoryScreen';
import { PremiumTabBar } from './PremiumTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        component={ClientsScreen}
        options={{
          tabBarLabel: 'Clientes',
        }}
      />
      <Tab.Screen
        name="Flights"
        component={FlightsScreen}
        options={{
          tabBarLabel: 'Vuelos',
        }}
      />
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
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Agrochemicals" component={AgrochemicalsScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="FlightDetail" component={FlightDetailScreen} />
      <Stack.Screen name="GeoHistory" component={GeoHistoryScreen} />
    </Stack.Navigator>
  );
}
