import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Text, View } from "react-native";

const { height } = Dimensions.get("window");
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 3;

interface TimePickerProps {
  onChange?: (hours: number, minutes: number) => void;
  initialHour?: number;
  initialMinute?: number;
}

const TimePicker: React.FC<TimePickerProps> = ({
  onChange,
  initialHour = 12,
  initialMinute = 0,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const hourFlatListRef = useRef<FlatList>(null);
  const minuteFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to initial positions after component mounts
    setTimeout(() => {
      hourFlatListRef.current?.scrollToIndex({
        index: initialHour,
        animated: false,
      });
      minuteFlatListRef.current?.scrollToIndex({
        index: initialMinute,
        animated: false,
      });
    }, 100);
  }, []);

  const handleScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
    type: "hour" | "minute"
  ) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);

    if (type === "hour") {
      const newHour = hours[index];
      if (newHour !== undefined && newHour !== selectedHour) {
        setSelectedHour(newHour);
        onChange?.(newHour, selectedMinute);
      }
    } else {
      const newMinute = minutes[index];
      if (newMinute !== undefined && newMinute !== selectedMinute) {
        setSelectedMinute(newMinute);
        onChange?.(selectedHour, newMinute);
      }
    }
  };

  const renderItem = (item: number, selected: number) => {
    const isSelected = item === selected;
    return (
      <View
        style={{
          height: ITEM_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: isSelected ? 32 : 22,
            color: isSelected ? "#1a1a1a" : "#d0d0d0",
            fontWeight: isSelected ? "700" : "400",
            opacity: isSelected ? 1 : 0.5,
          }}
        >
          {item.toString().padStart(2, "0")}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
      }}
    >
      {/* Selection highlight overlay */}
      <View
        style={{
          position: "absolute",
          height: ITEM_HEIGHT,
          borderRadius: 12,
          width: "90%",
          alignSelf: "center",
          backgroundColor: "rgba(108, 99, 255, 0.05)",
          pointerEvents: "none",
        }}
      />

      {/* Hours */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={hourFlatListRef}
          data={hours}
          keyExtractor={(item) => `hour-${item}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          onMomentumScrollEnd={(e) => handleScroll(e, "hour")}
          onScrollEndDrag={(e) => handleScroll(e, "hour")}
          renderItem={({ item }) => renderItem(item, selectedHour)}
          style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
          nestedScrollEnabled={true}
          bounces={true}
          scrollEventThrottle={16}
        />
      </View>

      <Text
        style={{
          fontSize: 28,
          marginHorizontal: 16,
          color: "#6C63FF",
          fontWeight: "700",
        }}
      >
        :
      </Text>

      {/* Minutes */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={minuteFlatListRef}
          data={minutes}
          keyExtractor={(item) => `minute-${item}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          onMomentumScrollEnd={(e) => handleScroll(e, "minute")}
          onScrollEndDrag={(e) => handleScroll(e, "minute")}
          renderItem={({ item }) => renderItem(item, selectedMinute)}
          style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
          nestedScrollEnabled={true}
          bounces={true}
          scrollEventThrottle={16}
        />
      </View>
    </View>
  );
};

export default TimePicker;