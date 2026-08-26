import React, { useRef } from "react";
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * A Pressable with a restrained scale-down on press (150-250ms, matching
 * the app's "subtle micro-interaction" design direction — no bounce) and
 * a light haptic tap. Used for primary actions (Save/Add buttons, cards,
 * "+Log..." buttons) rather than every touchable in the app.
 */
export function AnimatedPressable({
  onPress,
  style,
  children,
  disabled,
  haptic = "light",
  scaleTo = 0.96,
  ...props
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Pass false to skip the haptic tap (e.g. for a delete/destructive action that already confirms). */
  haptic?: "light" | "medium" | false;
  scaleTo?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.timing(scale, { toValue: scaleTo, duration: 100, useNativeDriver: true }).start();
  }

  function pressOut() {
    Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }

  function handlePress(e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) {
    if (haptic) {
      Haptics.impactAsync(
        haptic === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    }
    onPress?.(e);
  }

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.6 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
