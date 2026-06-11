import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, Button, View, ScrollView, Pressable, StyleSheet } from "react-native";

import { useSignIn } from "@/hooks/useSignIn";

export default function Page() {
  const { signInWithPassword, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signInWithPassword({
        email,
        password,
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
        autoComplete="password"
        textContentType="password"
        value={password}
        placeholder="Enter password"
        secureTextEntry
        onChangeText={(password) => {
          setPassword(password);
        }}
      />
      <Button
        title="Continue"
        onPress={onSignInPress}
        disabled={!isLoaded || !email || !password}
      />
      <View style={styles.footer}>
        <Text>{"Don't have an account? "}</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            router.replace("/sign-up");
          }}
        >
          <Text>Sign up</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
