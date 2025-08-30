import { useState, useEffect } from "react";
import { Button, Image, Text, View, Alert, ScrollView, StyleSheet, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.29.117:8000";
const SESSION_KEY = "dog_ai_session_id";

export default function UploadScreen({ route }) {
  const initialSessionId = route.params?.sessionId || null;
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [imageUri, setImageUri] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restore or start session
  useEffect(() => {
    const initSession = async () => {
      try {
        let storedId = initialSessionId || (await AsyncStorage.getItem(SESSION_KEY));

        if (!storedId) {
          const resSession = await axios.post(`${API_URL}/session/start`);
          storedId = resSession.data.session_id;
          await AsyncStorage.setItem(SESSION_KEY, storedId);
        }

        setSessionId(storedId);
      } catch (err) {
        console.log("Session init error:", err?.response?.data || err.message);
        Alert.alert("Session error", "Could not start or restore session.");
      }
    };

    initSession();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setAnalysis(null);
    }
  };

  const uploadImage = async () => {
    if (!sessionId) return Alert.alert("No session", "Session not initialized yet.");
    if (!imageUri) return Alert.alert("No image", "Please select an image first.");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: "dog.jpg",
      type: "image/jpeg",
    });

    try {
      const res = await axios.post(`${API_URL}/session/${sessionId}/upload/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data);
    } catch (err) {
      console.log(err?.response?.data || err.message);
      Alert.alert("Upload failed", err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const fetchSessionImages = async () => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API_URL}/session/${sessionId}/history`);
      const imgs = res.data.image_history || [];
      setAllImages(imgs); // add new state: allImages
    } catch (err) {
      console.log("Error fetching session images", err);
    }
  };

  const downloadReport = async () => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API_URL}/session/${sessionId}/report`);
      // Append timestamp to force fresh download
      const url = `${API_URL}${res.data.report_url}?t=${Date.now()}`;
      Linking.openURL(url);
    } catch (err) {
      console.log(err?.response?.data || err.message);
      Alert.alert("Error", "Could not download report.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <View style={{ marginVertical: 10 }} />
      <Button title="Analyze" onPress={uploadImage} disabled={loading} />
      {loading && <Text style={{ marginTop: 10 }}>Analyzing image...</Text>}

      {analysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.label}>Breed:</Text>
          <Text style={styles.value}>{analysis.breed}</Text>

          <Text style={styles.label}>Breed Confidence:</Text>
          <Text style={styles.value}>{analysis.breed_confidence}</Text>

          <Text style={styles.label}>Brightness:</Text>
          <Text style={styles.value}>{analysis.brightness}</Text>

          <Text style={styles.label}>Clarity:</Text>
          <Text style={styles.value}>{analysis.clarity}</Text>

          <Text style={styles.label}>Color Balance:</Text>
          <Text style={styles.value}>{analysis.color_balance}</Text>

          <Text style={styles.label}>Summary:</Text>
          <Text style={styles.value}>{analysis.summary}</Text>

          <Text style={styles.label}>Nutrition Tips:</Text>
          <Text style={styles.value}>{analysis.nutrition_tips}</Text>

          <View style={{ marginTop: 20 }}>
            <Button title="📄 Download Session Report" onPress={downloadReport} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: 300, marginVertical: 10, borderRadius: 8 },
  analysisContainer: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  label: { fontWeight: "bold", marginTop: 10 },
  value: { marginLeft: 5, marginTop: 2 },
});
