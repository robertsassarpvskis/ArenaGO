import React from "react";
import { StatusBar, ViewProps } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type ContainerProps = ViewProps & {
  children: React.ReactNode;
  backgroundColor?: string;
  padded?: boolean; // Toggle default padding
};

export const Container = ({
  children,
  backgroundColor = "#fffcf4",
  padded = true,
  style,
  ...props
}: ContainerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor,
          paddingBottom: 0,
        },
        style,
      ]}
      {...props}
    >
      <StatusBar
        barStyle={
          backgroundColor === "#FAFAFA" ? "dark-content" : "light-content"
        }
        translucent
        backgroundColor="transparent"
      />
      {children}
    </SafeAreaView>
  );
};
