import { useSignUp as useClerkSignUp } from "@clerk/expo";
import { router } from "expo-router";

export const useSignUp = () => {
  const { fetchStatus, signUp: clerkSignUp } = useClerkSignUp();
  const isLoaded = fetchStatus === "idle";

  const signUp = async ({ email, password }: { email: string; password: string }) => {
    if (!isLoaded) {
      throw new Error("Sign up is not ready yet");
    }

    const { error } = await clerkSignUp.password({
      emailAddress: email,
      password,
    });

    if (error) {
      throw error;
    }

    const { error: sendCodeError } = await clerkSignUp.verifications.sendEmailCode();
    if (sendCodeError) {
      throw sendCodeError;
    }
  };

  const verifyOtp = async ({ token }: { token: string }) => {
    if (!isLoaded) {
      throw new Error("Verification is not ready yet");
    }

    const { error } = await clerkSignUp.verifications.verifyEmailCode({
      code: token,
    });

    if (error) {
      throw error;
    }

    if (clerkSignUp.status === "complete") {
      const { error: finalizeError } = await clerkSignUp.finalize({
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
    signUp,
    verifyOtp,
  };
};
