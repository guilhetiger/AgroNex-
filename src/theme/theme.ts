export type ThemeRadii = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
};

export type Theme = {
  radii: ThemeRadii;
  colors: {
    background: string;
    backgroundElevated: string;
    surface: string;
    surfaceGlass: string;
    surfaceMuted: string;
    tabBar: string;
    tabBarBorder: string;
    primary: string;
    primaryMuted: string;
    accent: string;
    accentMuted: string;
    text: string;
    textSecondary: string;
    onSurfaceSecondary: string;
    border: string;
    borderSubtle: string;
    error: string;
    success: string;
    warning: string;
    chartGrid: string;
  };
};

export const darkTheme: Theme = {
  radii: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  colors: {
    background: '#090A0B',
    backgroundElevated: '#0E1014',
    surface: '#12151C',
    surfaceGlass: 'rgba(18, 21, 28, 0.78)',
    surfaceMuted: '#0C0E12',
    tabBar: 'rgba(12, 14, 18, 0.92)',
    tabBarBorder: 'rgba(255, 255, 255, 0.06)',
    primary: '#3EE8A8',
    primaryMuted: 'rgba(62, 232, 168, 0.14)',
    accent: '#8B95FF',
    accentMuted: 'rgba(139, 149, 255, 0.16)',
    text: '#F4F6FA',
    textSecondary: '#9AA3B5',
    onSurfaceSecondary: '#6B7380',
    border: 'rgba(255, 255, 255, 0.09)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    error: '#FF6B6B',
    success: '#3EE8A8',
    warning: '#F5C15C',
    chartGrid: 'rgba(255, 255, 255, 0.04)',
  },
};

export const lightTheme: Theme = {
  radii: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  colors: {
    background: '#F3F6F9',
    backgroundElevated: '#E8EDF3',
    surface: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.92)',
    surfaceMuted: '#F0F3F8',
    tabBar: 'rgba(255, 255, 255, 0.94)',
    tabBarBorder: 'rgba(15, 23, 42, 0.08)',
    primary: '#0D7A52',
    primaryMuted: 'rgba(13, 122, 82, 0.12)',
    accent: '#4F5FD7',
    accentMuted: 'rgba(79, 95, 215, 0.12)',
    text: '#0F172A',
    textSecondary: '#475569',
    onSurfaceSecondary: '#64748B',
    border: 'rgba(15, 23, 42, 0.1)',
    borderSubtle: 'rgba(15, 23, 42, 0.05)',
    error: '#DC2626',
    success: '#0D7A52',
    warning: '#B45309',
    chartGrid: 'rgba(15, 23, 42, 0.06)',
  },
};
