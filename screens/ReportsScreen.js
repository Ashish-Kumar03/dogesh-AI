import axios from "axios";
import { useState, useEffect } from "react";
import { Button, Linking, Text, TouchableOpacity, View, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.29.117:8000";
const SESSION_KEY = "dog_ai_session_id";

export default function ReportsScreen() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const initialSessionId = route.params?.sessionId || null;
  const [sessionId, setSessionId] = useState(initialSessionId);

  // Restore session from AsyncStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (!sessionId) {
          const storedId = await AsyncStorage.getItem(SESSION_KEY);
          if (storedId) setSessionId(storedId);
        }
      } catch (err) {
        console.log("Error restoring session:", err);
      }
    };
    restoreSession();
  }, []);

  const fetchReport = async () => {
    if (!sessionId) {
      Alert.alert(
        "Session missing",
        "No session found. Start chat or upload an image first."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/session/${sessionId}/report`);
      if (!res.data) {
        Alert.alert("No report", "No report available for this session yet.");
        return;
      }
      setReport(res.data);
    } catch (err) {
      console.log("Error fetching report:", err?.response?.data || err.message);
      Alert.alert("Error", "Could not load report. Ensure session exists.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (report?.report_url) {
      // Append timestamp to force fresh download
      const url = `${API_URL}${report.report_url}?t=${Date.now()}`;
      Linking.openURL(url);
    } else {
      Alert.alert("No report", "Please fetch the session report first.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="📋 View My Session Report" onPress={fetchReport} />
      <View style={{ marginVertical: 10 }} />

      <Button
        title="⬅️ Return to Chat"
        onPress={() => navigation.navigate("Chat", { sessionId })}
      />
      <View style={{ marginVertical: 10 }} />

      {loading && <Text style={{ marginTop: 12 }}>Loading...</Text>}

      {report && (
        <View
          style={{
            padding: 15,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 5,
            backgroundColor: "#fafafa",
          }}
        >
          <Text style={{ marginBottom: 5 }}>Session ID: {report.session_id}</Text>
          <Text style={{ marginBottom: 5 }}>Chat messages: {report.chat_count}</Text>
          <Text style={{ marginBottom: 10 }}>Images analyzed: {report.image_count}</Text>
          <TouchableOpacity onPress={downloadReport}>
            <Text style={{ color: "blue" }}>📥 Download Report PDF</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
