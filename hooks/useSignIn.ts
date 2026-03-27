import { router } from "expo-router";
import { useAuth, useSignIn as useClerkSignIn } from "@clerk/expo";

export const useSignIn = () => {
  const { isLoaded } = useAuth();
  const { signIn } = useClerkSignIn();

  const signInWithPassword = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
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
      await signIn.finalize({
        navigate: async ({ session }) => {
          if (session.currentTask) {
            console.log("Unhandled session task:", session.currentTask);
            return;
          }

          router.replace("/");
        },
      });
    }
  };

  return {
    isLoaded,
    signInWithPassword,
  };
};
