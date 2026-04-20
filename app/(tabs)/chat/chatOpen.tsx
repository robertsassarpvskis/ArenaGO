import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  sender: "user" | "other";
  text: string;
}

interface ChatData {
  id: number;
  name: string;
  username: string;
  initials: string;
  online: boolean;
  accentColor: string;
  languages: string[];
  messages: Message[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  accent: "#FF6B58",
  accentLight: "#FF8A73",
  joined: "#059669",
  joinedLight: "#10B981",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  ink: "#0F172A",
  mid: "#64748B",
  muted: "#94A3B8",
  divider: "#E2E8F0",
  bg: "#F8F7F2",
  card: "#FFFFFF",
  overlay: "rgba(15,23,42,0.65)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LANG_FLAGS: Record<string, string> = {
  EN: "🇬🇧",
  FR: "🇫🇷",
  ZH: "🇨🇳",
  ES: "🇪🇸",
  DE: "🇩🇪",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const chatDatabase: Record<number, ChatData> = {
  1: {
    id: 1,
    name: "Sarah Anderson",
    username: "@sarah.cre8",
    initials: "SA",
    online: true,
    accentColor: "#FF6B58",
    languages: ["EN", "FR"],
    messages: [
      { id: 1, sender: "other", text: "Hey! How are you?" },
      { id: 2, sender: "user", text: "Doing great! You?" },
      { id: 3, sender: "other", text: "All good! Free this weekend?" },
      { id: 4, sender: "user", text: "Yeah, Saturday works" },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatOpen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const chatId = parseInt(params.id as string) || 1;

  const flatListRef = useRef<FlatList>(null);
  const chat = chatDatabase[chatId];

  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [inputText, setInputText] = useState("");

  const sendMessage = () => {
    if (!inputText.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: "user", text: inputText.trim() },
    ]);

    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ── Message bubble ──────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }: any) => {
    const isUser = item.sender === "user";
    const prev = messages[index - 1];
    const grouped = prev?.sender === item.sender;

    return (
      <View
        style={[
          styles.msgRow,
          isUser ? styles.msgRight : styles.msgLeft,
          grouped ? styles.grouped : styles.firstMsg,
        ]}
      >
        {!isUser && !grouped && (
          <View
            style={[
              styles.msgAvatar,
              { backgroundColor: chat.accentColor + "18" },
            ]}
          >
            <Text style={[styles.msgAvatarText, { color: chat.accentColor }]}>
              {chat.initials}
            </Text>
          </View>
        )}
        {!isUser && grouped && <View style={styles.avatarSpacer} />}

        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleOther,
          ]}
        >
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: chat.accentColor + "18" },
            ]}
          >
            <Text style={[styles.avatarText, { color: chat.accentColor }]}>
              {chat.initials}
            </Text>
            {chat.online && <View style={styles.online} />}
          </View>

          <View>
            <Text style={styles.name}>{chat.name}</Text>
            <Text style={styles.username}>
              {chat.online ? "Active now" : chat.username}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={20}
            color={C.mid}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(m) => m.id.toString()}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message…"
              placeholderTextColor={C.muted}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="arrow-up"
                size={17}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    backgroundColor: C.card,
    gap: 12,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  online: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.green,
    position: "absolute",
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: C.card,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: C.ink,
    letterSpacing: -0.2,
  },

  username: {
    fontSize: 12,
    color: C.mid,
    marginTop: 1,
  },

  moreBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  msgList: {
    padding: 16,
    paddingBottom: 8,
  },

  msgRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },

  firstMsg: { marginTop: 10 },
  grouped: { marginTop: 2 },

  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
  },

  msgAvatarText: {
    fontSize: 10,
    fontWeight: "700",
  },

  avatarSpacer: { width: 36 },

  bubble: {
    maxWidth: "72%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },

  bubbleUser: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 5,
  },

  bubbleOther: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.divider,
    borderBottomLeftRadius: 5,
  },

  bubbleText: {
    color: C.ink,
    fontSize: 15,
    lineHeight: 21,
  },

  bubbleTextUser: {
    color: "#FFFFFF",
  },

  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.card,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: C.divider,
    gap: 8,
  },

  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: C.ink,
  },

  sendBtn: {
    backgroundColor: C.accent,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  sendBtnDisabled: {
    backgroundColor: C.muted,
  },
});
