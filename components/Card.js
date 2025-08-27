import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

export default function Card({ title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  pressed: { opacity: 0.85 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 4, fontSize: 12, color: "#6B7280" }
});
