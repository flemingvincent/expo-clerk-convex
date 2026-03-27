import { router } from "expo-router";
import { useAuth, useSignUp as useClerkSignUp } from "@clerk/expo";

export const useSignUp = () => {
  const { isLoaded } = useAuth();
  const { signUp: clerkSignUp } = useClerkSignUp();

  const signUp = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
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

    const { error: sendCodeError } =
      await clerkSignUp.verifications.sendEmailCode();
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
      await clerkSignUp.finalize({
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
    signUp,
    verifyOtp,
  };
};
