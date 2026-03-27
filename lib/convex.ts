import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Add EXPO_PUBLIC_CONVEX_URL to your .env file");
}

export const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});
