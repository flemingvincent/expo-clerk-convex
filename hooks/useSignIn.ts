import { useSignIn as useClerkSignIn } from "@clerk/expo";
import { router } from "expo-router";

export const useSignIn = () => {
  const { fetchStatus, signIn } = useClerkSignIn();
  const isLoaded = fetchStatus === "idle";

  const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
    if (!isLoaded) {
      throw new Error("Sign in is not ready yet");
    }

    const { error } = await signIn.password({
      identifier: email,
      password,
    });

    if (error) {
      throw error;
    }

    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize({
        navigate: async ({ session }) => {
          if (session.currentTask) {
            console.log("Unhandled session task:", session.currentTask);
            return;
          }

          router.replace("/");
        },
      });

      if (finalizeError) {
        throw finalizeError;
      }
    }
  };

  return {
    isLoaded,
    signInWithPassword,
  };
};
