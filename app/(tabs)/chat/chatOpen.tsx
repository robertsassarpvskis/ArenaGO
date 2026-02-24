import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Message {
  id: number;
  sender: "user" | "other";
  text: string;
}

interface ChatData {
  id: number;
  name: string;
  avatarColor: string;
  initials: string;
  online: boolean;
  messages: Message[];
}

const COLORS = {
  primary: "#FF6B58",
  secondary: "#FF8A73",
  accentGreen: "#10B981",
  accentRed: "#EF4444",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  background: "#fffcf4",
  cardBg: "#FFFFFF",
  darkGray: "#374151",
};

const chatDatabase: { [key: number]: ChatData } = {
  1: {
    id: 1,
    name: "Sarah Anderson",
    avatarColor: "#FF6B58",
    initials: "SA",
    online: true,
    messages: [
      { id: 1, sender: "other", text: "Hey! How are you?" },
      { id: 2, sender: "user", text: "Doing great! You?" },
      { id: 3, sender: "other", text: "All good! Free this weekend?" },
      { id: 4, sender: "user", text: "Yeah, Saturday works" },
      { id: 5, sender: "other", text: "Perfect! See you then 🎉" },
      { id: 6, sender: "user", text: "What time?" },
      { id: 7, sender: "other", text: "That sounds perfect! See you there" },
    ],
  },
  2: {
    id: 2,
    name: "Jordan Lee",
    avatarColor: "#FF8A73",
    initials: "JL",
    online: true,
    messages: [
      { id: 1, sender: "other", text: "Did you review the project?" },
      { id: 2, sender: "user", text: "Yeah, looks good!" },
      { id: 3, sender: "other", text: "Nice! Thanks" },
    ],
  },
};

export default function ChatOpen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = parseInt(params.id as string) || 1;

  const chat = chatDatabase[chatId];
  const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
  const [inputText, setInputText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      text: inputText,
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in a real app, you would fetch updated messages from API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === "user" ? styles.userMessageRow : styles.otherMessageRow,
      ]}
    >
      {item.sender === "other" && (
        <View
          style={[
            styles.messageAvatar,
            { backgroundColor: chat?.avatarColor || COLORS.primary },
          ]}
        >
          <Text style={styles.messageAvatarText}>{chat?.initials}</Text>
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          item.sender === "user" ? styles.userBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color:
                item.sender === "user" ? COLORS.cardBg : COLORS.textPrimary,
            },
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: chat?.avatarColor },
            ]}
          >
            <Text style={styles.headerAvatarText}>{chat?.initials}</Text>
            {chat?.online && <View style={styles.headerOnlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.chatTitle}>{chat?.name}</Text>
            <Text style={styles.statusText}>
              {chat?.online ? "Active now" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.messagesContainer}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      </KeyboardAvoidingView>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="plus-circle"
              size={28}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          {inputText.trim() !== "" ? (
            <TouchableOpacity
              onPress={handleSendMessage}
              style={styles.sendButton}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={COLORS.cardBg}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.cardBg,
  },
  headerOnlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accentGreen,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2.5,
    borderColor: COLORS.cardBg,
  },
  headerInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.cardBg,
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emojiButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
