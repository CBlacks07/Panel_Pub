import { useEffect, useRef } from "react";
import LottieView from "lottie-react-native";
import { View, ViewStyle } from "react-native";

type Props = {
  source: any;           // require("../../assets/icons/shop.json")
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  colorFilters?: { keypath: string; color: string }[];
};

export default function LordIcon({
  source,
  size = 28,
  autoPlay = false,
  loop = false,
  style,
  colorFilters,
}: Props) {
  const ref = useRef<LottieView>(null);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        ref={ref}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: size, height: size }}
        colorFilters={colorFilters}
        renderMode="HARDWARE"
      />
    </View>
  );
}
