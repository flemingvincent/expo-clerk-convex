import { useEffect } from "react";

import { Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { convex } from "@/lib/convex";

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

const RootNavigator = () => {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { isLoading: isConvexLoaded } = useConvexAuth();
  const isAuthenticated = isClerkLoaded && isSignedIn === true;
  const isUnauthenticated = isClerkLoaded && isSignedIn === false;

  useEffect(() => {
    if (isClerkLoaded && !isConvexLoaded) {
      SplashScreen.hide();
    }
  }, [isClerkLoaded, isConvexLoaded]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "none",
        animationDuration: 0,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>

      <Stack.Protected guard={isUnauthenticated}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <RootNavigator />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
