import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ children, style, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 420 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 380 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
