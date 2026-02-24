import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function Header({ 
  start, 
  center, 
  end 
}: { 
  start: React.ReactNode; 
  center: React.ReactNode; 
  end: React.ReactNode;
}) {
  return (
    <>
      <View style={styles.container}>
        <View style={styles.section}>{start}</View>
        <View style={styles.centerSection}>{center}</View>
        <View style={styles.section}>{end}</View>
      </View>
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fffcf4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f0e8",
  },

  section: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
});