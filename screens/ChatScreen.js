import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

// ⚠️ IMPORTANT: change this IP to your computer’s local IP address
const API_BASE = "http://192.168.29.117:8000";
const SESSION_KEY = "dog_ai_session_id";

export default function ChatScreen() {
  const navigation = useNavigation();

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Start or restore a session
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
      } catch (err) {
        console.log("Error initializing session:", err);
      }
    };

    initSession();
  }, []);

  // Fetch per-session history and map user/bot pairs
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
          structured.push({
            question: userMsg.text,
            answer: botMsg.text,
          });
        }
        setMessages(structured);
      }
    } catch (err) {
      console.log("Error loading history:", err);
    }
  };

  // Send new message for this session
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    try {
      const res = await fetch(`${API_BASE}/session/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { question: input, answer: data?.answer || "No response" },
      ]);
      setInput("");
    } catch (err) {
      console.log("Error sending message:", err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.message}>
      <Text style={styles.question}>You: {item?.question || "..."}</Text>
      <Text style={styles.answer}>Bot: {item?.answer || "No response"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask something about your dog..."
        />
        <Button title="Send" onPress={sendMessage} />
      </View>

      {/* Add spacing before Upload button */}
      <View style={{ marginTop: 15 }}>
        <Button
          title="Go to Uploads"
          onPress={() => navigation.navigate("Upload", { sessionId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  message: { marginVertical: 5 },
  question: { fontWeight: "bold", color: "#333" },
  answer: { color: "#555", marginLeft: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginRight: 5,
  },
});
