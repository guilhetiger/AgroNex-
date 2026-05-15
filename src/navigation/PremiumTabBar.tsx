import React, { useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeProvider';

const AnimatedView = Animated.createAnimatedComponent(View);

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.outer, { paddingBottom: padBottom }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.tabBarBorder,
            borderRadius: radii.xl,
          },
        ]}
      >
        {state.routes.map((route, routeIndex) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === routeIndex;
          const color = isFocused ? colors.primary : colors.onSurfaceSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName = tabIcon(route.name);

          return (
            <TabItem
              key={route.key}
              label={label}
              iconName={iconName}
              color={color}
              isFocused={isFocused}
              primary={colors.primary}
              radii={radii}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function tabIcon(routeName: string): keyof typeof MaterialIcons.glyphMap {
  switch (routeName) {
    case 'Dashboard':
      return 'dashboard';
    case 'Clients':
      return 'groups';
    case 'Flights':
      return 'flight';
    case 'Maps':
      return 'map';
    case 'Settings':
      return 'settings';
    default:
      return 'circle';
  }
}

function TabItem({
  label,
  iconName,
  color,
  isFocused,
  primary,
  radii,
  onPress,
}: {
  label: string | undefined;
  iconName: keyof typeof MaterialIcons.glyphMap;
  color: string;
  isFocused: boolean;
  primary: string;
  radii: { md: number };
  onPress: () => void;
}) {
  const dot = useSharedValue(isFocused ? 1 : 0);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withSpring(dot.value, { damping: 14, stiffness: 200 }),
    transform: [{ scale: withSpring(0.85 + dot.value * 0.25, { damping: 14, stiffness: 200 }) }],
  }));

  useEffect(() => {
    dot.value = isFocused ? 1 : 0;
  }, [isFocused, dot]);

  return (
    <Pressable onPress={onPress} style={styles.tabPress} hitSlop={8}>
      <View style={[styles.tabInner, isFocused && { backgroundColor: primary + '12', borderRadius: radii.md }]}>
        <MaterialIcons name={iconName} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
        <AnimatedView style={[styles.activeDot, { backgroundColor: primary }, dotStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  tabPress: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 2,
    minHeight: 52,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
