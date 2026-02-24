import React from "react";
import { FlatList, ListRenderItem, RefreshControl } from "react-native";

type Props<T> = {
  data: T[];
  renderItem: ListRenderItem<T>; // 👈 šeit
  keyExtractor: (item: T) => string;
  refreshing: boolean;
  onRefresh: () => void;
};

export default function PullToRefresh<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
}: Props<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem} // ✅ tips tagad der FlatList
      keyExtractor={keyExtractor}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
