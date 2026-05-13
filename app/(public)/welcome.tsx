import { Button, View } from "react-native";

import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        gap: 8,
        paddingBottom: insets.bottom,
      }}
    >
      <Button title="Sign Up" onPress={() => router.push("/sign-up")} />
      <Button title="Sign In" onPress={() => router.push("/sign-in")} />
    </View>
  );
}
