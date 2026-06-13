import { useEffect, useRef, useState } from "react";
import { Animated, Text, TextStyle, StyleProp } from "react-native";

type Props = {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  decimals?: number;
};

export default function CountUp({ value, duration = 1200, style, suffix = "", decimals = 0 }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value: v }) => {
      setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString());
    });
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display}{suffix}</Text>;
}
