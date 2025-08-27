import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐾 Dog Health AI</Text>
      <Text style={styles.subtitle}>Your dog’s health companion</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Chat")}
      >
        <Text style={styles.cardTitle}>Ask AI about Dog’s Health</Text>
        <Text style={styles.cardDesc}>
          Get instant answers to your questions.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Upload")}
      >
        <Text style={styles.cardTitle}>Upload Dog Image</Text>
        <Text style={styles.cardDesc}>
          Analyze your dog’s health from a photo.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Reports")}
      >
        <Text style={styles.cardTitle}>View Health Reports</Text>
        <Text style={styles.cardDesc}>
          See previous predictions and advice.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 40 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16, color: "gray", marginBottom: 20 },
  card: {
    backgroundColor: "#f5f6f7",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardDesc: { fontSize: 14, color: "gray" },
});
