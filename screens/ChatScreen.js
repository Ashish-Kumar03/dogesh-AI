import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

const API_BASE = "http://192.168.29.117:8000";
const SESSION_KEY = "dog_ai_session_id";

export default function ChatScreen() {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [location, setLocation] = useState(null);
  const [isTyping, setIsTyping] = useState(false); // ✅ typing state

  // Init session + location
  useEffect(() => {
    const initSession = async () => {
      try {
        let storedId = await AsyncStorage.getItem(SESSION_KEY);

        if (!storedId) {
          const res = await fetch(`${API_BASE}/session/start`, { method: "POST" });
          if (!res.ok) throw new Error("Failed to start session");
          const data = await res.json();
          storedId = data.session_id;
          await AsyncStorage.setItem(SESSION_KEY, storedId);
        }

        setSessionId(storedId);
        fetchHistory(storedId);

        // ✅ Location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        } catch (locErr) {
          console.log("Error getting location:", locErr);
        }
      } catch (err) {
        console.log("Error initializing session:", err);
      }
    };

    initSession();
  }, []);

  // Fetch history
  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/session/${id}/history`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();

      if (Array.isArray(data)) {
        const structured = [];
        for (let i = 0; i < data.length; i += 2) {
          const userMsg = data[i];
          const botMsg = data[i + 1] || { role: "bot", text: "No response" };
          structured.push({ question: userMsg.text, answer: botMsg.text });
        }
        setMessages(structured);
      }
    } catch (err) {
      console.log("Error loading history:", err);
    }
  };

  // Auto scroll whenever messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    try {
      const body = { question: input };
      if (location) body.location = location;

      setMessages((prev) => [...prev, { question: input, answer: null }]);
      setInput("");
      setIsTyping(true); // ✅ show typing while waiting

      const res = await fetch(`${API_BASE}/session/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].answer = data?.answer || "No response";
        return updated;
      });

      setIsTyping(false); // ✅ stop typing once reply comes
    } catch (err) {
      console.log("Error sending message:", err);
      setIsTyping(false);
    }
  };

  const renderItem = ({ item }) => (
    <>
      {/* User bubble */}
      <View style={[styles.bubbleContainer, { justifyContent: "flex-end" }]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{item?.question || "..."}</Text>
        </View>
      </View>

      {/* Bot bubble */}
      {item?.answer && (
        <View style={[styles.bubbleContainer, { justifyContent: "flex-start" }]}>
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.botText}>{item?.answer || "No response"}</Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f6fc" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 10 }}
          />

          {/* Typing indicator */}
          {isTyping && (
            <View style={{ paddingLeft: 15, paddingBottom: 5 }}>
              <Text style={{ fontStyle: "italic", color: "#555" }}>
                Dogesh Bhai is typing...
              </Text>
            </View>
          )}

          {/* Input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask something about your dog..."
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <Button title="Send" onPress={sendMessage} />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button
              title="Go to Uploads"
              onPress={() => navigation.navigate("Upload", { sessionId })}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubbleContainer: {
    flexDirection: "row",
    marginVertical: 3,
  },
  bubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#DCF8C6",
    marginLeft: 40,
  },
  botBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 40,
  },
  userText: { color: "#000" },
  botText: { color: "#000" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 5,
    backgroundColor: "#fff",
  },
});
