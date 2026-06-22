import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Flights: undefined;
  Maps: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  MainTab: NavigatorScreenParams<AppTabParamList> | undefined;
  Reports: undefined;
  AgroChat: undefined;
  IntelligentReports: undefined;
  OcrExpense: undefined;
  Agrochemicals: undefined;
  Expenses: undefined;
  ClientDetail: { clientId: string };
  FlightDetail: { flightId: string };
  GeoHistory: undefined;
  SubscriptionManagement: undefined;
  AnalyticsDashboard: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<AppStackParamList> | undefined;
  Subscription: undefined;
};
