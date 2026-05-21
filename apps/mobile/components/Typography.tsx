import { Text as RNText, TextStyle, TextProps } from "react-native";

type Weight = "regular" | "medium" | "semibold" | "bold" | "extrabold";

const WEIGHT_MAP: Record<Weight, TextStyle["fontWeight"]> = {
  regular:   "400",
  medium:    "500",
  semibold:  "600",
  bold:      "700",
  extrabold: "800",
};

type TypographyProps = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  center?: boolean;
  style?: TextStyle | TextStyle[];
};

export function Text({ weight = "regular", size, color, center, style, children, ...props }: TypographyProps) {
  return (
    <RNText
      style={[
        { fontWeight: WEIGHT_MAP[weight] },
        size && { fontSize: size },
        color && { color },
        center && { textAlign: "center" },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export const Display = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="extrabold" size={36} style={[{ letterSpacing: -0.5, lineHeight: 42 }, p.style as TextStyle]} {...p} />;

export const H1 = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="extrabold" size={24} style={[{ letterSpacing: -0.3, lineHeight: 30 }, p.style as TextStyle]} {...p} />;

export const H2 = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="bold" size={18} style={[{ lineHeight: 24 }, p.style as TextStyle]} {...p} />;

export const H3 = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="bold" size={15} style={[{ lineHeight: 20 }, p.style as TextStyle]} {...p} />;

export const Body = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="regular" size={14} style={[{ lineHeight: 22 }, p.style as TextStyle]} {...p} />;

export const Small = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="medium" size={12} style={[{ lineHeight: 17 }, p.style as TextStyle]} {...p} />;

export const Caption = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="semibold" size={11} style={[{ letterSpacing: 0.5, lineHeight: 15 }, p.style as TextStyle]} {...p} />;

export const Label = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="semibold" size={13} style={[{ letterSpacing: 0.3 }, p.style as TextStyle]} {...p} />;

export const BtnText = (p: Omit<TypographyProps, "weight" | "size">) =>
  <Text weight="bold" size={15} {...p} />;
