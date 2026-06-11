import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function PublicLayout() {
  return (
    <Stack initialRouteName="welcome">
      <Stack.Screen
        name="welcome"
        options={{
          title: "Welcome",
          headerTransparent: Platform.OS === "ios",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Sign Up",
          headerTransparent: Platform.OS === "ios",
          headerLargeTitle: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          title: "Sign In",
          headerTransparent: Platform.OS === "ios",
          headerLargeTitle: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
