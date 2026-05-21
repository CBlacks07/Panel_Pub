import { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  style?: ViewStyle;
};

export default function FadeSlide({ children, delay = 0, direction = "up", distance = 24, duration = 400, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(direction === "up" ? distance : direction === "down" ? -distance : direction === "left" ? distance : -distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, speed: 20, bounciness: 4, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const transform = direction === "up" || direction === "down"
    ? [{ translateY: translate }]
    : [{ translateX: translate }];

  return (
    <Animated.View style={[{ opacity, transform }, style]}>
      {children}
    </Animated.View>
  );
}
