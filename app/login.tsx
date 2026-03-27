import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

          {/* Email */}
          <TextInput placeholder="Email" style={styles.input} />

          {/* Password */}
          <TextInput placeholder="Password" secureTextEntry style={styles.input} />

          {/* Confirm Password (Sign Up only) */}
          {!isLogin && (
            <TextInput placeholder="Confirm Password" secureTextEntry style={styles.input} />
          )}

          {/* Login/CreateAcc Button */}
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/home")}>
            <Text style={styles.buttonText}>{isLogin ? "Login" : "Create Account"}</Text>
          </TouchableOpacity>

          {/* Signup/Login */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  toggleText: {
    marginTop: 15,
    textAlign: "center",
    color: "blue",
  },
});
