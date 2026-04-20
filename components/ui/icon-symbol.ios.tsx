import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

// Mapping from common icon names to SF Symbols
const SYMBOL_MAPPING: Record<string, SymbolViewProps["name"]> = {
  bolt: "bolt.fill",
  person: "person.fill",
  "chevron.right": "chevron.right",
  "message.fill": "message.fill",
  search: "magnifyingglass", // iOS SF Symbol for search
  plus: "plus",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const symbolName = (SYMBOL_MAPPING[name as string] ||
    name) as SymbolViewProps["name"];

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={symbolName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
