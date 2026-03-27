import { useState } from "react";
import { Text, TextInput, Button, View, ScrollView } from "react-native";

import { router } from "expo-router";

import { useSignUp } from "@/hooks/useSignUp";

export default function Page() {
  const { isLoaded, signUp, verifyOtp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [token, setToken] = useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp({
        email,
        password,
      });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      await verifyOtp({
        token,
      });
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <ScrollView
        automaticallyAdjustsScrollIndicatorInsets
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 8 }}
      >
        <Text>Verification Code:</Text>
        <TextInput
          value={token}
          placeholder="Enter your verification code"
          onChangeText={(token) => setToken(token)}
        />
        <Button title="Verify" onPress={onVerifyPress} disabled={!token} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      automaticallyAdjustsScrollIndicatorInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 8 }}
    >
      <Text>Email Address:</Text>
      <TextInput
        autoCapitalize="none"
        value={email}
        placeholder="Enter email"
        onChangeText={(email) => setEmail(email)}
      />
      <Text>Password:</Text>
      <TextInput
        value={password}
        placeholder="Enter password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      <Button
        title="Continue"
        onPress={onSignUpPress}
        disabled={!email || !password}
      />
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Text>Already have an account? </Text>
        <Text onPress={() => router.replace("/sign-in")}>Sign in</Text>
      </View>
    </ScrollView>
  );
}
