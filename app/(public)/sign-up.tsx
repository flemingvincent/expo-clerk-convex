import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, Button, View, ScrollView, Pressable, StyleSheet } from "react-native";

import { useSignUp } from "@/hooks/useSignUp";

export default function Page() {
  const { isLoaded, signUp, verifyOtp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [token, setToken] = useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

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
    if (!isLoaded) {
      return;
    }

    try {
      await verifyOtp({
        token,
      });
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <ScrollView
      automaticallyAdjustsScrollIndicatorInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 8 }}
      keyboardShouldPersistTaps="handled"
    >
      {pendingVerification ? (
        <>
          <Text>Verification Code:</Text>
          <TextInput
            autoComplete="one-time-code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            value={token}
            placeholder="Enter your verification code"
            onChangeText={(token) => {
              setToken(token);
            }}
          />
          <Button title="Verify" onPress={onVerifyPress} disabled={!isLoaded || !token} />
        </>
      ) : (
        <>
          <Text>Email Address:</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            placeholder="Enter email"
            onChangeText={(email) => {
              setEmail(email);
            }}
          />
          <Text>Password:</Text>
          <TextInput
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            placeholder="Enter password"
            secureTextEntry
            onChangeText={(password) => {
              setPassword(password);
            }}
          />
          <Button
            title="Continue"
            onPress={onSignUpPress}
            disabled={!isLoaded || !email || !password}
          />
          <View style={styles.footer}>
            <Text>Already have an account? </Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                router.replace("/sign-in");
              }}
            >
              <Text>Sign in</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
