import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const bounceValue = React.useRef(new Animated.Value(1)).current;

  // Create multiple paws
  const pawCount = 8;
  const paws = React.useRef(
    [...Array(pawCount)].map(() => ({
      translateY: new Animated.Value(Math.random() * height),
      left: Math.random() * (width - 50),
      size: 20 + Math.random() * 20,
      duration: 10000 + Math.random() * 10000,
      opacity: 0.2 + Math.random() * 0.3,
    }))
  ).current;

  React.useEffect(() => {
    // Bounce animation for cards
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1.05,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate all paws
    paws.forEach(paw => {
      Animated.loop(
        Animated.timing(paw.translateY, {
          toValue: height + 50,
          duration: paw.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  return (
    <LinearGradient
      colors={["#ffecd2", "#fcb69f"]}
      style={styles.gradientBackground}
    >
      {/* Floating paws in background */}
      {paws.map((paw, index) => (
        <Animated.Text
          key={index}
          style={{
            position: "absolute",
            left: paw.left,
            transform: [{ translateY: paw.translateY }],
            fontSize: paw.size,
            opacity: paw.opacity,
          }}
        >
          🐾
        </Animated.Text>
      ))}

      <View style={styles.container}>
        <Text style={styles.title}>🐾 Dog Health AI</Text>
        <Text style={styles.subtitle}>Your dog’s health companion</Text>

        <Animated.View style={{ transform: [{ scale: bounceValue }], width: "100%" }}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Chat")}
          >
            <Text style={styles.cardTitle}>Ask AI about Dog’s Health</Text>
            <Text style={styles.cardDesc}>
              Get instant answers to your questions.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: bounceValue }], width: "100%" }}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Upload")}
          >
            <Text style={styles.cardTitle}>Upload Dog Image</Text>
            <Text style={styles.cardDesc}>
              Analyze your dog’s health from a photo.
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: bounceValue }], width: "100%" }}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Reports")}
          >
            <Text style={styles.cardTitle}>View Health Reports</Text>
            <Text style={styles.cardDesc}>
              See previous predictions and advice.
            </Text>
          </TouchableOpacity>
        </Animated.View>
        {/* ✅ New Nutrient Calculator Card */}
        <Animated.View style={{ transform: [{ scale: bounceValue }], width: "100%" }}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("NutrientCalculator")}
          >
            <Text style={styles.cardTitle}>Nutrient Calculator</Text>
            <Text style={styles.cardDesc}>
              Calculate nutrients based on your dog’s age, weight, and activity.
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 18, color: "#555", marginBottom: 25, textAlign: "center" },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
    width: width * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5, textAlign: "center" },
  cardDesc: { fontSize: 14, color: "#555", textAlign: "center" },
});
