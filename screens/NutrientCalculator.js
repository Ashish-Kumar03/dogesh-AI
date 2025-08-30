import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function NutrientCalculator() {
    const [weight, setWeight] = useState("");
    const [ageStage, setAgeStage] = useState("");
    const [activity, setActivity] = useState("");
    const [result, setResult] = useState(null);

    const calculateNutrients = () => {
        if (!weight || !ageStage || !activity) {
            alert("Please fill all fields.");
            return;
        }

        const w = parseFloat(weight);

        // Base Resting Energy Requirement (RER)
        const RER = 70 * Math.pow(w, 0.75);

        // Multipliers
        let multiplier = 1.6; // adult average
        if (ageStage === "puppy") multiplier = 3.0;
        if (ageStage === "senior") multiplier = 1.2;
        if (activity === "low") multiplier *= 0.8;
        if (activity === "high") multiplier *= 1.4;

        const MER = RER * multiplier; // Maintenance Energy Requirement

        // Nutrient breakdown (% of calories)
        let proteinPct = 25;
        let fatPct = 15;
        let carbsPct = 60;

        if (ageStage === "puppy") {
            proteinPct = 28;
            fatPct = 20;
            carbsPct = 52;
        } else if (ageStage === "senior") {
            proteinPct = 22;
            fatPct = 12;
            carbsPct = 66;
        }

        // Convert percentages into grams
        const protein = ((MER * proteinPct) / 100) / 4;
        const fat = ((MER * fatPct) / 100) / 9;
        const carbs = ((MER * carbsPct) / 100) / 4;

        // Tips system
        const tips = [];

        if (ageStage === "puppy") {
            tips.push("High protein (28–30%) and fat (18–22%) are essential for growth.");
            tips.push("Ensure DHA and EPA (Omega-3) for brain and vision development.");
            tips.push("Calcium and phosphorus balance (1.2:1) supports bone growth.");
        } else if (ageStage === "adult") {
            tips.push("Balanced diet with ~25% protein and ~15% fat maintains healthy weight.");
            tips.push("Include Omega-6 fatty acids for skin and coat health.");
            tips.push("Provide antioxidants like Vitamin E and C for immune support.");
        } else if (ageStage === "senior") {
            tips.push("Lower fat (~10–12%) helps prevent obesity in less active seniors.");
            tips.push("Add joint-support nutrients like glucosamine & chondroitin.");
            tips.push("High-quality, easily digestible protein (22–25%) is recommended.");
        }

        if (activity === "high") {
            tips.push("Active dogs benefit from higher fat (~20%) for energy.");
            tips.push("B vitamins and iron help sustain stamina.");
        } else if (activity === "low") {
            tips.push("Monitor calorie intake to avoid obesity.");
            tips.push("Add fiber (~5–8%) to improve satiety.");
        }

        if (MER > 2000) {
            tips.push("Large breeds need glucosamine and chondroitin for joint support.");
        } else if (MER < 500) {
            tips.push("Small breeds need calorie-dense meals in smaller portions.");
        }

        // Nutrition Score (basic grading system)
        let score = "B";
        if (ageStage === "puppy" && protein >= 50 && fat >= 20) score = "A";
        if (ageStage === "senior" && fat > 15) score = "C";
        if (activity === "low" && fat > 18) score = "D";

        // Dynamic message based on score
        let scoreMessage = "";
        let scoreColor = "#000"; // default
        if (score === "A") {
            scoreMessage = "🟢 Excellent balance! Your dog's diet matches healthy standards.";
            scoreColor = "green";
        } else if (score === "B") {
            scoreMessage = "🟡 Good diet, but some improvements can be made.";
            scoreColor = "orange";
        } else if (score === "C") {
            scoreMessage = "🟠 Your dog's nutrition may need adjustments, especially fat/protein balance.";
            scoreColor = "#ff6600"; // dark orange
        } else if (score === "D") {
            scoreMessage = "🔴 High risk of imbalance! Please consult a vet or adjust the diet plan.";
            scoreColor = "red";
        }

        setResult({
            calories: MER.toFixed(0),
            protein: protein.toFixed(1),
            fat: fat.toFixed(1),
            carbs: carbs.toFixed(1),
            tips,
            score,
            scoreMessage,
            scoreColor,
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🐶 Nutrient Calculator</Text>

            <TextInput
                style={styles.input}
                placeholder="Dog's Weight (kg)"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
            />
            <TextInput
                style={styles.input}
                placeholder="Age Stage (puppy, adult, senior)"
                value={ageStage}
                onChangeText={setAgeStage}
            />
            <TextInput
                style={styles.input}
                placeholder="Activity Level (low, medium, high)"
                value={activity}
                onChangeText={setActivity}
            />

            <TouchableOpacity style={styles.button} onPress={calculateNutrients}>
                <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>

            {result && (
                <View style={styles.result}>
                    <Text style={styles.resultTitle}>Daily Requirements:</Text>
                    <Text>Calories: {result.calories} kcal</Text>
                    <Text>Protein: {result.protein} g</Text>
                    <Text>Fat: {result.fat} g</Text>
                    <Text>Carbs: {result.carbs} g</Text>

                    <Text style={[styles.scoreText, { color: result.scoreColor }]}>
                        Nutrition Score: {result.score}
                    </Text>
                    <Text style={{ color: result.scoreColor, marginTop: 5 }}>
                        {result.scoreMessage}
                    </Text>

                    <View style={{ marginTop: 15 }}>
                        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
                            Tips:
                        </Text>
                        {result.tips.map((tip, idx) => (
                            <Text key={idx} style={styles.tip}>
                                • {tip}
                            </Text>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
        flexGrow: 1,
    },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    button: {
        backgroundColor: "#fcb69f",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    result: { marginTop: 20, padding: 15, backgroundColor: "#f9f9f9", borderRadius: 10 },
    resultTitle: { fontWeight: "bold", marginBottom: 10, fontSize: 18 },
    scoreText: { marginTop: 10, fontSize: 16, fontWeight: "bold" },
    tip: { fontSize: 14, marginBottom: 5, color: "#444" },
});
