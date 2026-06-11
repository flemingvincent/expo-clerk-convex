import { defineConfig } from "oxlint";
import native from "oxlint-config-universe/native";
import typescriptAnalysis from "oxlint-config-universe/typescript-analysis";

export default defineConfig({
  extends: [native, typescriptAnalysis],
  ignorePatterns: ["convex/_generated/**"],
});
