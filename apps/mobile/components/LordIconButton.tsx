import { useRef } from "react";
import LottieView from "lottie-react-native";
import { TouchableOpacity, View, ViewStyle } from "react-native";

type Props = {
  source: any;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
  colorFilters?: { keypath: string; color: string }[];
  loop?: boolean;
};

export default function LordIconButton({
  source,
  size = 28,
  onPress,
  style,
  colorFilters,
  loop = false,
}: Props) {
  const ref = useRef<LottieView>(null);

  const handlePress = () => {
    // Rejoue l'animation au press
    ref.current?.reset();
    ref.current?.play();
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={style}>
      <View style={{ width: size, height: size }}>
        <LottieView
          ref={ref}
          source={source}
          autoPlay={false}
          loop={loop}
          style={{ width: size, height: size }}
          colorFilters={colorFilters}
          renderMode="HARDWARE"
        />
      </View>
    </TouchableOpacity>
  );
}
