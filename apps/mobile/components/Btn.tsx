import { useRef } from "react";
import {
  TouchableOpacity, Text, View, StyleSheet,
  Animated, ActivityIndicator, ViewStyle, TextStyle,
} from "react-native";
import { useConfig } from "../context/ConfigContext";
import { buttonStyles, typography } from "../lib/design";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
};

export default function Btn({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
}: Props) {
  const { primary } = useConfig();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();

  const sizeStyle = size === "sm" ? buttonStyles.sm : size === "lg" ? buttonStyles.lg : {};

  const bgColor =
    variant === "primary" ? primary :
    variant === "secondary" ? "#fff" :
    variant === "destructive" ? "#fff5f5" : "transparent";

  const textColor =
    variant === "primary" ? "#fff" :
    variant === "secondary" ? "#374151" :
    variant === "destructive" ? "#dc2626" : "#6b7280";

  const borderColor =
    variant === "secondary" ? "#e5e7eb" :
    variant === "destructive" ? "#fee2e2" : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          buttonStyles.base,
          sizeStyle,
          { backgroundColor: bgColor },
          borderColor && { borderWidth: 1.5, borderColor },
          fullWidth && { width: "100%" },
          (disabled || loading) && { opacity: 0.5 },
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[
              buttonStyles.textBase,
              { color: textColor },
              size === "sm" && buttonStyles.textSm,
              size === "lg" && buttonStyles.textLg,
              textStyle,
            ]}>
              {label}
            </Text>
            {iconRight}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
