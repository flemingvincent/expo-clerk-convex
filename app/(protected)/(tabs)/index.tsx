import { Button, View } from "react-native";

import { useClerk } from "@clerk/expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Page() {
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
